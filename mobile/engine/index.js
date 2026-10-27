const engine = require('./engine.js');
const i18n = require('./i18n.js');
const selectors = require('./selectors.js');
const dom = require('./dom.js');

module.exports = {
    ...engine,
    ...i18n,
    ...selectors,
    dom
};
