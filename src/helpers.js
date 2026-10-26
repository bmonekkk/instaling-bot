const config = require('./config.js');
const fs = require('fs/promises');
const path = require('path');
const {yellow} = require('./printer.js');

const ROOT = process.env.INSTALING_ROOT
    ? path.resolve(process.env.INSTALING_ROOT)
    : path.resolve(__dirname, '..');

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
        'button[aria-label="Odrzuć wszystkie"]',
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

const TYPO_NEIGHBORS = {
    q: ['w', 'a', 's'],
    w: ['q', 'e', 'a', 's', 'd'],
    e: ['w', 'r', 's', 'd', 'f'],
    r: ['e', 't', 'd', 'f', 'g'],
    t: ['r', 'y', 'f', 'g', 'h'],
    y: ['t', 'u', 'g', 'h', 'j'],
    u: ['y', 'i', 'h', 'j', 'k'],
    i: ['u', 'o', 'j', 'k', 'l'],
    o: ['i', 'p', 'k', 'l'],
    p: ['o', 'l'],
    a: ['q', 'w', 's', 'z', 'x'],
    s: ['a', 'd', 'w', 'e', 'z', 'x', 'c'],
    d: ['s', 'f', 'e', 'r', 'x', 'c', 'v'],
    f: ['d', 'g', 'r', 't', 'c', 'v', 'b'],
    g: ['f', 'h', 't', 'y', 'v', 'b', 'n'],
    h: ['g', 'j', 'y', 'u', 'b', 'n', 'm'],
    j: ['h', 'k', 'u', 'i', 'n', 'm'],
    k: ['j', 'l', 'i', 'o', 'm'],
    l: ['k', 'o', 'p'],
    z: ['a', 's', 'x'],
    x: ['z', 'c', 's', 'd'],
    c: ['x', 'v', 'd', 'f'],
    v: ['c', 'b', 'f', 'g'],
    b: ['v', 'n', 'g', 'h'],
    n: ['b', 'm', 'h', 'j'],
    m: ['n', 'j', 'k']
};

const ACCENT_MAP = {
    á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a', å: 'a',
    é: 'e', è: 'e', ë: 'e', ê: 'e',
    í: 'i', ì: 'i', ï: 'i', î: 'i',
    ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
    ú: 'u', ù: 'u', ü: 'u', û: 'u',
    ñ: 'n', ç: 'c', ß: 's', ł: 'l', ą: 'a', ć: 'c', ę: 'e',
    ś: 's', ź: 'z', ż: 'z', ń: 'n', ó: 'o'
};

function getTypoChar(char) {
    const lower = char.toLowerCase();
    if (lower === char.toUpperCase()) {
        return char;
    }
    const base = ACCENT_MAP[lower] ?? lower;
    const options = TYPO_NEIGHBORS[base] ?? 'abcdefghijklmnopqrstuvwxyz'.split('');
    const wrong = options[getRandomInt(0, options.length)];
    return char === char.toUpperCase() ? wrong.toUpperCase() : wrong;
}

/**
 * Creates a plausible (but wrong) spelling of a word. Used when valid_chance
 * decides that the bot should answer incorrectly, so the answer field is filled
 * with a human-like mistake instead of being left empty.
 */
function misspell(word) {
    const chars = [...word];
    if (chars.length < 2) {
        return word + 'x';
    }
    const style = getRandomInt(0, 3);
    if (style === 0) {
        const i = getRandomInt(0, chars.length - 1);
        [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    } else if (style === 1) {
        chars.splice(getRandomInt(0, chars.length), 1);
    } else {
        const i = getRandomInt(0, chars.length);
        chars[i] = getTypoChar(chars[i]);
    }
    const result = chars.join('');
    return result === word ? word.slice(0, -1) : result;
}

async function clearField(page, selector) {
    await page.$eval(selector, el => {
        el.focus();
        el.value = '';
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
    });
}

/**
 * Fast, deterministic typing for credentials and other values that must never
 * be mistyped. Verifies the resulting value and falls back to setting it
 * directly if the page transforms the input while typing.
 */
async function typeExact(page, selector, text, delayTime = 25) {
    const found = await waitForAny(page, selector);
    await clearField(page, found);
    await page.type(found, text, {delay: delayTime});

    let value = await page.$eval(found, el => el.value);
    if (value !== text) {
        await page.$eval(found, (el, expected) => {
            el.value = expected;
            el.dispatchEvent(new Event('input', {bubbles: true}));
            el.dispatchEvent(new Event('change', {bubbles: true}));
        }, text);
        value = await page.$eval(found, el => el.value);
    }
    return value;
}

/**
 * Human-like typing: every character has its own random delay, there are
 * occasional micro-pauses, and sometimes a neighbouring key is pressed first
 * and corrected with Backspace. The final value is verified, so a simulated
 * typo can never change the actual answer.
 */
async function typeHuman(page, selector, text) {
    const found = await waitForAny(page, selector);
    await clearField(page, found);
    await page.focus(found);

    const delays = config.delays ?? {};
    const typeMin = delays.type_min ?? 90;
    const typeMax = delays.type_max ?? 230;
    const pauseChance = delays.type_pause_chance ?? 0.12;
    const pauseMin = delays.type_pause_min ?? 250;
    const pauseMax = delays.type_pause_max ?? 700;
    const typoChance = delays.typo_chance ?? 0.15;

    const chars = [...text];
    const typoable = chars
        .map((char, index) => (/[a-z]/i.test(char) ? index : -1))
        .filter(index => index >= 0);
    const typoAt = typoable.length > 0 && Math.random() < typoChance
        ? typoable[getRandomInt(0, typoable.length)]
        : -1;

    try {
        for (let index = 0; index < chars.length; index++) {
            if (index === typoAt) {
                await page.keyboard.type(getTypoChar(chars[index]));
                await delay(getRandomInt(90, 200));
                await page.keyboard.press('Backspace');
                await delay(getRandomInt(60, 150));
            }

            await page.keyboard.type(chars[index]);
            await delay(getRandomInt(typeMin, typeMax));

            const isBreak = chars[index] === ' ' || chars[index] === ',';
            if (index < chars.length - 1 && (isBreak || Math.random() < pauseChance)) {
                await delay(getRandomInt(pauseMin, pauseMax));
            }
        }
    } catch (e) {
        // If an input mask or an unusual character breaks keyboard typing,
        // fall back to fast deterministic typing.
        return typeExact(page, found, text, 20);
    }

    let value = await page.$eval(found, el => el.value);
    if (value !== text) {
        await typeExact(page, found, text, 20);
        value = await page.$eval(found, el => el.value);
    }
    return value;
}

async function type(page, selector, text, options = {}) {
    if (options && options.exact) {
        return typeExact(page, selector, text, options.delay ?? 25);
    }
    return typeHuman(page, selector, text);
}

/**
 * Clicks a navigation button and waits only briefly for a page load. Any
 * content that appears later is handled by the following findSelector() call,
 * so the bot never stalls on an AJAX-only button.
 */
async function quickClick(page, selector) {
    await click(page, selector);
    return delay(getRandomInt(
        config.delays?.quick_click_min ?? 120,
        config.delays?.quick_click_max ?? 300
    ));
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
    typeExact,
    typeHuman,
    misspell,
    quickClick,
    delay,
    getRandomInt,
    isVisible,
    canLogin,
    savePage,
    dismissConsent
};
