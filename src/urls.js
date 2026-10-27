// Login URL validation. The URL comes from Config.json, so it is treated as
// untrusted: the bot only ever types credentials into instaling.pl over HTTPS.

const DEFAULT_LOGIN_URL = 'https://instaling.pl/teacher.php?page=login';

const ALLOWED_HOSTS = ['instaling.pl'];
const ALLOWED_PROTOCOLS = ['https:'];

function hostAllowed(hostname) {
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

/**
 * Validates and normalizes `sites.login`. Throws when the URL could send the
 * credentials anywhere other than instaling.pl.
 */
function normalizeLoginUrl(value = DEFAULT_LOGIN_URL) {
    let parsed;
    try {
        parsed = new URL(String(value));
    } catch {
        throw new Error('sites.login must be a valid URL');
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        throw new Error('sites.login must use https://');
    }
    if (parsed.username || parsed.password) {
        throw new Error('sites.login must not contain a username or password');
    }
    if (parsed.port && parsed.port !== '443') {
        throw new Error('sites.login must use the default HTTPS port');
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostAllowed(hostname)) {
        throw new Error(`sites.login must point to instaling.pl (got ${hostname})`);
    }

    return parsed.toString();
}

module.exports = {
    DEFAULT_LOGIN_URL,
    ALLOWED_HOSTS,
    normalizeLoginUrl
};
