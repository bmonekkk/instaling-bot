const test = require('node:test');
const assert = require('node:assert/strict');

const {
    BASE_ARGS,
    applyStealth,
    hideHeadlessUA,
    launchOptions,
    stealthPatch
} = require('../src/core/stealth.js');

test('launchOptions removes the --enable-automation default', () => {
    const options = launchOptions();
    assert.deepEqual(options.ignoreDefaultArgs, ['--enable-automation']);
    assert.ok(options.args.includes('--disable-blink-features=AutomationControlled'));
    assert.equal(options.headless, false);
    assert.equal(options.defaultViewport, null, 'a headed run must not force a viewport');
});

test('launchOptions forwards size, extra args and executablePath', () => {
    const options = launchOptions({
        headless: true,
        executablePath: '/tmp/chrome',
        extraArgs: ['--mute-audio'],
        width: 1280,
        height: 720
    });
    assert.equal(options.headless, true);
    assert.equal(options.executablePath, '/tmp/chrome');
    assert.ok(options.args.includes('--mute-audio'));
    assert.ok(options.args.includes('--window-size=1280,720'));
    assert.deepEqual(options.defaultViewport, {width: 1280, height: 720});
});

test('launchOptions omits executablePath when not given', () => {
    assert.equal('executablePath' in launchOptions(), false);
});

test('BASE_ARGS contains the Polish locale flags', () => {
    assert.ok(BASE_ARGS.includes('--lang=pl-PL,pl'));
    assert.ok(BASE_ARGS.includes('--accept-lang=pl-PL,pl,en-US,en'));
});

test('hideHeadlessUA rewrites the header value', async () => {
    const page = {value: null, setUserAgent: async value => { page.value = value; }};
    const browser = {
        userAgent: async () => 'Mozilla/5.0 HeadlessChrome/156.0.0.0 Safari/537.36'
    };
    const result = await hideHeadlessUA(page, browser);
    assert.equal(result, 'Mozilla/5.0 Chrome/156.0.0.0 Safari/537.36');
    assert.equal(page.value, result);
});

test('hideHeadlessUA leaves a normal UA untouched', async () => {
    const page = {value: null, setUserAgent: async value => { page.value = value; }};
    const browser = {userAgent: async () => 'Mozilla/5.0 Chrome/156.0.0.0 Safari/537.36'};
    const result = await hideHeadlessUA(page, browser);
    assert.equal(result, null);
    assert.equal(page.value, null);
});

test('applyStealth registers exactly one init script', async () => {
    const calls = [];
    const page = {evaluateOnNewDocument: async (fn, options) => calls.push({fn, options})};
    await applyStealth(page, {languages: ['pl-PL']});
    assert.equal(calls.length, 1);
    assert.equal(calls[0].fn, stealthPatch);
    assert.deepEqual(calls[0].options, {languages: ['pl-PL']});
});

test('stealthPatch is self-contained and safe outside a browser', () => {
    // Guards the module against accidentally importing Node APIs into the
    // function that gets serialized into the page.
    const source = stealthPatch.toString();
    assert.ok(!source.includes('require('));
    assert.ok(source.includes('Navigator.prototype'));
});