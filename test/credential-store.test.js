const test = require('node:test');
const assert = require('node:assert/strict');

const {
    SCHEME,
    encryptionAvailable,
    readPassword,
    hasStoredPassword,
    migrate,
    seal
} = require('../desktop/credential-store.js');

function fakeSafeStorage({available = true} = {}) {
    return {
        isEncryptionAvailable: () => available,
        encryptString: value => Buffer.from(`enc:${value}`, 'utf8'),
        decryptString: buffer => buffer.toString('utf8').replace(/^enc:/, '')
    };
}

test('migrate encrypts a plaintext password and removes it from disk data', () => {
    const safeStorage = fakeSafeStorage();
    const {config, changed} = migrate(safeStorage, {
        credentials: {login: 'student1', password: 'sekret'}
    });

    assert.equal(changed, true);
    assert.equal(config.credentials.password, undefined);
    assert.equal(config.credentials.password_scheme, SCHEME);
    assert.equal(readPassword(safeStorage, config.credentials), 'sekret');
});

test('migrate is idempotent once the password is encrypted', () => {
    const safeStorage = fakeSafeStorage();
    const once = migrate(safeStorage, {
        credentials: {login: 'student1', password: 'sekret'}
    });
    const twice = migrate(safeStorage, once.config);

    assert.equal(twice.changed, false);
    assert.deepEqual(twice.config, once.config);
});

test('migrate folds legacy top-level credentials into the credentials block', () => {
    const safeStorage = fakeSafeStorage();
    const {config, changed} = migrate(safeStorage, {login: 'old', password: 'secret'});

    assert.equal(changed, true);
    assert.equal(config.login, undefined);
    assert.equal(config.password, undefined);
    assert.equal(config.credentials.login, 'old');
    assert.equal(readPassword(safeStorage, config.credentials), 'secret');
});

test('seal never writes the plaintext password', () => {
    const safeStorage = fakeSafeStorage();
    const stored = seal(safeStorage, {
        credentials: {login: 'student1', password: 'sekret'},
        language: 'pl'
    });

    assert.equal(stored.credentials.password, undefined);
    assert.equal(stored.credentials.password_scheme, SCHEME);
    assert.equal(stored.language, 'pl');
    assert.ok(!JSON.stringify(stored).includes('sekret'));
});

test('seal keeps an already encrypted password when no new one is provided', () => {
    const safeStorage = fakeSafeStorage();
    const encrypted = seal(safeStorage, {credentials: {login: 'student1', password: 'sekret'}});
    const again = seal(safeStorage, {
        credentials: {...encrypted.credentials, password: ''}
    });

    assert.equal(again.credentials.password_enc, encrypted.credentials.password_enc);
    assert.equal(again.credentials.password, undefined);
});

test('readPassword falls back to plaintext when there is no encrypted blob', () => {
    const safeStorage = fakeSafeStorage();
    assert.equal(readPassword(safeStorage, {login: 'x', password: 'plain'}), 'plain');
    assert.equal(readPassword(safeStorage, {login: 'x'}), '');
});

test('an undecryptable blob reads as an empty password instead of throwing', () => {
    const safeStorage = {
        isEncryptionAvailable: () => true,
        encryptString: () => Buffer.from('x'),
        decryptString: () => {
            throw new Error('keychain reset');
        }
    };

    assert.equal(readPassword(safeStorage, {
        password_scheme: SCHEME,
        password_enc: Buffer.from('broken').toString('base64')
    }), '');
});

test('without keychain support seal keeps the plaintext rather than losing it', () => {
    const safeStorage = fakeSafeStorage({available: false});
    const stored = seal(safeStorage, {credentials: {login: 'student1', password: 'sekret'}});

    assert.equal(stored.credentials.password, 'sekret');
    assert.equal(stored.credentials.password_enc, undefined);
    assert.equal(encryptionAvailable(safeStorage), false);
});

test('without keychain support migrate leaves the config unchanged', () => {
    const safeStorage = fakeSafeStorage({available: false});
    const raw = {credentials: {login: 'student1', password: 'sekret'}};
    const {config, changed} = migrate(safeStorage, raw);

    assert.equal(changed, false);
    assert.deepEqual(config, raw);
});

test('hasStoredPassword recognises encrypted, plaintext and empty blocks', () => {
    assert.equal(hasStoredPassword({password_enc: 'abc'}), true);
    assert.equal(hasStoredPassword({password: 'abc'}), true);
    assert.equal(hasStoredPassword({login: 'abc'}), false);
    assert.equal(hasStoredPassword(undefined), false);
});