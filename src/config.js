const raw = require('../config/Config.json');

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
