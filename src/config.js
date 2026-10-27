const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {DEFAULT_LOGIN_URL, resolveLoginUrl} = require('./urls.js');
const {resolveCredentials} = require('./credentials.js');

// Best-effort credential-file hardening, mirroring the desktop app: chmod 600 on
// POSIX and a private ACL on Windows. Failures are ignored because some
// filesystems (FAT/exFAT, network shares) cannot store permissions.
function secureFile(file) {
    try {
        if (process.platform === 'win32') {
            const account = process.env.USERNAME
                ? (process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\${process.env.USERNAME}` : process.env.USERNAME)
                : '';
            if (!account) return;
            execFileSync('icacls', [file, '/inheritance:r', '/grant:r', `${account}:F`], {
                stdio: 'ignore',
                windowsHide: true
            });
        } else {
            fs.chmodSync(file, 0o600);
        }
    } catch (error) {
        // Keep running even when the filesystem does not support permissions.
    }
}

// The desktop app runs the engine against a writable user-data directory, so the
// config path can be provided explicitly. The CLI keeps using config/Config.json.
const configPath = process.env.INSTALING_CONFIG
    ? path.resolve(process.env.INSTALING_CONFIG)
    : path.join(__dirname, '..', 'config', 'Config.json');

if (!fs.existsSync(configPath)) {
    throw new Error(
        `Config file not found: ${configPath}\n` +
        'Copy config/Config.defaults.json to config/Config.json and fill in your credentials.'
    );
}

// The config may hold the InstaLing password, so keep it readable by the owner
// only (the CLI installer copies it with the ambient umask otherwise).
secureFile(configPath);

let raw;
try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
} catch (error) {
    throw new Error(`Could not read config file ${configPath}: ${error.message}`);
}

// Backwards compatibility: older configs kept login/password at the top level.
// INSTALING_LOGIN / INSTALING_PASSWORD override the file (useful for CI and
// headless runs where credentials should not be stored on disk).
const credentials = resolveCredentials(raw.credentials ?? {
    login: raw.login ?? '',
    password: raw.password ?? ''
});

// Never navigate to a login page outside instaling.pl: the bot types the
// credentials there, and file-provided URLs must not be able to redirect them.
const sites = raw.sites && typeof raw.sites === 'object' ? raw.sites : {};
let loginUrl;
try {
    loginUrl = resolveLoginUrl(sites.login ?? DEFAULT_LOGIN_URL);
} catch (error) {
    throw new Error(`Invalid sites.login in ${configPath}: ${error.message}`);
}

module.exports = {
    ...raw,
    credentials,
    login: credentials.login ?? '',
    password: credentials.password ?? '',
    loginUrl
};
