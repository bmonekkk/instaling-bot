const config = require('./config.js');
const fs = require('fs/promises');
const path = require('path');
const {EventEmitter} = require('events');
const {interval, sendAndClear, yellow} = require('./printer.js');

const ROOT = path.resolve(__dirname, '..');
const eventer = new EventEmitter();

eventer.on('stopBot', async code => {
    try {
        clearInterval(interval);
        await sendAndClear();
    } catch (e) {
        console.error(e);
    }
    process.exit(code || 0);
});

async function prepare() {
    await Promise.all([
        fs.rm(path.join(ROOT, 'pages'), {recursive: true, force: true}),
        fs.rm(path.join(ROOT, 'screenshots'), {recursive: true, force: true})
    ]);
    await Promise.all([
        fs.mkdir(path.join(ROOT, 'pages'), {recursive: true}),
        fs.mkdir(path.join(ROOT, 'screenshots'), {recursive: true})
    ]);
}

/**
 * Returns the first selector from the list that is present in the DOM (and visible by default).
 */
async function findSelector(page, selectors, timeout = config.delays.selector) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        for (const selector of list) {
            const found = await page.$(selector).catch(() => null);
            if (found) {
                const visible = await found.isVisible?.().catch?.(() => false);
                if (visible !== false) return selector;
            }
        }
        await delay(150);
    }
    return null;
}

async function waitForAny(page, selectors, timeout = config.delays.selector) {
    const selector = await findSelector(page, selectors, timeout);
    if (!selector) {
        throw new Error(`None of the selectors appeared in ${timeout}ms: ${[].concat(selectors).join(', ')}`);
    }
    return selector;
}

async function getText(page, selector, timeout = config.delays.selector) {
    const found = await findSelector(page, selector, timeout);
    if (!found) {
        throw new Error(`Element not found: ${[].concat(selector).join(', ')}`);
    }
    return page.$eval(found, element => (element.textContent || '').trim());
}

async function dismissConsent(page, {timeout = 6000} = {}) {
    const rejectSelectors = [
        '.fc-cta-do-not-consent',                 // Google Funding Choices
        'button.fc-cta-do-not-consent',
        '#onetrust-reject-all-handler',
        'button[aria-label="OdrzuÄ‡ wszystkie"]',
        'button[aria-label="Reject all"]'
    ];
    const acceptSelectors = [
        '.fc-cta-consent',
        '#onetrust-accept-btn-handler',
        'button[aria-label="Akceptuj wszystkie"]',
        'button[aria-label="Accept all"]'
    ];

    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        for (const selector of rejectSelectors.concat(acceptSelectors)) {
            const element = await page.$(selector).catch(() => null);
            if (!element) continue;
            const visible = await element.isVisible().catch(() => false);
            if (!visible) continue;
            try {
                // Consent dialogs often cover the page. A DOM click is the most reliable way.
                await page.evaluate(sel => document.querySelector(sel)?.click(), selector);
                yellow(`[COOKIE] Dismissed consent dialog (${selector})`);
                await delay(500);
                return true;
            } catch (e) {
                // ignore and retry
            }
        }
        await delay(250);
    }
    return false;
}

async function click(page, selector) {
    const found = await waitForAny(page, selector);
    const element = await page.$(found);
    await element.evaluate(el => el.scrollIntoView({block: 'center', inline: 'center'}));

    // If something (cookie banner, ad) covers the button, Puppeteer's click would hit it.
    const covered = await page.$eval(found, el => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return !top || !(el === top || el.contains(top) || top.contains(el));
    }).catch(() => false);

    if (covered) {
        await dismissConsent(page, {timeout: 1500});
    }

    if (await page.$eval(found, el => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return !top || !(el === top || el.contains(top) || top.contains(el));
    }).catch(() => false)) {
        // Still covered - fall back to a DOM click.
        await page.$eval(found, el => el.click());
    } else {
        await page.click(found);
    }
}

/**
 * Clicks a button/page element that may trigger a full page navigation.
 * It does not hang when the click only changes the page with AJAX.
 */
async function clickAndWait(page, selector, timeout = 30000) {
    const navigation = page.waitForNavigation({waitUntil: 'domcontentloaded', timeout}).catch(() => null);
    await click(page, selector);
    return navigation;
}

async function clickWait(page, selector, wait_min = config.delays.click_min, wait_max = config.delays.click_max) {
    await click(page, selector);
    return delay(getRandomInt(wait_min, wait_max));
}

async function type(page, selector, text, delayTime) {
    const found = await waitForAny(page, selector);
    await page.$eval(found, el => {
        el.focus();
        el.value = '';
    }).catch(() => {});
    return page.type(found, text, {delay: delayTime ?? getRandomInt(config.delays.type_min, config.delays.type_max)});
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function savePage(page, i) {
    if (!page) return;
    try {
        const html = await page.evaluate(() => document.documentElement.outerHTML);
        await Promise.all([
            page.screenshot({path: path.join(ROOT, 'screenshots', `answer-${i}.png`), fullPage: true}).catch(() => null),
            fs.writeFile(path.join(ROOT, 'pages', `answer-${i}.html`), html, 'utf-8')
        ]);
    } catch (e) {
        // Saving diagnostics must never crash the bot.
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

async function checkVisibility(page, selector, timeout = 1000) {
    const found = await findSelector(page, selector, timeout);
    if (!found) {
        throw new Error(`Element not found: ${[].concat(selector).join(', ')}`);
    }
    return page.$(found);
}

async function isVisible(page, selector, timeout) {
    return checkVisibility(page, selector, timeout)
        .then(() => true)
        .catch(() => false);
}

function canLogin() {
    return Boolean(config.login && config.password);
}

function useFeature() {
    return Boolean(config.feature?.user && config.feature?.password);
}

module.exports = {
    ROOT,
    prepare,
    findSelector,
    waitForAny,
    getText,
    click,
    clickAndWait,
    clickWait,
    type,
    delay,
    getRandomInt,
    isVisible,
    canLogin,
    useFeature,
    savePage,
    dismissConsent,
    eventer
};
