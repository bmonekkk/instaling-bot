// Browser entry bundled for the Android/iOS WebViews. Exposes a small global API
//; native shells call window.InstalingBot.create(...) and then start().

const {createEngine, createStorageAdapter, DEFAULT_CONFIG} = require('./engine.js');
const {translate, normalizeLanguage} = require('./i18n.js');
const dom = require('./dom.js');

function create(options = {}) {
    const storage = options.storage ?? createStorageAdapter(globalThis.localStorage);
    const engine = createEngine({...options, storage});
    globalThis.__instalingBotEngine = engine;
    return engine;
}

globalThis.InstalingBot = {
    create,
    createStorageAdapter,
    DEFAULT_CONFIG,
    dom,
    normalizeLanguage,
    translate
};
