const {app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage, Notification} = require('electron');
const {execFileSync, fork} = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const readline = require('readline');
const {checkLatestRelease} = require('../src/update.js');
const {readEnvCredentials, resolveCredentials, redactSecrets} = require('../src/credentials.js');
const {
    dateKey,
    isReminderDue,
    loadState: loadReminderState,
    markNotified,
    markSessionDone,
    parseTime,
    repeatMinutes
} = require('../src/reminder.js');
const {loadStats, summarizeAll} = require('../src/stats.js');
const {t, normalizeLanguage} = require('./renderer/i18n.js');

const APP_ID = 'com.bmoneczek.instalingbot';
const IS_DEV = !app.isPackaged;

// Testing/portable hook: point the whole Electron profile (config, cache, logs)
// at another directory before Chromium starts.
if (process.env.INSTALING_DESKTOP_DATA) {
    app.setPath('userData', path.resolve(process.env.INSTALING_DESKTOP_DATA));
}

app.setAppUserModelId(APP_ID);

let mainWindow = null;
let botProcess = null;
let logStream = null;
let stopTimer = null;
let shuttingDown = false;
let isQuitting = false;
let tray = null;
let configCache = null;
let reminderTimer = null;
let updateTimer = null;
let updateInfo = null;
let logBuffer = [];
let logSeq = 0;
let lastNotifiedRun = null;
let logCleanupTimer = null;
let runToken = 0;

function tr(key, vars) {
    return t(configCache?.language ?? 'pl', key, vars);
}

// The tray renders this pixel glyph as a template image on macOS so the menu bar
// can recolour it for light/dark mode. Other platforms keep the coloured icon.
const TRAY_GLYPH = [
    '................',
    '.......##.......',
    '.......##.......',
    '....########....',
    '...##########...',
    '..############..',
    '..###..##..###..',
    '..###..##..###..',
    '..############..',
    '..############..',
    '..####.##.####..',
    '...##########...',
    '....########....',
    '....##.##.##....',
    '...#...##...#...',
    '................'
];
// Same glyph with a solid notification block in the top-right corner. macOS
// template images cannot use colour, so the shape carries the "update" state.
const TRAY_GLYPH_UPDATE = TRAY_GLYPH.map((row, index) => (
    index < 4 ? `${row.slice(0, 12)}####` : row
));
const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const KOFI_URL = 'https://ko-fi.com/bmonekkk';

const LOG_BUFFER_LIMIT = 2000;
// The console is cleared two hours after a session ends so overnight background
// runs do not leave an unreadable wall of text. The env hook is for tests.
const LOG_CLEANUP_MS = Number(process.env.INSTALING_LOG_CLEANUP_MS) > 0
    ? Number(process.env.INSTALING_LOG_CLEANUP_MS)
    : 2 * 60 * 60 * 1000;

let DATA_DIR = '';
let CONFIG_DIR = '';
let CONFIG_PATH = '';
let WORDS_PATH = '';
let LOG_DIR = '';
let LOG_PATH = '';
let DEFAULT_CONFIG_PATH = '';
let DEFAULT_WORDS_PATH = '';
let RUNNER_PATH = '';

let botState = freshState();

function freshState() {
    return {
        running: false,
        status: 'idle',
        phase: 'idle',
        answers: 0,
        correct: 0,
        wrong: 0,
        newWords: 0,
        startedAt: null,
        finishedAt: null,
        exitCode: null,
        stopRequested: false,
        lastError: null,
        lastAnswer: null
    };
}

