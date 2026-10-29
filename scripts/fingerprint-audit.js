#!/usr/bin/env node
// Measures the automation-detection surface of the browser the bot ships.
//
//   node scripts/fingerprint-audit.js                # stealth on (bot defaults)
//   node scripts/fingerprint-audit.js --baseline     # raw Puppeteer, no patches
//   node scripts/fingerprint-audit.js --headless     # headless variant
//   node scripts/fingerprint-audit.js --json out.json
//
// The checks are self-contained (no third-party site) so the result is
// reproducible and does not leak the user's IP to a fingerprinting service.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');
const {launchOptions, applyStealth, hideHeadlessUA} = require('../src/core/stealth.js');

function parseArgs(argv) {
    const args = {baseline: false, headless: false, json: null, chrome: null};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--baseline') args.baseline = true;
        else if (arg === '--headless') args.headless = true;
        else if (arg === '--json') args.json = argv[++i];
        else if (arg === '--chrome') args.chrome = argv[++i];
    }
    return args;
}

// Runs in the page. Everything here must be synchronous except the
// permissions probe, which is awaited by the caller through a promise.
async function collect() {
    const descriptor = (target, prop) => {
        const d = Object.getOwnPropertyDescriptor(target, prop);
        return d ? {hasGetter: typeof d.get === 'function', configurable: d.configurable} : null;
    };
    const getterSource = (target, prop) => {
        const d = Object.getOwnPropertyDescriptor(target, prop);
        if (!d || typeof d.get !== 'function') return null;
        try {
            return Function.prototype.toString.call(d.get);
        } catch (e) {
            return '<throws>';
        }
    };

    let webglVendor = null;
    let webglRenderer = null;
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                webglVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) { /* ignore */ }

    let notificationPermission = null;
    let permissionsNotification = null;
    try {
        if (typeof Notification !== 'undefined') notificationPermission = Notification.permission;
        if (navigator.permissions) {
            const status = await navigator.permissions.query({name: 'notifications'});
            permissionsNotification = status.state;
        }
    } catch (e) { /* ignore */ }

    return {
        webdriver: navigator.webdriver,
        webdriverOwn: descriptor(navigator, 'webdriver'),
        webdriverProto: descriptor(Navigator.prototype, 'webdriver'),
        webdriverGetter: getterSource(Navigator.prototype, 'webdriver'),
        languages: Array.from(navigator.languages ?? []),
        language: navigator.language,
        languagesGetter: getterSource(Navigator.prototype, 'languages'),
        plugins: navigator.plugins ? navigator.plugins.length : 0,
        mimeTypes: navigator.mimeTypes ? navigator.mimeTypes.length : 0,
        pdfViewerEnabled: navigator.pdfViewerEnabled,
        chrome: Boolean(window.chrome),
        chromeKeys: window.chrome ? Object.keys(window.chrome).sort() : [],
        userAgent: navigator.userAgent,
        brands: navigator.userAgentData ? navigator.userAgentData.brands : null,
        uaMobile: navigator.userAgentData ? navigator.userAgentData.mobile : null,
        platform: navigator.platform,
        vendor: navigator.vendor,
        productSub: navigator.productSub,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        notificationPermission,
        permissionsNotification,
        webglVendor,
        webglRenderer,
        screen: [screen.width, screen.height, screen.availWidth, screen.availHeight, screen.colorDepth],
        window: [window.outerWidth, window.outerHeight, window.innerWidth, window.innerHeight],
        hasFocus: document.hasFocus(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            downlink: navigator.connection.downlink
        } : null,
        mediaDevices: Boolean(navigator.mediaDevices),
        bluetooth: Boolean(navigator.bluetooth),
        cdpLeak: Object.keys(window).some(key => /^(cdc_|__webdriver|__driver|__selenium)/.test(key)),
        automationFlags: navigator.webdriver === true
    };
}

