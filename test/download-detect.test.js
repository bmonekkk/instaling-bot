// Guards the device detection used by the download page. Detection must prefer
// structured signals (Client Hints) and fall back to the User-Agent without
// ever hiding the other download options.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    CARD_FOR,
    LABELS,
    detect,
    normalizeArch
} = require('../docs/download-detect.js');

const UA = {
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ipadLegacy: 'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
    android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    bare: ''
};

test('normalizeArch reads Client Hints values', () => {
    assert.equal(normalizeArch('arm', '64'), 'arm');
    assert.equal(normalizeArch('x86', '64'), 'x64');
    assert.equal(normalizeArch('x86', '32'), 'x86');
    assert.equal(normalizeArch('amd64', ''), 'x64');
    assert.equal(normalizeArch('', ''), null);
    assert.equal(normalizeArch(undefined, undefined), null);
});

test('detects phones and tablets', () => {
    assert.equal(detect({userAgent: UA.iphone, platform: 'iPhone'}).key, 'iphone');
    assert.equal(detect({userAgent: UA.ipadLegacy, platform: 'iPad'}).key, 'ipad');
    assert.equal(detect({userAgent: UA.android, platform: 'Linux armv8l'}).key, 'android');
});

test('iPadOS Safari that reports itself as a Mac is detected by touch points', () => {
    const out = detect({
        userAgent: UA.safariMac,
        platform: 'MacIntel',
        maxTouchPoints: 5
    });
    assert.equal(out.key, 'ipad');
    assert.deepEqual(out.cards, ['dl-userscript']);
});

test('a real Mac is not mistaken for an iPad', () => {
    const out = detect({userAgent: UA.safariMac, platform: 'MacIntel', maxTouchPoints: 0});
    assert.equal(out.key, 'mac');
    assert.deepEqual(out.cards, ['dl-mac-arm64', 'dl-mac-x64']);
});

test('uses Client Hints architecture to pick the macOS package', () => {
    assert.equal(detect({userAgent: UA.mac, platform: 'MacIntel'}).key, 'mac');
    assert.equal(
        detect({userAgent: UA.mac, platform: 'MacIntel', architecture: 'arm', bitness: '64'}).key,
        'mac-arm64'
    );
    assert.equal(
        detect({userAgent: UA.mac, platform: 'MacIntel', architecture: 'x86', bitness: '64'}).key,
        'mac-x64'
    );
});

test('detects Windows, Linux and unknown systems', () => {
    assert.equal(detect({userAgent: UA.windows, platform: 'Win32'}).key, 'win');
    assert.equal(detect({userAgent: UA.linux, platform: 'Linux x86_64'}).key, 'linux');
    assert.equal(detect({userAgent: UA.bare, platform: 'Plan9'}).key, 'unknown');
    assert.deepEqual(detect({userAgent: UA.bare, platform: 'Plan9'}).cards, []);
});

test('every detected system maps to an existing card and a label', () => {
    for (const key of Object.keys(CARD_FOR)) {
        assert.ok(Array.isArray(CARD_FOR[key]), key);
        assert.ok(LABELS[key], `missing label for ${key}`);
    }
    assert.deepEqual(CARD_FOR.win, ['dl-windows']);
    assert.deepEqual(CARD_FOR.android, ['dl-android']);
    assert.deepEqual(CARD_FOR.iphone, ['dl-userscript']);
    assert.deepEqual(CARD_FOR.ipad, ['dl-userscript']);
    assert.deepEqual(CARD_FOR.linux, ['dl-cli']);
});