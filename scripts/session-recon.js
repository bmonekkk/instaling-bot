#!/usr/bin/env node
// Live reconnaissance of instaling.pl: logs in, captures every request the
// student panel makes, the storage it writes, the forms it submits and whether
// the clicks/keystrokes the bot produces are trusted events.
//
//   node scripts/session-recon.js                 # login + capture the dashboard
//   node scripts/session-recon.js --start         # also open a session and
//                                                 # capture the first question
//   node scripts/session-recon.js --manual        # type the password yourself
//   node scripts/session-recon.js --headless
//
// This never answers a question, so it does not submit wrong answers to the
// user's account. Output goes to research/session-recon/ (gitignored) and has
// credentials redacted.
//
// Credentials come from INSTALING_LOGIN / INSTALING_PASSWORD or config/Config.json.

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const puppeteer = require('puppeteer');

const {launchOptions, applyStealth, hideHeadlessUA} = require('../src/core/stealth.js');
const {resolveCredentials} = require('../src/credentials.js');
const {SELECTORS} = require('../src/core/selectors.js');

const ROOT = path.join(__dirname, '..');
const LOGIN_URL = 'https://instaling.pl/teacher.php?page=login';

function parseArgs(argv) {
    const args = {manual: false, headless: false, start: false, out: 'research/session-recon', chrome: null};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--manual') args.manual = true;
        else if (arg === '--headless') args.headless = true;
        else if (arg === '--start') args.start = true;
        else if (arg === '--out') args.out = argv[++i];
        else if (arg === '--chrome') args.chrome = argv[++i];
    }
    return args;
}

function loadCredentials() {
    const file = path.join(ROOT, 'config', 'Config.json');
    let stored = {};
    if (fs.existsSync(file)) {
        try {
            const raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
            stored = raw.credentials ?? {login: raw.login, password: raw.password};
        } catch (error) {
            console.warn(`Could not read ${file}: ${error.message}`);
        }
    }
    return resolveCredentials(stored);
}

function redact(text, secrets) {
    let result = String(text ?? '');
    for (const secret of secrets) {
        if (!secret || String(secret).length < 3) continue;
        result = result.split(String(secret)).join('[redacted]');
    }
    return result;
}

// Runs before every site script. Records which input events were trusted.
function instrument() {
    window.__recon = {clicks: [], keys: [], inputs: [], submits: [], errors: []};
    const push = (bucket, entry) => {
        if (window.__recon[bucket].length > 300) return;
        window.__recon[bucket].push(entry);
    };
    const describe = target => {
        if (!target || !target.tagName) return null;
        return {
            tag: target.tagName.toLowerCase(),
            id: target.id || null,
            name: target.getAttribute?.('name') || null,
            type: target.getAttribute?.('type') || null,
            cls: typeof target.className === 'string' ? target.className.slice(0, 120) : null
        };
    };

    document.addEventListener('click', event => push('clicks', {
        trusted: event.isTrusted,
        target: describe(event.target),
        x: event.clientX,
        y: event.clientY
    }), true);
    document.addEventListener('keydown', event => push('keys', {
        trusted: event.isTrusted,
        key: event.key,
        target: describe(event.target)
    }), true);
    document.addEventListener('input', event => push('inputs', {
        trusted: event.isTrusted,
        target: describe(event.target),
        valueLength: event.target && 'value' in event.target ? String(event.target.value).length : null
    }), true);
    document.addEventListener('submit', event => push('submits', {
        trusted: event.isTrusted,
        target: describe(event.target),
        action: event.target && event.target.getAttribute ? event.target.getAttribute('action') : null
    }), true);
    window.addEventListener('error', event => push('errors', {message: String(event.message)}));
}

async function dismissConsent(page) {
    const selectors = [
        '.fc-cta-do-not-consent',
        'button.fc-cta-do-not-consent',
        '#onetrust-reject-all-handler',
        'button[aria-label="Odrzuć wszystkie"]'
    ];
    for (const selector of selectors) {
        const element = await page.$(selector).catch(() => null);
        if (!element) continue;
        if (!(await element.isVisible().catch(() => false))) continue;
        await element.click().catch(() => null);
        await new Promise(resolve => setTimeout(resolve, 400));
        return true;
    }
    return false;
}

async function waitForEnter(prompt) {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    return new Promise(resolve => rl.question(prompt, () => {
        rl.close();
        resolve();
    }));
}

async function firstVisible(page, selectorList) {
    for (const selector of selectorList) {
        const element = await page.$(selector).catch(() => null);
        if (element) return selector;
    }
    return null;
}

async function waitForAnyVisible(page, selectorList, timeout = 15000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const selector = await firstVisible(page, selectorList);
        if (selector) return selector;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    return null;
}

async function snapshot(page, dir, name) {
    const html = await page.evaluate(() => document.documentElement.outerHTML).catch(() => '');
    fs.writeFileSync(path.join(dir, `${name}.html`), html);
    await page.screenshot({path: path.join(dir, `${name}.png`), fullPage: true}).catch(() => null);
}

