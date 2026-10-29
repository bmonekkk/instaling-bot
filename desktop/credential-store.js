// Desktop credential storage.
//
// The bot has to send the real InstaLing password on every login, so the
// password cannot be hashed: a hash is one-way and the site does not accept it.
// What we can do is encrypt it at rest with Electron's safeStorage, which is
// backed by the OS keychain (Keychain on macOS, DPAPI on Windows, libsecret /
// kwallet on Linux). Config.json then holds an opaque `password_enc` blob
// instead of the plaintext.
//
// Everything here takes the safeStorage instance as an argument so the logic is
// testable without Electron.

const SCHEME = 'safeStorage-v1';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function encryptionAvailable(safeStorage) {
    try {
        return Boolean(safeStorage && safeStorage.isEncryptionAvailable());
    } catch (error) {
        return false;
    }
}

function encrypt(safeStorage, password) {
    if (!password || !encryptionAvailable(safeStorage)) return null;
    try {
        const buffer = safeStorage.encryptString(String(password));
        return {
            scheme: SCHEME,
            value: Buffer.from(buffer).toString('base64')
        };
    } catch (error) {
        return null;
    }
}

function decrypt(safeStorage, encoded) {
    if (!encoded || !encryptionAvailable(safeStorage)) return '';
    try {
        const buffer = Buffer.from(String(encoded), 'base64');
        return safeStorage.decryptString(buffer);
    } catch (error) {
        // A keychain reset or a copied config makes the blob undecryptable.
        // Treat it as "no password" so the user is asked to type it again.
        return '';
    }
}

// The credentials block is `credentials: {...}` in modern configs and
// top-level `login`/`password` in very old ones.
function credentialBlock(raw) {
    if (raw?.credentials && typeof raw.credentials === 'object') {
        return raw.credentials;
    }
    if (raw && (raw.login !== undefined || raw.password !== undefined)) {
        return {login: raw.login ?? '', password: raw.password ?? ''};
    }
    return null;
}

function readPassword(safeStorage, credentials) {
    if (credentials?.password_scheme === SCHEME && credentials.password_enc) {
        return decrypt(safeStorage, credentials.password_enc);
    }
    return String(credentials?.password ?? '');
}

function hasStoredPassword(credentials) {
    return Boolean(credentials?.password_enc || credentials?.password);
}

// Moves a plaintext password into `password_enc`. Returns `{config, changed}`
// so the caller knows whether it has to rewrite Config.json.
function migrate(safeStorage, raw) {
    const config = clone(raw);
    let credentials = config.credentials;

    if (!credentials && (config.login !== undefined || config.password !== undefined)) {
        credentials = {
            login: String(config.login ?? ''),
            password: String(config.password ?? '')
        };
        config.credentials = credentials;
        delete config.login;
        delete config.password;
    }
    if (!credentials) return {config: raw, changed: false};

    if (credentials.password_enc) {
        if (!Object.prototype.hasOwnProperty.call(credentials, 'password')) {
            return {config: raw, changed: false};
        }
        delete credentials.password;
        return {config, changed: true};
    }

    if (!credentials.password) return {config: raw, changed: false};

    const encrypted = encrypt(safeStorage, credentials.password);
    if (!encrypted) return {config: raw, changed: false};

    credentials.password_enc = encrypted.value;
    credentials.password_scheme = encrypted.scheme;
    delete credentials.password;
    return {config, changed: true};
}

// Returns a copy that is safe to write to disk: the plaintext password is
// replaced with `password_enc`. If the OS keychain is unavailable the password
// is kept as before rather than silently dropped.
function seal(safeStorage, config) {
    const out = clone(config);
    const credentials = out.credentials;
    if (!credentials) return out;

    const password = String(credentials.password ?? '');
    delete credentials.password;
    if (!password) return out;

    const encrypted = encrypt(safeStorage, password);
    if (!encrypted) {
        credentials.password = password;
        return out;
    }
    credentials.password_enc = encrypted.value;
    credentials.password_scheme = encrypted.scheme;
    return out;
}

module.exports = {
    SCHEME,
    encryptionAvailable,
    readPassword,
    hasStoredPassword,
    credentialBlock,
    migrate,
    seal
};