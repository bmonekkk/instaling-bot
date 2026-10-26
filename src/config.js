const fs = require('fs');
const path = require('path');

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

let raw;
try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
} catch (error) {
    throw new Error(`Could not read config file ${configPath}: ${error.message}`);
}

// Backwards compatibility: older configs kept login/password at the top level.
const credentials = raw.credentials ?? {
    login: raw.login ?? '',
    password: raw.password ?? ''
};

module.exports = {
    ...raw,
    credentials,
    login: credentials.login ?? '',
    password: credentials.password ?? ''
};
