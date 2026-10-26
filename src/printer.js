const chalk = require('chalk');
const config = require('./config.js');
const stripAnsi = require('strip-ansi');

let string = '';
let interval;

function log(text) {
    string += '\n';
    string += text;
    console.log(text);
}

function green(text) {
    return log(chalk.green(text));
}

function yellow(text) {
    return log(chalk.yellow(text));
}

function red(text) {
    return log(chalk.red(text));
}

function blue(text) {
    return log(chalk.blue(text));
}

function error(text) {
    sendAndClear().catch(console.error);
    sendWebhook({
        embeds: [{
            color: 0xff0000,
            title: `:exclamation: ${text?.name ?? 'Error'}`,
            description: `WystÄ…piĹ‚ nieznany bĹ‚Ä…d i bot zostaĹ‚ zatrzymany!\n[ZGĹOĹš BĹÄ„D](https://github.com/PanSzelescik/instaling-bot/issues)`,
            fields: [
                {name: 'Message', value: String(text?.message ?? text ?? 'Unknown'), inline: false},
                {name: 'Stacktrace', value: String(text?.stack ?? '').substring(0, 1024) || 'brak', inline: false}
            ],
            footer: {text: 'InstaLing Bot by PanSzelescik'},
            timestamp: new Date().toISOString()
        }]
    }).catch(console.error);
    console.error(text);
}

function getWebhookUrl() {
    return config?.webhook || null;
}

function prepareWebhook() {
    if (!getWebhookUrl()) return;
    interval = setInterval(async () => sendAndClear(), 5000);
}

async function sendWebhook(payload) {
    const url = getWebhookUrl();
    if (!url) return;
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`Discord webhook returned ${response.status}`);
    }
}

async function send(text) {
    return sendWebhook({content: stripAnsi(text).substring(0, 1900)});
}

async function sendAndClear() {
    if (string) {
        const toSend = string;
        string = '';
        return send(toSend);
    }
}

prepareWebhook();

module.exports = {
    green,
    yellow,
    red,
    blue,
    error,
    interval,
    sendAndClear
};