function buildChecks(data) {
    const ua = data.userAgent || '';
    const brands = (data.brands || []).map(entry => entry.brand).join(',');
    const normalizePermission = value => (value === 'default' ? 'prompt' : value);
    return [
        {
            name: 'navigator.webdriver is not true',
            pass: data.webdriver !== true,
            detail: String(data.webdriver)
        },
        {
            name: 'navigator.webdriver getter looks native',
            pass: !data.webdriverGetter || data.webdriverGetter.includes('[native code]'),
            detail: data.webdriverGetter
        },
        {
            name: 'navigator.webdriver lives on the prototype',
            pass: Boolean(data.webdriverProto) && data.webdriverOwn === null,
            detail: `own=${JSON.stringify(data.webdriverOwn)} proto=${Boolean(data.webdriverProto)}`
        },
        {
            name: 'UA does not mention HeadlessChrome',
            pass: !/HeadlessChrome/i.test(ua),
            detail: ua
        },
        {
            name: 'UA advertises Chrome, not only Chromium',
            pass: /Chrome\/\d+/.test(ua),
            detail: ua
        },
        {
            name: 'User-Agent Client Hints include Google Chrome',
            pass: brands.includes('Google Chrome'),
            detail: brands || '(no userAgentData)'
        },
        {
            name: 'Polish language is advertised',
            pass: (data.languages || []).includes('pl-PL'),
            detail: (data.languages || []).join(',')
        },
        {
            name: 'PDF viewer plugin present',
            pass: data.plugins > 0,
            detail: `${data.plugins} plugins`
        },
        {
            name: 'Notification permission is consistent',
            pass: normalizePermission(data.notificationPermission)
                === normalizePermission(data.permissionsNotification),
            detail: `Notification=${data.notificationPermission} permissions=${data.permissionsNotification}`
        },
        {
            name: 'window.chrome is present',
            pass: data.chrome,
            detail: data.chromeKeys.join(',') || '(missing)'
        },
        {
            name: 'WebGL renderer is a real GPU path',
            pass: Boolean(data.webglRenderer) && !/SwiftShader|llvmpipe|Software/i.test(data.webglRenderer),
            detail: `${data.webglVendor} / ${data.webglRenderer}`
        },
        {
            name: 'window has non-zero outer size',
            pass: data.window[0] > 0 && data.window[1] > 0,
            detail: data.window.join('x')
        },
        {
            name: 'document has focus',
            pass: data.hasFocus,
            detail: String(data.hasFocus)
        },
        {
            name: 'no ChromeDriver CDP globals',
            pass: !data.cdpLeak,
            detail: String(data.cdpLeak)
        },
        {
            name: 'hardware concurrency is plausible',
            pass: (data.hardwareConcurrency || 0) >= 2,
            detail: String(data.hardwareConcurrency)
        }
    ];
}

async function clickTrustCheck(page) {
    // Mirrors how the bot clicks "check"/"next": a real mouse event via CDP.
    await page.setContent('<button id="b" style="width:200px;height:80px">ok</button>');
    await page.evaluate(() => {
        window.__trusted = null;
        document.getElementById('b').addEventListener('click', event => {
            window.__trusted = event.isTrusted;
        });
    });
    await page.click('#b');
    await new Promise(resolve => setTimeout(resolve, 100));
    return page.evaluate(() => window.__trusted);
}

// A localhost origin counts as a secure context, so userAgentData,
// permissions.query and the Notification API behave like they do on https.
function startServer() {
    const server = http.createServer((request, response) => {
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        response.end('<!doctype html><meta charset="utf-8"><title>audit</title><body></body>');
    });
    return new Promise(resolve => {
        server.listen(0, '127.0.0.1', () => {
            resolve({server, origin: `http://127.0.0.1:${server.address().port}/`});
        });
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const options = args.baseline
        ? {headless: args.headless, defaultViewport: args.headless ? {width: 1366, height: 900} : null}
        : launchOptions({headless: args.headless, executablePath: args.chrome || undefined});

    if (args.baseline) {
        options.args = [`--window-size=1366,900`, '--no-first-run', '--no-default-browser-check'];
    }

    const browser = await puppeteer.launch(options);
    const {server, origin} = await startServer();
    let exitCode = 0;
    try {
        const page = await browser.newPage();
        if (!args.baseline) {
            await applyStealth(page);
            if (args.headless) await hideHeadlessUA(page, browser);
        }
        await page.goto(origin, {waitUntil: 'domcontentloaded'});

        const data = await page.evaluate(collect);
        const checks = buildChecks(data);
        const clickTrusted = await clickTrustCheck(page);

        const label = args.baseline ? 'BASELINE (no patches)' : 'STEALTH (bot defaults)';
        console.log(`\ninstaling-bot fingerprint audit — ${label}`);
        console.log(`headless=${args.headless} chrome=${(await browser.version())}\n`);

        for (const check of checks) {
            const status = check.pass ? 'PASS' : 'FAIL';
            if (!check.pass) exitCode = 1;
            console.log(`[${status}] ${check.name}`);
            console.log(`       ${check.detail}`);
        }
        console.log(`[${clickTrusted ? 'PASS' : 'FAIL'}] mouse click is trusted`);
        console.log(`       isTrusted=${clickTrusted}`);
        if (!clickTrusted) exitCode = 1;

        const report = {
            generatedAt: new Date().toISOString(),
            mode: args.baseline ? 'baseline' : 'stealth',
            headless: args.headless,
            browser: await browser.version(),
            passed: checks.filter(c => c.pass).length,
            total: checks.length,
            clickTrusted,
            checks,
            raw: data
        };

        if (args.json) {
            fs.mkdirSync(path.dirname(path.resolve(args.json)), {recursive: true});
            fs.writeFileSync(args.json, JSON.stringify(report, null, 2));
            console.log(`\nReport written to ${args.json}`);
        }
        console.log(`\n${report.passed}/${report.total} checks passed.`);
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
    process.exit(exitCode);
}

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = {buildChecks, collect};