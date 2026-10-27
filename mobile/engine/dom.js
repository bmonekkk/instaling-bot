// Thin DOM adapter for the shared engine: find elements, read text, click and
// type with human-like timing. Works in a normal page, a userscript and a
// WebView. No native APIs are used here.

const {buildTypingSteps} = require('../../src/core/typing.js');

function isVisible(element) {
    if (!element) return false;
    if (element.hidden) return false;
    if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;
    const style = globalThis.getComputedStyle?.(element);
    return !style || (style.visibility !== 'hidden' && style.display !== 'none');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function queryAll(selector) {
    try {
        return [...document.querySelectorAll(selector)];
    } catch (error) {
        return [];
    }
}

async function find(selectors, timeout = 15000, shouldContinue = () => true) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const deadline = Date.now() + timeout;
    do {
        for (const selector of list) {
            const element = queryAll(selector).find(isVisible);
            if (element) return element;
        }
        if (!shouldContinue()) return null;
        await wait(150);
    } while (Date.now() < deadline);
    return null;
}

/** Finds a visible button/link whose label matches one of the keywords. */
async function findByText(keywords, timeout = 5000, shouldContinue = () => true) {
    const lowered = keywords.map(keyword => keyword.toLowerCase());
    const deadline = Date.now() + timeout;
    do {
        const candidates = queryAll('button, a, input[type="submit"], [role="button"]');
        for (const element of candidates) {
            if (!isVisible(element)) continue;
            const label = (element.textContent || element.value || '').trim().toLowerCase();
            if (!label) continue;
            if (lowered.some(keyword => label.includes(keyword))) return element;
        }
        if (!shouldContinue()) return null;
        await wait(150);
    } while (Date.now() < deadline);
    return null;
}

function text(element) {
    return (element?.textContent || '').replace(/\s+/g, ' ').trim();
}

function bodyText() {
    const body = document.body;
    return (body?.innerText || body?.textContent || '').replace(/\s+/g, ' ').trim();
}

function fire(element, type, init = {}) {
    try {
        element.dispatchEvent(new Event(type, {bubbles: true, cancelable: true, ...init}));
    } catch (error) {
        // Older WebViews may not support every event constructor.
    }
}

function click(element) {
    if (!element) return false;
    element.scrollIntoView?.({block: 'center', inline: 'center'});
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
        try {
            const Ctor = type.startsWith('pointer') ? globalThis.PointerEvent : globalThis.MouseEvent;
            if (Ctor) {
                element.dispatchEvent(new Ctor(type, {bubbles: true, cancelable: true, view: globalThis}));
            }
        } catch (error) {
            // Ignore and fall through to element.click().
        }
    }
    element.click?.();
    return true;
}

function setNativeValue(element, value) {
    if (element.isContentEditable) {
        element.textContent = value;
        fire(element, 'input');
        return;
    }
    const proto = element.tagName === 'TEXTAREA'
        ? globalThis.HTMLTextAreaElement?.prototype
        : globalThis.HTMLInputElement?.prototype;
    const descriptor = proto && Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor?.set) {
        descriptor.set.call(element, value);
    } else {
        element.value = value;
    }
    fire(element, 'input');
    fire(element, 'change');
}

function typeChar(element, char) {
    try {
        element.dispatchEvent(new KeyboardEvent('keydown', {key: char, bubbles: true}));
    } catch (error) {
        // Non-critical.
    }
    if (element.isContentEditable) {
        element.textContent += char;
        fire(element, 'input');
    } else {
        setNativeValue(element, `${element.value ?? ''}${char}`);
    }
    try {
        element.dispatchEvent(new KeyboardEvent('keyup', {key: char, bubbles: true}));
    } catch (error) {
        // Non-critical.
    }
}

function backspace(element) {
    try {
        element.dispatchEvent(new KeyboardEvent('keydown', {key: 'Backspace', bubbles: true}));
    } catch (error) {
        // Non-critical.
    }
    if (element.isContentEditable) {
        element.textContent = (element.textContent || '').slice(0, -1);
        fire(element, 'input');
    } else {
        setNativeValue(element, String(element.value ?? '').slice(0, -1));
    }
}

/**
 * Executes the shared typing plan. `shouldContinue` lets Stop interrupt a long
 * word without leaving a half-typed answer behind.
 */
async function typeText(element, value, delays = {}, shouldContinue = () => true) {
    if (!element) throw new Error('typeText: missing element');
    element.focus?.();
    setNativeValue(element, '');

    for (const step of buildTypingSteps(value, delays)) {
        if (!shouldContinue()) break;
        if (step.op === 'type') typeChar(element, step.text);
        if (step.op === 'key' && step.key === 'Backspace') backspace(element);
        if (step.op === 'wait') await wait(step.ms);
    }

    if (element.isContentEditable || element.value !== value) {
        setNativeValue(element, value);
    }
    return element.value;
}

module.exports = {
    bodyText,
    click,
    find,
    findByText,
    isVisible,
    setNativeValue,
    text,
    typeText,
    wait
};