function initPaths() {
    DATA_DIR = app.getPath('userData');
    CONFIG_DIR = path.join(DATA_DIR, 'config');
    CONFIG_PATH = path.join(CONFIG_DIR, 'Config.json');
    WORDS_PATH = path.join(CONFIG_DIR, 'SavedWords.json');
    LOG_DIR = path.join(DATA_DIR, 'logs');
    LOG_PATH = path.join(LOG_DIR, 'last-run.log');
    DEFAULT_CONFIG_PATH = path.join(app.getAppPath(), 'config', 'Config.defaults.json');
    DEFAULT_WORDS_PATH = path.join(app.getAppPath(), 'config', 'SavedWords.defaults.json');
    RUNNER_PATH = path.join(app.getAppPath(), 'desktop', 'runner.js');
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

// Add newly introduced options without overwriting anything the user configured.
function mergeDefaults(target, defaults) {
    if (Array.isArray(defaults)) {
        return Array.isArray(target) ? target : clone(defaults);
    }
    if (isObject(defaults)) {
        const result = isObject(target) ? {...target} : {};
        for (const [key, value] of Object.entries(defaults)) {
            if (!(key in result) || result[key] === undefined || result[key] === null) {
                result[key] = clone(value);
            } else if (isObject(value) && isObject(result[key])) {
                result[key] = mergeDefaults(result[key], value);
            }
        }
        return result;
    }
    return target === undefined ? defaults : target;
}

async function readJson(file) {
    const raw = await fsp.readFile(file, 'utf8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

async function writeJson(file, value) {
    await fsp.mkdir(path.dirname(file), {recursive: true});
    await fsp.writeFile(file, JSON.stringify(value, null, 4) + '\n', 'utf8');
    secureFile(file);
}

// Best-effort credential-file hardening: chmod 600 on POSIX and a private ACL
// on Windows. Failures are non-fatal because some filesystems cannot store
// permissions (FAT/exFAT, network shares, managed Windows profiles).
function secureFile(file) {
    try {
        if (process.platform === 'win32') {
            const account = process.env.USERNAME
                ? (process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\${process.env.USERNAME}` : process.env.USERNAME)
                : '';
            if (!account) return;
            execFileSync('icacls', [file, '/inheritance:r', '/grant:r', `${account}:F`], {
                stdio: 'ignore',
                windowsHide: true
            });
        } else {
            fs.chmodSync(file, 0o600);
        }
    } catch (error) {
        // Keep running even when the filesystem does not support permissions.
    }
}

function redact(text) {
    return redactSecrets(text, [process.env.INSTALING_PASSWORD, configCache?.credentials?.password]);
}

async function ensureDataFiles() {
    await Promise.all([
        fsp.mkdir(CONFIG_DIR, {recursive: true}),
        fsp.mkdir(path.join(DATA_DIR, 'pages'), {recursive: true}),
        fsp.mkdir(path.join(DATA_DIR, 'screenshots'), {recursive: true}),
        fsp.mkdir(LOG_DIR, {recursive: true})
    ]);

    if (!fs.existsSync(CONFIG_PATH)) {
        await fsp.copyFile(DEFAULT_CONFIG_PATH, CONFIG_PATH);
        secureFile(CONFIG_PATH);
    }
    if (!fs.existsSync(WORDS_PATH)) {
        await fsp.copyFile(DEFAULT_WORDS_PATH, WORDS_PATH);
    }

    const [current, defaults] = await Promise.all([
        readJson(CONFIG_PATH),
        readJson(DEFAULT_CONFIG_PATH)
    ]);
    const merged = mergeDefaults(current, defaults);
    if (JSON.stringify(merged) !== JSON.stringify(current)) {
        await writeJson(CONFIG_PATH, merged);
    }
    secureFile(CONFIG_PATH);
    return merged;
}

function normalizeConfig(raw) {
    const credentials = raw.credentials ?? {
        login: raw.login ?? '',
        password: raw.password ?? ''
    };
    return {
        ...raw,
        credentials: {
            login: String(credentials.login ?? ''),
            password: String(credentials.password ?? '')
        },
        language: normalizeLanguage(raw.language)
    };
}

async function loadConfig() {
    await ensureDataFiles();
    configCache = normalizeConfig(await readJson(CONFIG_PATH));
    return configCache;
}

function validReminderTime(value) {
    return parseTime(value)?.text ?? null;
}

function clampNumber(value, fallback, min, max, integer = false) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const clamped = Math.min(max, Math.max(min, parsed));
    return integer ? Math.round(clamped) : clamped;
}

function applySettings(current, payload) {
    const next = clone(current);
    const credentials = payload?.credentials ?? {};
    const fromEnv = readEnvCredentials();

    next.credentials = {
        login: fromEnv.hasLogin
            ? String(current.credentials?.login ?? '')
            : String(credentials.login ?? '').trim(),
        password: fromEnv.hasPassword
            ? String(current.credentials?.password ?? '')
            : String(credentials.password ?? '')
    };
    next.language = normalizeLanguage(payload?.language ?? current.language ?? 'pl');

    next.valid_chance = clampNumber(payload?.valid_chance, current.valid_chance ?? 0.8, 0, 1);
    next.show_browser = Boolean(payload?.show_browser ?? current.show_browser);
    next.mute_audio = Boolean(payload?.mute_audio ?? current.mute_audio);
    next.debug = Boolean(payload?.debug ?? current.debug);

    const reminder = payload?.reminder ?? {};
    next.reminder = {
        enabled: reminder.enabled === undefined
            ? current.reminder?.enabled !== false
            : Boolean(reminder.enabled),
        time: validReminderTime(reminder.time)
            ?? validReminderTime(current.reminder?.time)
            ?? '17:00',
        repeat_minutes: clampNumber(
            reminder.repeat_minutes,
            repeatMinutes(current.reminder),
            0,
            1440,
            true
        )
    };

    const background = payload?.background ?? {};
    next.background = {
        run_in_tray: background.run_in_tray === undefined
            ? Boolean(current.background?.run_in_tray)
            : Boolean(background.run_in_tray),
        start_at_login: background.start_at_login === undefined
            ? Boolean(current.background?.start_at_login)
            : Boolean(background.start_at_login)
    };

    const notifications = payload?.notifications ?? {};
    next.notifications = {
        session_finished: notifications.session_finished === undefined
            ? current.notifications?.session_finished !== false
            : Boolean(notifications.session_finished)
    };

    const delays = payload?.delays ?? {};
    next.delays = {
        ...(current.delays ?? {}),
        type_min: clampNumber(delays.type_min, current.delays?.type_min ?? 90, 0, 5000, true),
        type_max: clampNumber(delays.type_max, current.delays?.type_max ?? 230, 0, 5000, true),
        type_pause_chance: clampNumber(delays.type_pause_chance, current.delays?.type_pause_chance ?? 0.12, 0, 1),
        typo_chance: clampNumber(delays.typo_chance, current.delays?.typo_chance ?? 0.15, 0, 1),
        click_min: clampNumber(delays.click_min, current.delays?.click_min ?? 2000, 0, 120000, true),
        click_max: clampNumber(delays.click_max, current.delays?.click_max ?? 4500, 0, 120000, true)
    };
    if (next.delays.type_max < next.delays.type_min) {
        next.delays.type_max = next.delays.type_min;
    }
    if (next.delays.click_max < next.delays.click_min) {
        next.delays.click_max = next.delays.click_min;
    }

    const effective = resolveCredentials(next.credentials);
    if (!effective.login || !effective.password) {
        throw new Error(tr('toast.loginRequired'));
    }

    return next;
}

async function saveSettings(payload) {
    const current = await loadConfig();
    const next = applySettings(current, payload);
    await writeJson(CONFIG_PATH, next);
    configCache = next;
    applyBackgroundSettings();
    return next;
}

function publicState() {
    return {
        bot: clone(botState),
        paths: {
            data: DATA_DIR,
            config: CONFIG_PATH,
            words: WORDS_PATH,
            log: LOG_PATH
        },
        version: app.getVersion(),
        platform: process.platform,
        packaged: app.isPackaged
    };
}

function configForRenderer(config) {
    const fromEnv = readEnvCredentials();
    return {
        credentials: {
            login: fromEnv.hasLogin ? fromEnv.login : config.credentials.login ?? '',
            password: fromEnv.hasPassword ? '' : config.credentials.password ?? '',
            env_login: fromEnv.hasLogin,
            env_password: fromEnv.hasPassword
        },
        valid_chance: config.valid_chance ?? 0.8,
        show_browser: config.show_browser !== false,
        mute_audio: config.mute_audio !== false,
        debug: Boolean(config.debug),
        delays: {
            type_min: config.delays?.type_min ?? 90,
            type_max: config.delays?.type_max ?? 230,
            type_pause_chance: config.delays?.type_pause_chance ?? 0.12,
            typo_chance: config.delays?.typo_chance ?? 0.15,
            click_min: config.delays?.click_min ?? 2000,
            click_max: config.delays?.click_max ?? 4500
        },
        reminder: {
            enabled: config.reminder?.enabled !== false,
            time: validReminderTime(config.reminder?.time) ?? '17:00',
            repeat_minutes: repeatMinutes(config.reminder)
        },
        background: {
            run_in_tray: Boolean(config.background?.run_in_tray),
            start_at_login: Boolean(config.background?.start_at_login)
        },
        notifications: {
            session_finished: config.notifications?.session_finished !== false
        },
        language: normalizeLanguage(config.language)
    };
}

function send(channel, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
}

function broadcastState() {
    send('bot:status', publicState());
}

function appendLog(line) {
    const safeLine = redact(line);
    if (logStream) {
        logStream.write(safeLine + '\n');
    }
    logSeq += 1;
    logBuffer.push({seq: logSeq, line: safeLine});
    if (logBuffer.length > LOG_BUFFER_LIMIT) {
        logBuffer.splice(0, logBuffer.length - LOG_BUFFER_LIMIT);
    }
    send('bot:log', {line: safeLine, seq: logSeq});
}

function resetLogBuffer() {
    logBuffer = [];
    send('bot:clear-log');
}

function scheduleLogCleanup(token) {
    if (logCleanupTimer) clearTimeout(logCleanupTimer);
    logCleanupTimer = setTimeout(() => {
        logCleanupTimer = null;
        if (botProcess || token !== runToken) return;
        closeLogStream();
        resetLogBuffer();
        try {
            fs.writeFileSync(LOG_PATH, '', 'utf8');
        } catch (error) {
            // The log file may be gone; the in-app console still gets cleared.
        }
        appendLog(tr('log.clearScheduled'));
    }, LOG_CLEANUP_MS);
    if (logCleanupTimer.unref) logCleanupTimer.unref();
}

function closeLogStream() {
    if (logStream) {
        logStream.end();
        logStream = null;
    }
}

function resolveBundledBrowser() {
    if (!app.isPackaged) {
        return {cacheDir: null, executable: null};
    }

    const browserDir = path.join(process.resourcesPath, 'browser');
    const manifestPath = path.join(browserDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(tr('error.chromeMissing'));
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const executable = path.resolve(browserDir, manifest.executable);
    if (!fs.existsSync(executable)) {
        throw new Error(tr('error.chromeNotFound', {path: executable}));
    }
    return {cacheDir: browserDir, executable};
}

function handleBotMessage(message) {
    if (!message || message.type !== 'bot-event') return;

    switch (message.event) {
        case 'answer':
            botState.answers = Math.max(botState.answers, Number(message.index) || 0);
            break;
        case 'answered':
            if (message.correct) {
                botState.correct += 1;
            } else {
                botState.wrong += 1;
            }
            botState.lastAnswer = {
                polish: message.polish ?? null,
                typed: message.typed ?? null,
                valid: message.valid ?? null,
                correct: Boolean(message.correct)
            };
            break;
        case 'new-word':
            botState.newWords += 1;
            botState.wrong += 1;
            break;
        case 'phase':
            botState.phase = message.phase ?? botState.phase;
            break;
        case 'error':
            botState.lastError = redact(message.message ?? tr('error.unknown'));
            break;
        case 'finished':
            botState.exitCode = message.code ?? null;
            break;
        default:
            break;
    }
    broadcastState();
}

function startLogFile() {
    closeLogStream();
    fs.mkdirSync(LOG_DIR, {recursive: true});
    logStream = fs.createWriteStream(LOG_PATH, {flags: 'w'});
    logStream.write(`instaling-bot ${app.getVersion()} - ${new Date().toISOString()}\n\n`);
}

function attachProcessOutput(child) {
    const handleLine = line => {
        if (!line.trim()) return;
        appendLog(line);
    };

    for (const stream of [child.stdout, child.stderr]) {
        if (!stream) continue;
        readline.createInterface({input: stream}).on('line', handleLine);
    }
}

async function startBot() {
    if (botProcess) {
        return {ok: false, error: tr('error.botRunning')};
    }

    if (logCleanupTimer) {
        clearTimeout(logCleanupTimer);
        logCleanupTimer = null;
    }
    const token = ++runToken;

    const config = await loadConfig();
    const effectiveCredentials = resolveCredentials(config.credentials);
    if (!effectiveCredentials.login || !effectiveCredentials.password) {
        throw new Error(tr('toast.loginRequired'));
    }

    // Refresh the update state when a session starts (not when it ends) so a
    // long-running background app notices new releases without blocking start.
    checkUpdates().catch(() => {});

    const browser = resolveBundledBrowser();
    botState = freshState();
    botState.running = true;
    botState.status = 'running';
    botState.phase = 'launching';
    botState.startedAt = Date.now();

    startLogFile();
    resetLogBuffer();
    broadcastState();
    appendLog(tr('log.startingApp', {version: app.getVersion()}));
    if (browser.executable) {
        appendLog(`[APP] Chrome: ${browser.executable}`);
    }

    const env = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        INSTALING_ROOT: DATA_DIR,
        INSTALING_CONFIG: CONFIG_PATH,
        FORCE_COLOR: '0',
        NO_COLOR: '1'
    };
    if (browser.executable) {
        env.INSTALING_CHROME = browser.executable;
        env.PUPPETEER_EXECUTABLE_PATH = browser.executable;
    }
    if (browser.cacheDir) {
        env.PUPPETEER_CACHE_DIR = browser.cacheDir;
    }

    const child = (() => {
        try {
            return fork(RUNNER_PATH, [], {
                execPath: process.execPath,
                cwd: DATA_DIR,
                env,
                silent: true,
                windowsHide: true
            });
        } catch (error) {
            botState.running = false;
            botState.status = 'error';
            botState.phase = 'idle';
            botState.lastError = error.message;
            appendLog(tr('log.startProcessFailed', {message: error.message}));
            closeLogStream();
            broadcastState();
            throw error;
        }
    })();
    botProcess = child;

    attachProcessOutput(child);
    child.on('message', handleBotMessage);

    child.on('error', error => {
        botState.lastError = error.message;
        botState.status = 'error';
        appendLog(tr('log.processError', {message: error.message}));
        broadcastState();
    });

    child.on('exit', (code, signal) => {
        cleanUpChild();
        const stopped = botState.stopRequested;
        botState.running = false;
        botState.status = stopped ? 'stopped' : (code === 0 ? 'finished' : 'error');
        botState.phase = 'idle';
        botState.exitCode = code;
        botState.finishedAt = Date.now();
        if (code === 0 && botState.answers > 0) {
            markSessionDone(new Date(), DATA_DIR).catch(() => {});
        }
        if (code !== 0 && !stopped) {
            botState.lastError = signal
                ? tr('error.processExitSignal', {code, signal})
                : tr('error.processExitCode', {code});
        }
        appendLog(code === null || code === undefined
            ? tr('log.processExitNoCode')
            : tr('log.processExit', {code}));
        closeLogStream();
        broadcastState();
        notifySessionFinished();
        scheduleLogCleanup(token);
    });

    return {ok: true};
}

function cleanUpChild() {
    if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
    }
    botProcess = null;
}

function requestStop() {
    if (!botProcess) {
        return {ok: false, error: tr('error.botNotRunning')};
    }
    if (botState.stopRequested) {
        return {ok: true};
    }

    botState.stopRequested = true;
    botState.status = 'stopping';
    botState.phase = 'stopping';
    appendLog(tr('log.stopping'));
    broadcastState();

    try {
        botProcess.send({type: 'stop'});
    } catch (error) {
        appendLog(tr('log.stopSendFailed', {message: error.message}));
    }

    stopTimer = setTimeout(() => {
        if (botProcess) {
            appendLog(tr('log.stopForce'));
            botProcess.kill();
        }
    }, 15000);

    return {ok: true};
}

function trayIcon() {
    const hasUpdate = Boolean(updateInfo?.available);
    if (process.platform === 'darwin') {
        return templateTrayIcon(hasUpdate);
    }
    const iconPath = path.join(app.getAppPath(), 'build', 'icon.png');
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) return image;
    return hasUpdate ? updateBadgeImage(image, 16) : image.resize({width: 16, height: 16});
}

// Adds a red corner dot to the coloured tray icon used on Windows/Linux.
function updateBadgeImage(image, size) {
    const resized = image.resize({width: size, height: size});
    const bitmap = Buffer.from(resized.toBitmap());
    const dot = Math.max(3, Math.round(size / 4));
    for (let y = 0; y < dot; y++) {
        for (let x = size - dot; x < size; x++) {
            const offset = (y * size + x) * 4;
            bitmap[offset] = 0;
            bitmap[offset + 1] = 0;
            bitmap[offset + 2] = 255;
            bitmap[offset + 3] = 255;
        }
    }
    return nativeImage.createFromBitmap(bitmap, {width: size, height: size});
}

function bitmapFromGlyph(size, glyph = TRAY_GLYPH) {
    const buffer = Buffer.alloc(size * size * 4);
    const scale = size / 16;
    for (let y = 0; y < size; y++) {
        const row = glyph[Math.min(15, Math.floor(y / scale))] ?? '';
        for (let x = 0; x < size; x++) {
            const on = row[Math.min(15, Math.floor(x / scale))] === '#';
            if (!on) continue;
            buffer[(y * size + x) * 4 + 3] = 255;
        }
    }
    return buffer;
}

function templateTrayIcon(hasUpdate = false) {
    const glyph = hasUpdate ? TRAY_GLYPH_UPDATE : TRAY_GLYPH;
    const image = nativeImage.createFromBitmap(bitmapFromGlyph(16, glyph), {width: 16, height: 16});
    image.addRepresentation({
        scaleFactor: 2,
        width: 32,
        height: 32,
        buffer: bitmapFromGlyph(32, glyph)
    });
    image.setTemplateImage(true);
    return image;
}

function setDockVisible(visible) {
    if (process.platform !== 'darwin' || !app.dock) return;
    try {
        app.setActivationPolicy(visible ? 'regular' : 'accessory');
        if (visible) {
            app.dock.show();
        } else {
            app.dock.hide();
        }
    } catch (error) {
        console.error('Could not update dock visibility:', error);
    }
}

function showWindow() {
    setDockVisible(true);
    if (!mainWindow) {
        createWindow(true);
        return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
}

/**
 * Closing the window in tray mode destroys the renderer instead of keeping it
 * hidden. The main process keeps the reminder/update loops and the bot child
 * alive, which keeps background memory well below a full browser window.
 */
function hideToTray() {
    if (mainWindow) {
        mainWindow.destroy();
        mainWindow = null;
    }
    setDockVisible(false);
}

function notifySessionFinished() {
    if (!Notification.isSupported() || lastNotifiedRun === botState.finishedAt) return;
    if (configCache?.notifications?.session_finished === false) return;
    // Notify only when the result is not already on screen: hidden to tray,
    // minimised, or no window at all. A visible, focused window is enough.
    const windowOnScreen = mainWindow
        && !mainWindow.isDestroyed()
        && mainWindow.isVisible()
        && !mainWindow.isMinimized();
    if (windowOnScreen) return;
    lastNotifiedRun = botState.finishedAt;

    const failed = botState.status === 'error';
    const body = failed
        ? tr('notify.failed', {message: botState.lastError ?? tr('error.unknown')})
        : tr('notify.finished', {answers: botState.answers, correct: botState.correct});
    notifyTrayMessage(body);
}

function notifyTrayMessage(body) {
    if (!Notification.isSupported()) return;
    const notification = new Notification({title: 'instaling-bot', body: redact(body)});
    notification.on('click', showWindow);
    notification.show();
}

function notifyTrayError(message) {
    if (mainWindow && mainWindow.isVisible()) return;
    notifyTrayMessage(tr('notify.startFailed', {message}));
}

function openExternalUrl(url) {
    if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return;
    shell.openExternal(url).catch(() => {});
}

function trayMenuTemplate() {
    const items = [
        {label: tr('tray.show'), click: showWindow},
        {label: tr('tray.support'), click: () => openExternalUrl(KOFI_URL)},
        {type: 'separator'},
        {
            label: tr('tray.start'),
            click: () => {
                startBot().catch(error => {
                    appendLog(`[APP] ${error.message}`);
                    notifyTrayError(error.message);
                });
            }
        },
        {label: tr('tray.stop'), click: () => requestStop()}
    ];

    if (updateInfo?.available) {
        items.push(
            {type: 'separator'},
            {
                label: tr('tray.update', {version: updateInfo.latest}),
                click: () => openExternalUrl(updateInfo.url)
            }
        );
    }

    items.push(
        {type: 'separator'},
        {
            label: tr('tray.quit'),
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    );
    return items;
}

function updateTray() {
    const enabled = Boolean(configCache?.background?.run_in_tray);
    if (!enabled) {
        if (tray) {
            tray.destroy();
            tray = null;
        }
        return;
    }

    if (!tray) {
        tray = new Tray(trayIcon());
        tray.on('click', showWindow);
    } else {
        tray.setImage(trayIcon());
    }
    tray.setToolTip(updateInfo?.available
        ? tr('tray.tooltipUpdate', {version: updateInfo.latest})
        : 'instaling-bot');
    tray.setContextMenu(Menu.buildFromTemplate(trayMenuTemplate()));
}

function applyLoginItem(enabled) {
    if (!app.isPackaged) return;
    try {
        app.setLoginItemSettings({
            openAtLogin: Boolean(enabled),
            openAsHidden: true,
            args: ['--hidden']
        });
    } catch (error) {
        console.error('Could not update login item:', error);
    }
}

function applyBackgroundSettings() {
    updateTray();
    applyLoginItem(configCache?.background?.start_at_login);
    if (!configCache?.background?.run_in_tray && mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
    }
}

async function checkReminder() {
    const config = configCache ?? await loadConfig();
    if (!config.reminder || config.reminder.enabled === false) return;

    const state = await loadReminderState(DATA_DIR);
    const now = new Date();
    if (!isReminderDue(config, state, now)) return;

    if (Notification.isSupported()) {
        const notification = new Notification({
            title: 'instaling-bot',
            body: tr('notify.reminder'),
            silent: false
        });
        notification.on('click', showWindow);
        notification.show();
    }

    send('app:reminder', {date: dateKey(now)});
    await markNotified(now, DATA_DIR);
    appendLog(tr('log.reminderSent'));
}

function startReminderLoop() {
    if (reminderTimer) clearInterval(reminderTimer);
    reminderTimer = setInterval(() => checkReminder().catch(() => {}), 60 * 1000);
    setTimeout(() => checkReminder().catch(() => {}), 5000);
}

async function checkUpdates() {
    try {
        const previous = updateInfo;
        updateInfo = {...await checkLatestRelease(app.getVersion()), checkedAt: Date.now()};
        if (updateInfo.available) {
            send('app:update-available', updateInfo);
            if (!previous?.available || previous.latest !== updateInfo.latest) {
                appendLog(tr('log.updateAvailable', {version: updateInfo.latest}));
            }
        }
    } catch (error) {
        // A transient network error must not clear an update we already found.
        updateInfo = updateInfo?.available
            ? {...updateInfo, error: error.message, checkedAt: Date.now()}
            : {available: false, error: error.message, checkedAt: Date.now()};
    }
    updateTray();
    return updateInfo;
}

function startUpdateChecks() {
    setTimeout(() => checkUpdates().catch(() => {}), 4000);
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => checkUpdates().catch(() => {}), UPDATE_CHECK_INTERVAL_MS);
}

function createWindow(show = true) {
    mainWindow = new BrowserWindow({
        width: 1180,
        height: 860,
        minWidth: 860,
        minHeight: 640,
        show: false,
        frame: false,
        backgroundColor: '#0f172a',
        title: 'instaling-bot',
        icon: path.join(app.getAppPath(), 'build', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    mainWindow.once('ready-to-show', () => {
        if (show) mainWindow.show();
    });
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (/^https?:\/\//i.test(url)) {
            shell.openExternal(url);
        }
        return {action: 'deny'};
    });

    // The renderer is a local, static document. Deny every web permission and
    // stop the top-level document from navigating anywhere, so remote content
    // can never inherit the preload bridge or reach the IPC channel.
    mainWindow.webContents.session.setPermissionRequestHandler((contents, permission, callback) => {
        callback(false);
    });
    mainWindow.webContents.on('will-navigate', event => {
        event.preventDefault();
    });

    mainWindow.on('maximize', () => send('window:maximized', true));
    mainWindow.on('unmaximize', () => send('window:maximized', false));
    mainWindow.on('close', event => {
        if (!isQuitting && configCache?.background?.run_in_tray) {
            event.preventDefault();
            setImmediate(hideToTray);
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function assertSender(event) {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
        throw new Error('Unauthorized IPC sender');
    }
}

function registerIpc() {
    ipcMain.handle('app:get-state', async event => {
        assertSender(event);
        const config = await loadConfig();
        return {
            ...publicState(),
            config: configForRenderer(config)
        };
    });

    ipcMain.handle('app:get-log-buffer', async event => {
        assertSender(event);
        return logBuffer;
    });

    ipcMain.handle('app:clear-log-buffer', async event => {
        assertSender(event);
        logBuffer = [];
        return true;
    });

    ipcMain.handle('app:check-updates', async event => {
        assertSender(event);
        return checkUpdates();
    });

    ipcMain.handle('app:update-status', async event => {
        assertSender(event);
        return updateInfo;
    });

    ipcMain.handle('app:get-stats', async event => {
        assertSender(event);
        const stats = await loadStats(DATA_DIR);
        return summarizeAll(stats);
    });

    ipcMain.handle('app:save-settings', async (event, payload) => {
        assertSender(event);
        const config = await saveSettings(payload);
        return {ok: true, config: configForRenderer(config), state: publicState()};
    });

    ipcMain.handle('app:set-language', async (event, value) => {
        assertSender(event);
        const language = normalizeLanguage(value);
        const current = await loadConfig();
        if (current.language !== language) {
            current.language = language;
            await writeJson(CONFIG_PATH, current);
            configCache = current;
            if (tray) {
                tray.destroy();
                tray = null;
            }
            updateTray();
        }
        return {ok: true, language};
    });

    ipcMain.handle('bot:start', async (event, payload) => {
        assertSender(event);
        if (botProcess) {
            return {ok: false, error: tr('error.botRunning')};
        }
        await saveSettings(payload);
        return startBot();
    });

    ipcMain.handle('bot:stop', async event => {
        assertSender(event);
        return requestStop();
    });

    ipcMain.handle('app:open-data-folder', async event => {
        assertSender(event);
        await fsp.mkdir(DATA_DIR, {recursive: true});
        return shell.openPath(DATA_DIR);
    });

    ipcMain.handle('app:open-log-file', async event => {
        assertSender(event);
        if (!fs.existsSync(LOG_PATH)) {
            return tr('log.notCreated');
        }
        return shell.openPath(LOG_PATH);
    });

    ipcMain.handle('app:open-external', async (event, url) => {
        assertSender(event);
        if (typeof url !== 'string' || !/^https:\/\//i.test(url)) {
            throw new Error(tr('error.invalidUrl'));
        }
        await shell.openExternal(url);
    });

    ipcMain.handle('window:minimize', event => {
        assertSender(event);
        mainWindow.minimize();
    });

    ipcMain.handle('window:toggle-maximize', event => {
        assertSender(event);
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
        return mainWindow.isMaximized();
    });

    ipcMain.handle('window:close', event => {
        assertSender(event);
        mainWindow.close();
    });

    ipcMain.handle('window:is-maximized', event => {
        assertSender(event);
        return mainWindow.isMaximized();
    });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        showWindow();
    });

    app.whenReady().then(async () => {
        initPaths();
        configCache = await ensureDataFiles();
        registerIpc();
        Menu.setApplicationMenu(null);
        updateTray();
        applyLoginItem(configCache.background?.start_at_login);

        const openedHidden = app.getLoginItemSettings().wasOpenedAsHidden
            || process.argv.includes('--hidden');
        const startHidden = Boolean(configCache.background?.run_in_tray) && openedHidden;
        if (startHidden) {
            setDockVisible(false);
        } else {
            createWindow(true);
        }
        startReminderLoop();
        startUpdateChecks();

        if (IS_DEV && process.env.INSTALING_DEVTOOLS === '1' && mainWindow) {
            mainWindow.webContents.openDevTools({mode: 'detach'});
        }
    }).catch(error => {
        console.error(error);
        app.quit();
    });
}

app.on('window-all-closed', () => {
    if (!configCache?.background?.run_in_tray) {
        app.quit();
    }
});

// macOS Dock icon (only when the window is normally visible). Hidden startup
// and tray mode never create a window here, so the menu-bar icon stays in charge.
app.on('activate', () => {
    if (mainWindow) showWindow();
});

app.on('before-quit', event => {
    isQuitting = true;
    if (!botProcess || shuttingDown) return;
    event.preventDefault();
    shuttingDown = true;
    requestStop();

    const deadline = Date.now() + 12000;
    const timer = setInterval(() => {
        if (!botProcess || Date.now() > deadline) {
            clearInterval(timer);
            if (botProcess) {
                botProcess.kill();
            }
            app.quit();
        }
    }, 100);
});

process.on('uncaughtException', error => {
    try {
        fs.mkdirSync(LOG_DIR, {recursive: true});
        fs.appendFileSync(LOG_PATH, `\n[APP FATAL] ${error.stack ?? error}\n`, 'utf8');
    } catch (e) {
        // ignore logging failures during shutdown
    }
});
