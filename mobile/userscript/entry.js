// Userscript entry: floating panel + shared engine. Bundled by
// scripts/build-mobile.js into dist/instaling-bot.user.js.
//
// The panel deliberately mirrors the desktop app and the download page: a
// classic light-gray window with Tahoma text, square bevel borders and a navy
// title bar, so all three surfaces look like the same program.

const {createEngine, createStorageAdapter} = require('../engine/engine.js');
const {normalizeLanguage, translate} = require('../engine/i18n.js');

const VERSION = __VERSION__;
// The official app icon, inlined by the build script (data URI). Falls back to
// the emoji when the bundle is built without the asset.
const ICON = typeof __ICON__ === 'string' ? __ICON__ : '';
const RELEASES_URL = 'https://github.com/bmonekkk/instaling-bot/releases/latest';

const REMINDER_KEY = 'reminder';
const DEFAULT_REMINDER = {enabled: true, time: '17:00', repeat_minutes: 0};

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
            font-family: Tahoma, "MS Sans Serif", "Segoe UI", sans-serif;
            font-size: 13px; color: #000;
        }
        .bubble {
            width: 48px; height: 44px; padding: 0; cursor: pointer;
            background: #c0c0c0 center/70% no-repeat;
            color: #000; font-size: 22px; line-height: 1;
            border: 2px solid;
            border-color: #ffffff #404040 #404040 #ffffff;
            box-shadow: 2px 2px 0 rgba(0,0,0,.4);
        }
        .bubble:active { border-color: #404040 #ffffff #ffffff #404040; }
        .bubble.running { background-color: #8fce8f; }
        .bubble.error { background-color: #e6a0a0; }
        .bubble.stopped { background-color: #f0d090; }

        .panel {
            position: fixed; left: 50%; bottom: 74px;
            transform: translateX(-50%);
            width: min(360px, calc(100vw - 20px));
            max-height: calc(100vh - 96px);
            overflow-y: auto;
            background: #c0c0c0;
            border: 2px solid #000;
            box-shadow: 3px 3px 0 rgba(0,0,0,.45);
        }
        .panel[hidden] { display: none; }

        .titlebar {
            display: flex; align-items: center; gap: 6px;
            padding: 3px 4px 3px 6px;
            color: #fff; font-weight: 700;
            background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
        }
        .titlebar .logo { width: 16px; height: 16px; flex: 0 0 auto; }
        .titlebar .title { flex: 1; }
        .titlebar .version { font-size: 11px; font-weight: 400; opacity: .85; }
        .close-btn {
            width: 18px; height: 16px; padding: 0; cursor: pointer;
            color: #000; font-family: "Courier New", monospace; line-height: 1;
            background: #c0c0c0; border: 2px solid;
            border-color: #ffffff #404040 #404040 #ffffff;
        }

        .body { padding: 10px; }

        .status { font-weight: 700; margin-bottom: 4px; }
        .status.error { color: #800000; }
        .status.finished { color: #006400; }
        .counts { font-size: 12px; }
        .stats { color: #333; font-size: 12px; margin: 4px 0 8px; }

        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .action {
            min-height: 34px; padding: 4px 8px; cursor: pointer;
            font: inherit; font-weight: 700; color: #fff;
            border: 2px solid;
            border-color: #ffffff #404040 #404040 #ffffff;
        }
        .action:active { border-color: #404040 #ffffff #ffffff #404040; }
        .start { background: #006400; }
        .stop { background: #800000; }
        .action:disabled { color: #888; background: #b0b0b0; cursor: default; }

        details.settings { margin-top: 10px; }
        summary { cursor: pointer; font-weight: 700; }
        fieldset {
            margin: 8px 0 0; padding: 6px 8px 8px;
            border: 2px groove #fff;
        }
        legend { padding: 0 4px; font-weight: 700; font-size: 12px; }
        .field {
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px; margin-top: 6px; font-size: 12px;
        }
        .field input[type="number"] { width: 76px; }
        .field input[type="time"] { width: 92px; }
        input[type="number"], input[type="time"], select {
            font: inherit; font-size: 12px; padding: 2px 4px; color: #000;
            background: #fff; border: 2px solid;
            border-color: #404040 #fff #fff #404040;
        }
        input[type="checkbox"] { width: 15px; height: 15px; }
        .field.check { justify-content: flex-start; }
        .hint { margin: 6px 0 0; font-size: 11px; color: #333; }

        .settings-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .save {
            min-height: 30px; padding: 4px 14px; cursor: pointer;
            font: inherit; font-weight: 700;
            background: #c0c0c0; border: 2px solid;
            border-color: #ffffff #404040 #404040 #ffffff;
            box-shadow: 1px 1px 0 #000;
        }
        .save:active { border-color: #404040 #ffffff #ffffff #404040; box-shadow: none; }
        .save-note { font-size: 11px; color: #006400; }

        .lang { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; }
        .log { margin-top: 8px; font-size: 11px; color: #333; min-height: 14px; }
        .link { display: block; margin-top: 8px; font-size: 12px; color: #000080; }

        .banner {
            position: fixed; left: 50%; top: 12px; transform: translateX(-50%);
            z-index: 2147483647; width: min(420px, calc(100vw - 20px));
            display: flex; align-items: center; gap: 8px;
            padding: 8px 10px; color: #000; background: #ffffcc;
            font-family: Tahoma, "MS Sans Serif", "Segoe UI", sans-serif;
            font-size: 13px; border: 2px solid #000;
            box-shadow: 2px 2px 0 rgba(0,0,0,.4);
        }
        .banner[hidden] { display: none; }
        .banner .banner-text { flex: 1; }
        .banner button {
            font: inherit; font-weight: 700; cursor: pointer;
            background: #c0c0c0; border: 2px solid;
            border-color: #ffffff #404040 #404040 #ffffff;
        }
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
        <div class="titlebar">
            <img class="logo" alt="" aria-hidden="true">
            <span class="title"></span>
            <span class="version"></span>
            <button class="close-btn" type="button" aria-label="Close">×</button>
        </div>
        <div class="body">
            <div class="status"></div>
            <div class="counts"></div>
            <div class="stats"></div>
            <div class="actions">
                <button class="action start" type="button"></button>
                <button class="action stop" type="button"></button>
            </div>
            <details class="settings">
                <summary></summary>
                <fieldset>
                    <legend class="legend-behavior"></legend>
                    <label class="field">
                        <span class="settings-validity"></span>
                        <input type="number" min="0" max="100" step="5" class="validity" inputmode="numeric">
                    </label>
                    <label class="field check">
                        <input type="checkbox" class="autostart">
                        <span class="settings-autostart"></span>
                    </label>
                </fieldset>
                <fieldset>
                    <legend class="legend-timing"></legend>
                    <label class="field"><span class="settings-clickMin"></span>
                        <input type="number" min="0" max="120000" step="100" class="click-min" inputmode="numeric"></label>
                    <label class="field"><span class="settings-clickMax"></span>
                        <input type="number" min="0" max="120000" step="100" class="click-max" inputmode="numeric"></label>
                    <label class="field"><span class="settings-typeMin"></span>
                        <input type="number" min="0" max="5000" step="10" class="type-min" inputmode="numeric"></label>
                    <label class="field"><span class="settings-typeMax"></span>
                        <input type="number" min="0" max="5000" step="10" class="type-max" inputmode="numeric"></label>
                    <label class="field"><span class="settings-typoChance"></span>
                        <input type="number" min="0" max="100" step="1" class="typo-chance" inputmode="numeric"></label>
                    <label class="field"><span class="settings-pauseChance"></span>
                        <input type="number" min="0" max="100" step="1" class="pause-chance" inputmode="numeric"></label>
                </fieldset>
                <fieldset>
                    <legend class="legend-reminder"></legend>
                    <label class="field check">
                        <input type="checkbox" class="reminder-enabled">
                        <span class="settings-reminderEnabled"></span>
                    </label>
                    <label class="field"><span class="settings-reminder"></span>
                        <input type="time" class="reminder-time"></label>
                    <label class="field"><span class="settings-repeat"></span>
                        <select class="reminder-repeat">
                            <option value="0" data-i18n="repeat.0"></option>
                            <option value="15" data-i18n="repeat.15"></option>
                            <option value="30" data-i18n="repeat.30"></option>
                            <option value="60" data-i18n="repeat.60"></option>
                            <option value="120" data-i18n="repeat.120"></option>
                            <option value="180" data-i18n="repeat.180"></option>
                        </select>
                    </label>
                    <p class="hint settings-reminderHint"></p>
                </fieldset>
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
        </div>
    `;

    const bubble = document.createElement('button');
    bubble.className = 'bubble';
    bubble.type = 'button';

    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.hidden = true;
    banner.innerHTML = `
        <span class="banner-text"></span>
        <button class="banner-close" type="button"></button>
    `;

    wrap.append(bubble);
    shadow.append(style, wrap, panel, banner);
    document.documentElement.appendChild(root);

    els = {
        panel,
        bubble,
        banner,
        bannerText: banner.querySelector('.banner-text'),
        bannerClose: banner.querySelector('.banner-close'),
        title: panel.querySelector('.title'),
        logo: panel.querySelector('.logo'),
        version: panel.querySelector('.version'),
        closeBtn: panel.querySelector('.close-btn'),
        status: panel.querySelector('.status'),
        counts: panel.querySelector('.counts'),
        stats: panel.querySelector('.stats'),
        start: panel.querySelector('.start'),
        stop: panel.querySelector('.stop'),
        settingsSummary: panel.querySelector('summary'),
        legendBehavior: panel.querySelector('.legend-behavior'),
        legendTiming: panel.querySelector('.legend-timing'),
        legendReminder: panel.querySelector('.legend-reminder'),
        settingsValidity: panel.querySelector('.settings-validity'),
        settingsAutostart: panel.querySelector('.settings-autostart'),
        settingsClickMin: panel.querySelector('.settings-clickMin'),
        settingsClickMax: panel.querySelector('.settings-clickMax'),
        settingsTypeMin: panel.querySelector('.settings-typeMin'),
        settingsTypeMax: panel.querySelector('.settings-typeMax'),
        settingsTypoChance: panel.querySelector('.settings-typoChance'),
        settingsPauseChance: panel.querySelector('.settings-pauseChance'),
        settingsReminderEnabled: panel.querySelector('.settings-reminderEnabled'),
        settingsReminder: panel.querySelector('.settings-reminder'),
        settingsRepeat: panel.querySelector('.settings-repeat'),
        settingsReminderHint: panel.querySelector('.settings-reminderHint'),
        validity: panel.querySelector('.validity'),
        autostart: panel.querySelector('.autostart'),
        clickMin: panel.querySelector('.click-min'),
        clickMax: panel.querySelector('.click-max'),
        typeMin: panel.querySelector('.type-min'),
        typeMax: panel.querySelector('.type-max'),
        typoChance: panel.querySelector('.typo-chance'),
        pauseChance: panel.querySelector('.pause-chance'),
        reminderEnabled: panel.querySelector('.reminder-enabled'),
        reminderTime: panel.querySelector('.reminder-time'),
        reminderRepeat: panel.querySelector('.reminder-repeat'),
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
    els.closeBtn.addEventListener('click', () => {
        panel.hidden = true;
    });
    els.start.addEventListener('click', () => {
        engine.start();
        render();
    });
    els.stop.addEventListener('click', () => {
        engine.stop();
        render();
    });
    els.bannerClose.addEventListener('click', () => {
        els.banner.hidden = true;
    });
    els.langSelect.addEventListener('change', () => {
        language = normalizeLanguage(els.langSelect.value);
        storage.set('language', language);
        engine.setLanguage(language);
        applyStaticText();
        render();
    });
    els.save.addEventListener('click', saveSettings);
    els.link.href = RELEASES_URL;
    applyStaticText();
}

/** Fills every static label from the dictionary (also after a language switch). */
function applyStaticText() {
    els.title.textContent = t('panel.title');
    els.version.textContent = `v${VERSION}`;
    els.settingsSummary.textContent = t('settings.title');
    els.legendBehavior.textContent = t('settings.behavior');
    els.legendTiming.textContent = t('settings.timing');
    els.legendReminder.textContent = t('settings.reminders');
    els.settingsValidity.textContent = t('settings.validity');
    els.settingsAutostart.textContent = t('settings.autostart');
    els.settingsClickMin.textContent = t('settings.clickMin');
    els.settingsClickMax.textContent = t('settings.clickMax');
    els.settingsTypeMin.textContent = t('settings.typeMin');
    els.settingsTypeMax.textContent = t('settings.typeMax');
    els.settingsTypoChance.textContent = t('settings.typoChance');
    els.settingsPauseChance.textContent = t('settings.pauseChance');
    els.settingsReminderEnabled.textContent = t('settings.reminderEnabled');
    els.settingsReminder.textContent = t('settings.reminder');
    els.settingsRepeat.textContent = t('settings.repeat');
    els.settingsReminderHint.textContent = t('settings.reminderHint');
    els.save.textContent = t('settings.save');
    els.langLabel.textContent = t('panel.language');
    els.bannerText.textContent = t('reminder.banner');
    els.bannerClose.textContent = 'OK';
    els.link.textContent = t('panel.link');
    for (const option of els.reminderRepeat.options) {
        option.textContent = t(option.dataset.i18n);
    }
}

function readAutostart() {
    return storage.get('autostart', false) === true;
}

function readReminder() {
    const stored = storage.get(REMINDER_KEY, null);
    if (!stored || typeof stored !== 'object') return {...DEFAULT_REMINDER};
    return {
        enabled: stored.enabled !== false,
        time: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(stored.time ?? '')) ? stored.time : DEFAULT_REMINDER.time,
        repeat_minutes: Number.isFinite(Number(stored.repeat_minutes))
            ? Math.max(0, Math.round(Number(stored.repeat_minutes)))
            : 0
    };
}

/** Fills the settings inputs from the persisted config without clobbering typing. */
function syncSettings() {
    const config = engine.getConfig();
    const delays = config.delays ?? {};
    els.validity.value = String(Math.round((config.valid_chance ?? 0.8) * 100));
    els.clickMin.value = String(delays.click_min ?? 2000);
    els.clickMax.value = String(delays.click_max ?? 4500);
    els.typeMin.value = String(delays.type_min ?? 90);
    els.typeMax.value = String(delays.type_max ?? 230);
    els.typoChance.value = String(Math.round((delays.typo_chance ?? 0.15) * 100));
    els.pauseChance.value = String(Math.round((delays.type_pause_chance ?? 0.12) * 100));
    els.autostart.checked = readAutostart();

    const reminder = readReminder();
    els.reminderEnabled.checked = reminder.enabled;
    els.reminderTime.value = reminder.time;
    els.reminderRepeat.value = String(reminder.repeat_minutes);
    if (![...els.reminderRepeat.options].some(option => option.value === els.reminderRepeat.value)) {
        els.reminderRepeat.value = '0';
    }
    els.saveNote.textContent = '';
}

function number(input, fallback) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : fallback;
}

function saveSettings() {
    const percent = number(els.validity, 80);
    const typo = number(els.typoChance, 15);
    const pause = number(els.pauseChance, 12);
    engine.setConfig({
        valid_chance: Math.min(100, Math.max(0, percent)) / 100,
        delays: {
            click_min: Math.max(0, Math.round(number(els.clickMin, 2000))),
            click_max: Math.max(0, Math.round(number(els.clickMax, 4500))),
            type_min: Math.max(0, Math.round(number(els.typeMin, 90))),
            type_max: Math.max(0, Math.round(number(els.typeMax, 230))),
            typo_chance: Math.min(100, Math.max(0, typo)) / 100,
            type_pause_chance: Math.min(100, Math.max(0, pause)) / 100
        }
    });
    storage.set('autostart', els.autostart.checked);
    storage.set(REMINDER_KEY, {
        enabled: els.reminderEnabled.checked,
        time: /^([01]\d|2[0-3]):[0-5]\d$/.test(els.reminderTime.value) ? els.reminderTime.value : DEFAULT_REMINDER.time,
        repeat_minutes: Math.max(0, Math.round(number(els.reminderRepeat, 0)))
    });
    syncSettings();
    els.saveNote.textContent = t('settings.saved');
}

function statusKey(status) {
    return `status.${status}`;
}

function render() {
    if (!els.panel) return;
    const state = engine.getState();
    els.status.textContent = t(statusKey(state.status));
    els.status.className = `status ${state.status}`;
    els.counts.textContent = `${t('panel.answers', {count: state.answers})} · ${t('panel.saved', {count: state.savedWords})}`;
    els.stats.textContent = renderStats(engine.getStats());
    els.start.textContent = t('panel.start');
    els.stop.textContent = t('panel.stop');
    els.langSelect.value = language;
    els.start.disabled = state.running;
    els.stop.disabled = !state.running;
    els.bubble.className = `bubble ${state.status}`;
    els.bubble.title = t(statusKey(state.status));
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
    if (event.type === 'log' || event.type === 'error') {
        els.log.textContent = event.message;
    }
    if (event.type === 'finished' && (event.state?.answers ?? 0) > 0) {
        // A session was completed today — hide the reminder if it is on screen.
        els.banner.hidden = true;
    }
    render();
}

/**
 * The simplest possible userscript reminder: while a tab is open, show an
 * in-page banner once after the reminder time when today's session is not
 * done. Userscript code does not run when the tab is closed, so background
 * notifications are left to the phone apps and the OS reminder tools.
 */
function maybeShowBanner() {
    const reminder = readReminder();
    if (!reminder.enabled || !engine) return;
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < hours * 60 + minutes) return;
    let todayAnswers = 0;
    try {
        todayAnswers = engine.getStats().today.answers;
    } catch (error) {
        return;
    }
    if (todayAnswers > 0) return;
    els.banner.hidden = false;
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
        applyStaticText();
        render();
    }
    maybeShowBanner();
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
