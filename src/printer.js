const chalk = require('chalk');

function log(text) {
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
    console.error(text);
}

module.exports = {
    green,
    yellow,
    red,
    blue,
    error
};