async function collect(page) {
    return page.evaluate(() => {
        const dump = storage => {
            const out = {};
            try {
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    const value = storage.getItem(key);
                    out[key] = value.length > 500 ? `${value.slice(0, 500)}…` : value;
                }
            } catch (e) { /* ignore */ }
            return out;
        };
        const forms = Array.from(document.forms).map(form => ({
            action: form.getAttribute('action'),
            method: form.getAttribute('method'),
            fields: Array.from(form.elements).map(element => ({
                name: element.name || null,
                type: element.type || null,
                value: element.type === 'hidden' ? element.value : null
            }))
        }));
        const scripts = Array.from(document.scripts).map(script => script.src || '(inline)');
        return {
            url: location.href,
            title: document.title,
            localStorage: dump(localStorage),
            sessionStorage: dump(sessionStorage),
            forms,
            scripts,
            cookie: document.cookie,
            recon: window.__recon,
            resources: performance.getEntriesByType('resource').map(entry => entry.name)
        };
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const credentials = loadCredentials();
    const outDir = path.resolve(ROOT, args.out);
    fs.mkdirSync(outDir, {recursive: true});

    const options = launchOptions({
        headless: args.headless,
        executablePath: args.chrome || process.env.INSTALING_CHROME || undefined
    });

    const browser = await puppeteer.launch(options);
    const requests = [];
    const responses = [];
    const navigations = [];
    let exitCode = 0;

    try {
        const page = await browser.newPage();
        await applyStealth(page);
        if (args.headless) await hideHeadlessUA(page, browser);
        await page.evaluateOnNewDocument(instrument);

        page.on('request', request => {
            requests.push({
                method: request.method(),
                url: request.url(),
                type: request.resourceType(),
                postData: redact(request.postData() || '', [credentials.password]).slice(0, 2000)
            });
        });
        page.on('response', response => {
            responses.push({
                status: response.status(),
                url: response.url(),
                contentType: response.headers()['content-type'] || null
            });
        });
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) navigations.push(frame.url());
        });

        console.log('→ opening the login page');
        await page.goto(LOGIN_URL, {waitUntil: 'domcontentloaded', timeout: 60000});
        await dismissConsent(page);

        if (args.manual) {
            await waitForEnter('Log in manually in the opened window, then press Enter here…');
        } else {
            if (!credentials.login || !credentials.password) {
                throw new Error('No credentials. Set INSTALING_LOGIN/INSTALING_PASSWORD or create config/Config.json.');
            }
            console.log('→ signing in');
            await page.type(SELECTORS.loginEmail[0], credentials.login, {delay: 25});
            await page.type(SELECTORS.loginMaskedField[0], credentials.password, {delay: 25});
            await Promise.all([
                page.waitForNavigation({waitUntil: 'domcontentloaded', timeout: 60000}).catch(() => null),
                page.click(SELECTORS.loginSubmit[0]).catch(async () => {
                    await page.evaluate(selector => document.querySelector(selector)?.click(), SELECTORS.loginSubmit[0]);
                })
            ]);
            await new Promise(resolve => setTimeout(resolve, 1200));
            await dismissConsent(page);
        }

        const url = page.url();
        if (/teacher\.php\?page=login/i.test(url)) {
            throw new Error('Still on the login page — the credentials were rejected.');
        }
        console.log(`→ logged in: ${url}`);

        const dashboard = await collect(page);
        fs.writeFileSync(path.join(outDir, 'dashboard.json'), JSON.stringify(dashboard, null, 2));
        await snapshot(page, outDir, 'dashboard');

        if (args.start) {
            const selector = await waitForAnyVisible(page, SELECTORS.startSession, 10000);
            if (!selector) {
                console.log('→ no "start session" button found on this page');
            } else {
                console.log(`→ opening a session (${selector})`);
                await page.click(selector).catch(async () => {
                    await page.evaluate(sel => document.querySelector(sel)?.click(), selector);
                });
                await new Promise(resolve => setTimeout(resolve, 2500));

                // The site may ask to continue a previous session or to start a
                // new one; mirror the bot's startSession() flow.
                const cont = await waitForAnyVisible(page, SELECTORS.continueSession, 6000);
                if (cont) {
                    console.log(`→ continuing a previous session (${cont})`);
                    await page.click(cont).catch(() => null);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    const fresh = await waitForAnyVisible(page, SELECTORS.newSession, 4000);
                    if (fresh) {
                        console.log(`→ starting a new session (${fresh})`);
                        await page.click(fresh).catch(() => null);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

                const ready = await waitForAnyVisible(
                    page,
                    SELECTORS.answer.concat(SELECTORS.newWordForm),
                    20000
                );
                console.log(ready ? `→ session page ready (${ready})` : '→ session page did not expose an answer field');
                const session = await collect(page);
                session.prompt = await page.evaluate(sel => {
                    const node = document.querySelector(sel);
                    return node ? node.innerText : null;
                }, SELECTORS.usage[0]).catch(() => null);
                fs.writeFileSync(path.join(outDir, 'session.json'), JSON.stringify(session, null, 2));
                await snapshot(page, outDir, 'session');
            }
        }

        const report = {
            generatedAt: new Date().toISOString(),
            headless: args.headless,
            browser: await browser.version(),
            navigations,
            requests,
            responses,
            cookies: await page.cookies(),
            dashboardUrl: dashboard.url,
            storageKeys: {
                localStorage: Object.keys(dashboard.localStorage),
                sessionStorage: Object.keys(dashboard.sessionStorage)
            }
        };
        fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

        console.log(`\n→ wrote ${path.relative(ROOT, outDir)}/{report,dashboard,session}.json`);
        console.log('→ inspect report.json for the exact endpoints the site calls.');
    } catch (error) {
        console.error(`recon failed: ${redact(error.message, [credentials.password])}`);
        exitCode = 1;
    } finally {
        await browser.close();
    }
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}