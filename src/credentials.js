// Credential helpers shared by the engine and the desktop app. Environment
// variables take precedence over Config.json so CI/headless runs do not need
// credentials on disk at all.

function readEnvCredentials(env = process.env) {
    const login = typeof env.INSTALING_LOGIN === 'string'
        ? env.INSTALING_LOGIN.trim()
        : '';
    const password = typeof env.INSTALING_PASSWORD === 'string'
        ? env.INSTALING_PASSWORD
        : '';
    return {
        login,
        password,
        hasLogin: login.length > 0,
        hasPassword: password.length > 0
    };
}

function resolveCredentials(credentials = {}, env = process.env) {
    const fromEnv = readEnvCredentials(env);
    return {
        login: fromEnv.hasLogin ? fromEnv.login : String(credentials.login ?? ''),
        password: fromEnv.hasPassword ? fromEnv.password : String(credentials.password ?? '')
    };
}

// Replaces known secrets in log/notification text. Short values are ignored so
// a one-character password cannot mangle every line of output.
function redactSecrets(text, secrets = []) {
    let result = String(text ?? '');
    for (const secret of secrets) {
        const value = String(secret ?? '');
        if (value.length < 3) continue;
        result = result.split(value).join('[redacted]');
    }
    return result;
}

module.exports = {
    readEnvCredentials,
    resolveCredentials,
    redactSecrets
};
