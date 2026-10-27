// Tests for the login URL allowlist that keeps credentials on instaling.pl.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DEFAULT_LOGIN_URL,
    WWW_LOGIN_URL,
    normalizeLoginUrl,
    resolveLoginUrl
} = require('../src/urls.js');

test('accepts the canonical login URLs', () => {
    assert.equal(normalizeLoginUrl(), DEFAULT_LOGIN_URL);
    assert.equal(normalizeLoginUrl(DEFAULT_LOGIN_URL), DEFAULT_LOGIN_URL);
    assert.equal(
        normalizeLoginUrl('https://INSTALING.PL/teacher.php?page=login'),
        DEFAULT_LOGIN_URL
    );
    assert.equal(resolveLoginUrl(), DEFAULT_LOGIN_URL);
    assert.equal(resolveLoginUrl(DEFAULT_LOGIN_URL), DEFAULT_LOGIN_URL);
    assert.equal(resolveLoginUrl(WWW_LOGIN_URL), WWW_LOGIN_URL);
});

test('rejects non-HTTPS login URLs', () => {
    assert.throws(() => normalizeLoginUrl('http://instaling.pl/teacher.php'), /https/i);
    assert.throws(() => normalizeLoginUrl('ftp://instaling.pl/login'), /https/i);
});

test('rejects hosts outside instaling.pl', () => {
    assert.throws(() => normalizeLoginUrl('https://evil.example/login'), /instaling\.pl/);
    assert.throws(() => normalizeLoginUrl('https://instaling.pl.evil.example/login'), /instaling\.pl/);
    assert.throws(() => normalizeLoginUrl('https://notinstaling.pl/login'), /instaling\.pl/);
});

test('rejects credentials, custom ports and malformed URLs', () => {
    assert.throws(() => normalizeLoginUrl('https://user:pass@instaling.pl/login'), /username or password/i);
    assert.throws(() => normalizeLoginUrl('https://instaling.pl:8443/login'), /port/i);
    assert.throws(() => normalizeLoginUrl('not a url'), /valid URL/i);
    assert.throws(() => normalizeLoginUrl(''), /valid URL/i);
});

test('resolves only the official login page', () => {
    assert.throws(
        () => resolveLoginUrl('https://teacher.instaling.pl/teacher.php?page=login'),
        /official instaling\.pl login page/
    );
    assert.throws(
        () => resolveLoginUrl('https://instaling.pl/other.php'),
        /official instaling\.pl login page/
    );
});
