// Userscript entry: floating panel + shared engine. Bundled by
// scripts/build-mobile.js into dist/instaling-bot.user.js.

const {createEngine, createStorageAdapter} = require('../engine/engine.js');
const {normalizeLanguage, translate} = require('../engine/i18n.js');

const VERSION = __VERSION__;
const RELEASES_URL = 'https://github.com/bmonekkk/instaling-bot/releases/latest';

function gmStorage() {
    if (typeof GM_getValue === 'function' && typeof GM_setValue === 'function') {
        return {
            get(key, fallback) {
                try {
                    const value = GM_getValue(`instalingBot.${key}`, null);
                    return value == null ? fallback : value;
                } catch (error) {
                    return fallback;
                }
            },
            set(key, value) {
                try {
                    GM_setValue(`instalingBot.${key}`, value);
                } catch (error) {
                    // Ignore quota/permission errors.
                }
            }
        };
    }
    return createStorageAdapter(globalThis.localStorage);
}

const storage = gmStorage();
let language = normalizeLanguage(storage.get('language', 'pl'));
const t = (key, vars) => translate(language, key, vars);

let engine = null;
let root = null;
let els = {};

function styleText() {
    return `
        :host { all: initial; }
        .wrap {
            position: fixed; right: 14px; bottom: 14px; z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px; color: #f3f4f6;
        }
        .bubble {
            width: 56px; height: 56px; border-radius: 50%; border: 2px solid #111;
            background: #1f2937; color: #fff; font-size: 26px; line-height: 1;
            box-shadow: 0 6px 18px rgba(0,0,0,.35); cursor: pointer;
        }
        .bubble.running { background: #166534; }
        .bubble.error { background: #991b1b; }
        .bubble.stopped { background: #92400e; }
        .panel {
            width: min(320px, calc(100vw - 28px));
            margin-bottom: 10px; padding: 14px; border-radius: 14px;
            background: #111827; border: 2px solid #374151;
            box-shadow: 0 10px 30px rgba(0,0,0,.45);
        }
        .panel[hidden] { display: none; }
        .row { display: flex; align-items: center; gap: 8px; }
        .title { font-weight: 700; font-size: 15px; flex: 1; }
        .version { color: #9ca3af; font-size: 11px; }
        .status { margin: 10px 0 6px; font-weight: 600; color: #93c5fd; }
        .status.error { color: #fca5a5; }
        .status.finished { color: #86efac; }
        .counts { color: #d1d5db; font-size: 12px; margin-bottom: 10px; }
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        button.action {
            min-height: 44px; border-radius: 10px; border: 2px solid #000;
            font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .start { background: #16a34a; color: #fff; }
        .stop { background: #dc2626; color: #fff; }
        .action:disabled { opacity: .5; cursor: default; }
        .lang { margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 12px; }
        select { background: #1f2937; color: #fff; border: 1px solid #4b5563; border-radius: 6px; padding: 4px 6px; }
        .link { display: block; margin-top: 10px; color: #93c5fd; font-size: 12px; text-decoration: none; }
        .log { margin-top: 8px; color: #9ca3af; font-size: 12px; min-height: 16px; }
    `;
}

function buildUi() {
    root = document.createElement('div');
    root.id = 'instaling-bot-panel';
    const shadow = root.attachShadow({mode: 'open'});
    const style = document.createElement('style');
    style.textContent = styleText();

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.hidden = true;

    panel.innerHTML = `
        <div class="row">
            <span class="title"></span>
            <span class="version"></span>
        </div>
        <div class="status"></div>
        <div class="counts"></div>
        <div class="actions">
            <button class="action start" type="button"></button>
            <button class="action stop" type="button"></button>
        </div>
        <label class="lang">
            <span class="lang-label"></span>
            <select class="lang-select">
                <option value="pl">Polski</option>
                <option value="en">English</option>
            </select>
        </label>
        <div class="log"></div>
        <a class="link" target="_blank" rel="noopener"></a>
    `;

    const bubble = document.createElement('button');
    bubble.className = 'bubble';
    bubble.type = 'button';
    bubble.textContent = '🤖';

    wrap.append(panel, bubble);
    shadow.append(style, wrap);
    document.documentElement.appendChild(root);

    els = {
        panel,
        bubble,
        title: panel.querySelector('.title'),
        version: panel.querySelector('.version'),
        status: panel.querySelector('.status'),
        counts: panel.querySelector('.counts'),
        start: panel.querySelector('.start'),
        stop: panel.querySelector('.stop'),
        langLabel: panel.querySelector('.lang-label'),
        langSelect: panel.querySelector('.lang-select'),
        log: panel.querySelector('.log'),
        link: panel.querySelector('.link')
    };

    bubble.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        render();
    });
    els.start.addEventListener('click', () => {
        engine.start();
        render();
    });
    els.stop.addEventListener('click', () => {
        engine.stop();
        render();
    });
    els.langSelect.addEventListener('change', () => {
        language = normalizeLanguage(els.langSelect.value);
        storage.set('language', language);
        engine.setLanguage(language);
        render();
    });
    els.link.href = RELEASES_URL;
    els.link.textContent = t('panel.link');
}

function statusKey(status) {
    return `status.${status}`;
}

function render() {
    if (!els.panel) return;
    const state = engine.getState();
    els.title.textContent = t('panel.title');
    els.version.textContent = `v${VERSION}`;
    els.status.textContent = t(statusKey(state.status));
    els.status.className = `status ${state.status}`;
    els.counts.textContent = `${t('panel.answers', {count: state.answers})} · ${t('panel.saved', {count: state.savedWords})}`;
    els.start.textContent = t('panel.start');
    els.stop.textContent = t('panel.stop');
    els.langLabel.textContent = t('panel.language');
    els.langSelect.value = language;
    els.start.disabled = state.running;
    els.stop.disabled = !state.running;
    els.bubble.className = `bubble ${state.status}`;
    els.bubble.title = t(statusKey(state.status));
    els.link.textContent = t('panel.link');
}

function onEvent(event) {
    if (event.type === 'log') {
        els.log.textContent = event.message;
    }
    if (event.type === 'error') {
        els.log.textContent = event.message;
    }
    render();
}

function boot() {
    if (document.getElementById('instaling-bot-panel')) return;
    buildUi();
    engine = createEngine({
        storage,
        language,
        version: VERSION,
        onEvent
    });
    engine.resume();
    render();

    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang');
    if (langParam) {
        language = normalizeLanguage(langParam);
        storage.set('language', language);
        engine.setLanguage(language);
        render();
    }
    if (params.get('autostart') === '1') {
        setTimeout(() => {
            engine.start();
            render();
        }, 1200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once: true});
} else {
    boot();
}
