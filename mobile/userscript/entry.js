// Userscript entry: floating panel + shared engine. Bundled by
// scripts/build-mobile.js into dist/instaling-bot.user.js.

const {createEngine, createStorageAdapter} = require('../engine/engine.js');
const {normalizeLanguage, translate} = require('../engine/i18n.js');

const VERSION = __VERSION__;
// The official app icon, inlined by the build script (data URI). Falls back to
// the emoji when the bundle is built without the asset.
const ICON = typeof __ICON__ === 'string' ? __ICON__ : '';
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
            background: #1f2937 center/68% no-repeat;
            color: #fff; font-size: 26px; line-height: 1;
            box-shadow: 0 6px 18px rgba(0,0,0,.35); cursor: pointer;
        }
        .bubble.running { background-color: #166534; }
        .bubble.error { background-color: #991b1b; }
        .bubble.stopped { background-color: #92400e; }
        .panel {
            position: fixed; left: 50%; bottom: 84px;
            transform: translateX(-50%);
            width: min(340px, calc(100vw - 24px));
            max-height: calc(100vh - 108px);
            overflow-y: auto;
            padding: 14px; border-radius: 14px;
            background: #111827; border: 2px solid #374151;
            box-shadow: 0 10px 30px rgba(0,0,0,.45);
        }
        .panel[hidden] { display: none; }
        .row { display: flex; align-items: center; gap: 8px; }
        .logo { width: 26px; height: 26px; border-radius: 6px; flex: 0 0 auto; }
        .title { font-weight: 700; font-size: 15px; flex: 1; }
        .version { color: #9ca3af; font-size: 11px; }
        .status { margin: 10px 0 6px; font-weight: 600; color: #93c5fd; }
        .status.error { color: #fca5a5; }
        .status.finished { color: #86efac; }
        .counts { color: #d1d5db; font-size: 12px; }
        .stats { margin: 6px 0 10px; color: #9ca3af; font-size: 12px; }
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        button.action {
            min-height: 44px; border-radius: 10px; border: 2px solid #000;
            font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .start { background: #16a34a; color: #fff; }
        .stop { background: #dc2626; color: #fff; }
        .action:disabled { opacity: .5; cursor: default; }
        details.settings { margin-top: 10px; border-top: 1px solid #374151; padding-top: 8px; }
        summary { cursor: pointer; font-size: 12px; color: #93c5fd; }
        .field { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 12px; }
        .field input[type="number"] { width: 72px; }
        input[type="number"] { background: #1f2937; color: #fff; border: 1px solid #4b5563; border-radius: 6px; padding: 4px 6px; }
        input[type="checkbox"] { width: 18px; height: 18px; }
        .settings-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        button.save { min-height: 34px; flex: 1; border-radius: 8px; border: 2px solid #000; background: #1d4ed8; color: #fff; font-weight: 700; cursor: pointer; }
        .save-note { color: #86efac; font-size: 11px; min-height: 14px; }
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
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'instaling-bot');

    panel.innerHTML = `
        <div class="row">
            <img class="logo" alt="" aria-hidden="true">
            <span class="title"></span>
            <span class="version"></span>
        </div>
        <div class="status"></div>
        <div class="counts"></div>
        <div class="stats"></div>
        <div class="actions">
            <button class="action start" type="button"></button>
            <button class="action stop" type="button"></button>
        </div>
        <details class="settings">
            <summary></summary>
            <label class="field">
                <span class="settings-validity"></span>
                <input type="number" min="0" max="100" step="5" class="validity" inputmode="numeric">
            </label>
            <label class="field">
                <span class="settings-limit"></span>
                <input type="number" min="0" step="1" class="limit" inputmode="numeric">
            </label>
            <label class="field">
                <span class="settings-autostart"></span>
                <input type="checkbox" class="autostart">
            </label>
            <div class="settings-actions">
                <button class="save" type="button"></button>
                <span class="save-note" role="status"></span>
            </div>
        </details>
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

    wrap.append(bubble);
    shadow.append(style, wrap, panel);
    document.documentElement.appendChild(root);

    els = {
        panel,
        bubble,
        title: panel.querySelector('.title'),
        logo: panel.querySelector('.logo'),
        version: panel.querySelector('.version'),
        status: panel.querySelector('.status'),
        counts: panel.querySelector('.counts'),
        stats: panel.querySelector('.stats'),
        start: panel.querySelector('.start'),
        stop: panel.querySelector('.stop'),
        settingsSummary: panel.querySelector('summary'),
        settingsValidity: panel.querySelector('.settings-validity'),
        settingsLimit: panel.querySelector('.settings-limit'),
        settingsAutostart: panel.querySelector('.settings-autostart'),
        validity: panel.querySelector('.validity'),
        limit: panel.querySelector('.limit'),
        autostart: panel.querySelector('.autostart'),
        save: panel.querySelector('.save'),
        saveNote: panel.querySelector('.save-note'),
        langLabel: panel.querySelector('.lang-label'),
        langSelect: panel.querySelector('.lang-select'),
        log: panel.querySelector('.log'),
        link: panel.querySelector('.link')
    };

    if (ICON) {
        els.bubble.style.backgroundImage = `url("${ICON}")`;
        els.logo.src = ICON;
    } else {
        els.bubble.textContent = '🤖';
        els.logo.hidden = true;
    }

    bubble.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) syncSettings();
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
    els.save.addEventListener('click', saveSettings);
    els.link.href = RELEASES_URL;
    els.link.textContent = t('panel.link');
}

function readAutostart() {
    return storage.get('autostart', false) === true;
}

/** Fills the settings inputs from the persisted config without clobbering typing. */
function syncSettings() {
    const config = engine.getConfig();
    const percent = Math.round((config.valid_chance ?? 0.8) * 100);
    els.validity.value = String(percent);
    els.limit.value = String(config.max_answers ?? 0);
    els.autostart.checked = readAutostart();
    els.saveNote.textContent = '';
}

function saveSettings() {
    const percent = Number(els.validity.value);
    const limit = Number(els.limit.value);
    engine.setConfig({
        valid_chance: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) / 100 : 0.8,
        max_answers: Number.isFinite(limit) ? limit : 0
    });
    storage.set('autostart', els.autostart.checked);
    syncSettings();
    els.saveNote.textContent = t('settings.saved');
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
    els.stats.textContent = renderStats(engine.getStats());
    els.start.textContent = t('panel.start');
    els.stop.textContent = t('panel.stop');
    els.settingsSummary.textContent = t('settings.title');
    els.settingsValidity.textContent = t('settings.validity');
    els.settingsLimit.textContent = t('settings.limit');
    els.settingsAutostart.textContent = t('settings.autostart');
    els.save.textContent = t('settings.save');
    els.langLabel.textContent = t('panel.language');
    els.langSelect.value = language;
    els.start.disabled = state.running;
    els.stop.disabled = !state.running;
    els.bubble.className = `bubble ${state.status}`;
    els.bubble.title = t(statusKey(state.status));
    els.link.textContent = t('panel.link');
}

function renderStats(stats) {
    if (!stats || (stats.total.answers === 0 && stats.total.newWords === 0)) {
        return t('stats.empty');
    }
    const parts = [t('stats.today', {answers: stats.today.answers, correct: stats.today.correct})];
    parts.push(t('stats.accuracy', {percent: stats.total.accuracy}));
    if (stats.streak > 1) parts.push(t('stats.streak', {days: stats.streak}));
    return parts.join(' · ');
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

function shouldAutostart() {
    const params = new URLSearchParams(location.search);
    if (params.get('autostart') === '1') return true;
    return readAutostart();
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
    syncSettings();
    render();

    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang');
    if (langParam) {
        language = normalizeLanguage(langParam);
        storage.set('language', language);
        engine.setLanguage(language);
        render();
    }
    if (shouldAutostart()) {
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
