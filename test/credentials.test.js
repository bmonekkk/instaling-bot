const test = require('node:test');
const assert = require('node:assert/strict');

const {
    readEnvCredentials,
    resolveCredentials,
    redactSecrets
} = require('../src/credentials.js');

test('reads trimmed login and raw password from the environment', () => {
    const env = {INSTALING_LOGIN: '  user@example.com ', INSTALING_PASSWORD: ' pass word '};
    assert.deepEqual(readEnvCredentials(env), {
        login: 'user@example.com',
        password: ' pass word ',
        hasLogin: true,
        hasPassword: true
    });
});

test('empty environment variables do not override the config', () => {
    const credentials = {login: 'config-user', password: 'config-secret'};
    assert.deepEqual(
        resolveCredentials(credentials, {INSTALING_LOGIN: ' ', INSTALING_PASSWORD: ''}),
        credentials
    );
});

test('environment credentials take precedence individually', () => {
    const credentials = {login: 'config-user', password: 'config-secret'};
    assert.deepEqual(
        resolveCredentials(credentials, {INSTALING_PASSWORD: 'env-secret'}),
        {login: 'config-user', password: 'env-secret'}
    );
    assert.deepEqual(
        resolveCredentials(credentials, {INSTALING_LOGIN: 'env-user'}),
        {login: 'env-user', password: 'config-secret'}
    );
});

test('redacts every occurrence of a secret and ignores tiny values', () => {
    assert.equal(
        redactSecrets('password=hunter2 and hunter2 again', ['hunter2', 'x']),
        'password=[redacted] and [redacted] again'
    );
    assert.equal(redactSecrets('nothing to hide', ['']), 'nothing to hide');
});
