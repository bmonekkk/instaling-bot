// Anti-detection helpers shared by the desktop bot and the standalone audit
// scripts. Kept free of Node built-ins so the same patches can run in a
// browser frame; the launcher helpers are plain data.
//
// Design rule: patch as little as possible. Every override is one more
// inconsistency a site can fingerprint, so the defaults only touch what
// Puppeteer/Chrome for Testing actively breaks.

const DEFAULT_LANGUAGES = ['pl-PL', 'pl', 'en-US', 'en'];

// Flags that make a Chromium launch look more like a normal browser. The
// `--enable-automation` switch is removed separately via ignoreDefaultArgs:
// it is what sets `navigator.webdriver` and shows the automation infobar.
const BASE_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--lang=pl-PL,pl',
    '--accept-lang=pl-PL,pl,en-US,en',
    '--no-first-run',
    '--no-default-browser-check'
];

/**
 * Launch options for Puppeteer. `extraArgs` is appended (e.g. --mute-audio).
 * `executablePath` is only set when the caller passes one.
 */
function launchOptions({
    headless = false,
    executablePath,
    extraArgs = [],
    width = 1366,
    height = 900
} = {}) {
    const options = {
        headless,
        defaultViewport: headless ? {width, height} : null,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            ...BASE_ARGS,
            `--window-size=${width},${height}`,
            '--window-position=40,40',
            ...extraArgs
        ]
    };
    if (executablePath) options.executablePath = executablePath;
    return options;
}

/**
 * Runs inside the page before any site script (via evaluateOnNewDocument).
 * Must stay self-contained: no imports, only the passed options.
 */
function stealthPatch(options = {}) {
    const languageList = Array.isArray(options.languages) && options.languages.length
        ? options.languages.slice()
        : ['pl-PL', 'pl', 'en-US', 'en'];
    const harden = options.hardenFunctions !== false;
    const spoofBrands = options.spoofBrands !== false;

    // Function.prototype.toString shim so patched getters still look native.
    // Only functions marked below are rewritten; everything else is untouched.
    let mark = fn => fn;
    if (harden && typeof WeakSet === 'function') {
        const nativeToString = Function.prototype.toString;
        const fakeKind = new WeakMap();
        mark = (fn, kind = 'fn') => {
            try { fakeKind.set(fn, kind); } catch (e) { /* ignore */ }
            return fn;
        };
        const patchedToString = function toString() {
            const kind = fakeKind.get(this);
            if (kind) {
                const name = this.name || '';
                return kind === 'get'
                    ? `function get ${name}() { [native code] }`
                    : `function ${name}() { [native code] }`;
            }
            return nativeToString.call(this);
        };
        try {
            fakeKind.set(patchedToString, 'fn');
            Object.defineProperty(Function.prototype, 'toString', {
                value: patchedToString,
                writable: true,
                configurable: true
            });
        } catch (e) { /* ignore */ }
    }

    const defineGetter = (target, prop, getter) => {
        try {
            Object.defineProperty(target, prop, {
                get: mark(getter, 'get'),
                configurable: true,
                enumerable: true
            });
        } catch (e) { /* ignore */ }
    };

    // The two Puppeteer tells. Real Chrome exposes both as accessors on
    // Navigator.prototype, so patching the prototype (not the instance) keeps
    // property descriptors looking normal.
    defineGetter(Navigator.prototype, 'webdriver', function webdriver() {
        return undefined;
    });
    defineGetter(Navigator.prototype, 'languages', function languages() {
        return Object.freeze(languageList.slice());
    });

    // Chrome for Testing reports "Chromium" instead of "Google Chrome" in the
    // User-Agent Client Hints. Align the brand list with the UA version, but
    // only touch the brand getter - the rest of userAgentData stays native.
    if (spoofBrands && typeof navigator !== 'undefined' && navigator.userAgentData) {
        try {
            const match = /Chrome\/(\d+)/.exec(navigator.userAgent);
            const major = match ? match[1] : '';
            const brandEntries = [
                {brand: 'Google Chrome', version: major},
                {brand: 'Chromium', version: major},
                {brand: 'Not_A Brand', version: '24'}
            ].map(entry => Object.freeze(entry));
            const proto = Object.getPrototypeOf(navigator.userAgentData);
            Object.defineProperty(proto, 'brands', {
                get: mark(function brands() { return Object.freeze(brandEntries.slice()); }, 'get'),
                configurable: true,
                enumerable: true
            });
        } catch (e) { /* ignore */ }
    }

    // Headless Chromium ships an empty plugin list. Fix it only when it is
    // actually broken, so a headed run stays untouched.
    try {
        if (!navigator.plugins || navigator.plugins.length === 0) {
            const plugin = Object.create(Plugin.prototype);
            Object.defineProperties(plugin, {
                name: {value: 'PDF Viewer', enumerable: true},
                filename: {value: 'internal-pdf-viewer', enumerable: true},
                description: {value: 'Portable Document Format', enumerable: true},
                length: {value: 2, enumerable: true}
            });
            const pluginArray = Object.create(PluginArray.prototype);
            Object.defineProperties(pluginArray, {
                length: {value: 1, enumerable: true},
                0: {value: plugin, enumerable: true},
                item: {value: mark(function item() { return plugin; })},
                namedItem: {value: mark(function namedItem() { return plugin; })},
                refresh: {value: mark(function refresh() {})}
            });
            defineGetter(Navigator.prototype, 'plugins', function plugins() {
                return pluginArray;
            });
        }
    } catch (e) { /* ignore */ }

    // Headless reports Notification.permission = "denied" while
    // permissions.query says "prompt". Make the two agree.
    try {
        if (typeof Notification !== 'undefined' && navigator.permissions) {
            const original = navigator.permissions.query.bind(navigator.permissions);
            const query = mark(function query(descriptor) {
                if (descriptor && descriptor.name === 'notifications') {
                    return Promise.resolve({state: Notification.permission, onchange: null});
                }
                return original(descriptor);
            });
            try {
                Object.defineProperty(navigator.permissions, 'query', {
                    value: query,
                    configurable: true,
                    writable: true
                });
            } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore */ }

    // Real desktop Chrome exposes window.chrome with runtime/loadTimes/csi.
    // Chrome for Testing does too, but older headless builds dropped it.
    try {
        if (typeof window !== 'undefined' && !window.chrome) {
            window.chrome = {
                runtime: {},
                loadTimes: mark(function loadTimes() {}),
                csi: mark(function csi() {}),
                app: {}
            };
        }
    } catch (e) { /* ignore */ }
}

/** Convenience wrapper: apply the patch to a Puppeteer page. */
async function applyStealth(page, options = {}) {
    await page.evaluateOnNewDocument(stealthPatch, options);
}

/**
 * Headless Chrome advertises "HeadlessChrome" in both the HTTP User-Agent and
 * navigator.userAgent. Rewrite it at the browser level (an in-page getter
 * patch would leave the header wrong). Call before the first navigation.
 */
async function hideHeadlessUA(page, browser) {
    const ua = await browser.userAgent();
    if (!/HeadlessChrome/i.test(ua)) return null;
    const fixed = ua.replace(/HeadlessChrome/gi, 'Chrome');
    await page.setUserAgent(fixed);
    return fixed;
}

module.exports = {
    BASE_ARGS,
    DEFAULT_LANGUAGES,
    applyStealth,
    hideHeadlessUA,
    launchOptions,
    stealthPatch
};