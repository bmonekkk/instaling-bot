const api = window.instaling;

const $ = id => document.getElementById(id);

const els = {
    form: $('settings-form'),
    login: $('login'),
    password: $('password'),
    togglePassword: $('toggle-password'),
    validChance: $('valid-chance'),
    validChanceValue: $('valid-chance-value'),
    maxAnswers: $('max-answers'),
    showBrowser: $('show-browser'),
    muteAudio: $('mute-audio'),
    typeMin: $('type-min'),
    typeMax: $('type-max'),
    typoChance: $('typo-chance'),
    typoChanceValue: $('typo-chance-value'),
    pauseChance: $('pause-chance'),
    pauseChanceValue: $('pause-chance-value'),
    clickMin: $('click-min'),
    clickMax: $('click-max'),
    debug: $('debug'),
    start: $('start'),
    stop: $('stop'),
    save: $('save'),
    openData: $('open-data'),
    openLog: $('open-log'),
    clearLog: $('clear-log'),
    github: $('github-link'),
    log: $('log'),
    autoscroll: $('autoscroll'),
    statusBadge: $('status-badge'),
    statusDot: $('status-dot'),
    phaseText: $('phase-text'),
    answerCount: $('answer-count'),
    correctCount: $('correct-count'),
    wrongCount: $('wrong-count'),
    elapsed: $('elapsed'),
    footerStatus: $('footer-status'),
    footerPath: $('footer-path'),
    footerVersion: $('footer-version'),
    titleVersion: $('title-version'),
    toast: $('toast'),
    titlebar: $('titlebar'),
    winMinimize: $('win-minimize'),
    winMaximize: $('win-maximize'),
    winClose: $('win-close')
};

let appState = null;
let startedAt = null;
let finishedAt = null;
let elapsedTimer = null;
let toastTimer = null;
let busy = false;

function toNumber(input, fallback = 0) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : fallback;
}

function updateRangeLabels() {
    els.validChanceValue.textContent = `${els.validChance.value}%`;
    els.typoChanceValue.textContent = `${els.typoChance.value}%`;
    els.pauseChanceValue.textContent = `${els.pauseChance.value}%`;
}

function fillForm(config) {
    els.login.value = config.credentials?.login ?? '';
    els.password.value = config.credentials?.password ?? '';
    els.validChance.value = String(Math.round((config.valid_chance ?? 0.8) * 100));
    els.maxAnswers.value = String(config.max_answers ?? 0);
    els.showBrowser.checked = config.show_browser !== false;
    els.muteAudio.checked = config.mute_audio !== false;
    els.typeMin.value = String(config.delays?.type_min ?? 90);
    els.typeMax.value = String(config.delays?.type_max ?? 230);
    els.typoChance.value = String(Math.round((config.delays?.typo_chance ?? 0.15) * 100));
    els.pauseChance.value = String(Math.round((config.delays?.type_pause_chance ?? 0.12) * 100));
    els.clickMin.value = String(config.delays?.click_min ?? 3500);
    els.clickMax.value = String(config.delays?.click_max ?? 6500);
    els.debug.checked = Boolean(config.debug);
    updateRangeLabels();
}

function collectSettings() {
    return {
        credentials: {
            login: els.login.value.trim(),
            password: els.password.value
        },
        valid_chance: toNumber(els.validChance, 80) / 100,
        max_answers: Math.max(0, Math.round(toNumber(els.maxAnswers, 0))),
        show_browser: els.showBrowser.checked,
        mute_audio: els.muteAudio.checked,
        debug: els.debug.checked,
        delays: {
            type_min: Math.max(0, Math.round(toNumber(els.typeMin, 90))),
            type_max: Math.max(0, Math.round(toNumber(els.typeMax, 230))),
            typo_chance: toNumber(els.typoChance, 15) / 100,
            type_pause_chance: toNumber(els.pauseChance, 12) / 100,
            click_min: Math.max(0, Math.round(toNumber(els.clickMin, 3500))),
            click_max: Math.max(0, Math.round(toNumber(els.clickMax, 6500)))
        }
    };
}

function validateCredentials() {
    if (!els.login.value.trim() || !els.password.value) {
        toast('Podaj login i hasło do InstaLing.', true);
        els.login.focus();
        return false;
    }
    return true;
}

function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.toggle('error', isError);
    els.toast.hidden = false;
    toastTimer = setTimeout(() => {
        els.toast.hidden = true;
    }, isError ? 7000 : 3000);
}

function setBusy(next) {
    busy = next;
    updateButtons();
}

function updateButtons() {
    const running = Boolean(appState?.bot?.running);
    els.start.disabled = busy || running;
    els.stop.disabled = busy || !running;
    els.save.disabled = busy;
}

function statusLabel(status) {
    switch (status) {
        case 'running': return 'Działa';
        case 'stopping': return 'Stop...';
        case 'finished': return 'Zakończono';
        case 'stopped': return 'Zatrzymano';
        case 'error': return 'Błąd';
        default: return 'Gotowy';
    }
}

function phaseLabel(bot) {
    if (bot.lastError && !bot.running) return bot.lastError;
    switch (bot.phase) {
        case 'launching': return 'Uruchamianie Chrome i logowanie...';
        case 'logged-in': return 'Zalogowano — wybieranie sesji...';
        case 'running': return `Rozwiązywanie słówek${bot.lastAnswer?.polish ? ` — ${bot.lastAnswer.polish}` : ''}...`;
        case 'stopping': return 'Zapisywanie słówek i zamykanie Chrome...';
        default: return bot.status === 'finished' ? 'Sesja zakończona.' : 'Gotowy do startu.';
    }
}

function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = value => String(value).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function tickElapsed() {
    if (!startedAt) {
        els.elapsed.textContent = '00:00';
        return;
    }
    const end = finishedAt ?? Date.now();
    els.elapsed.textContent = formatDuration(end - startedAt);
}

function scheduleElapsed() {
    if (elapsedTimer) {
        clearInterval(elapsedTimer);
        elapsedTimer = null;
    }
    tickElapsed();
    if (startedAt && !finishedAt) {
        elapsedTimer = setInterval(tickElapsed, 1000);
    }
}

function applyBotState(bot) {
    if (!bot) return;
    els.answerCount.textContent = String(bot.answers ?? 0);
    els.correctCount.textContent = String(bot.correct ?? 0);
    els.wrongCount.textContent = String(bot.wrong ?? 0);

    const status = bot.status ?? 'idle';
    els.statusBadge.textContent = statusLabel(status);
    els.statusBadge.className = `status-badge ${status}`;
    els.statusDot.className = `status-dot ${status}`;
    els.phaseText.textContent = phaseLabel(bot);
    els.phaseText.title = phaseLabel(bot);
    els.footerStatus.textContent = statusLabel(status);

    startedAt = bot.startedAt ?? null;
    finishedAt = bot.finishedAt ?? null;
    scheduleElapsed();
    updateButtons();
}

async function loadState() {
    if (!api) {
        appendLog('[APP] Brak mostu Electron. Otwórz aplikację przez npm run desktop.', 'error');
        return;
    }
    try {
        const state = await api.getState();
        appState = state;
        fillForm(state.config ?? {});
        applyBotState(state.bot);
        const version = state.version ? `v${state.version}` : 'v3.0.0';
        els.titleVersion.textContent = version;
        els.footerVersion.textContent = version;
        document.title = `instaling-bot ${version}`;
        els.footerPath.textContent = state.paths?.data ?? '—';
        els.footerPath.title = state.paths?.data ?? '';
    } catch (error) {
        showToast(error.message || String(error), true);
        appendLog(`[APP] Nie udało się wczytać ustawień: ${error.message || error}`, 'error');
    }
}

async function saveSettings({silent = false} = {}) {
    if (!api) return false;
    if (!validateCredentials()) return false;

    setBusy(true);
    try {
        const result = await api.saveSettings(collectSettings());
        if (result?.config) fillForm(result.config);
        if (result?.state) {
            appState = result.state;
            applyBotState(result.state.bot);
        }
        if (!silent) {
            showToast(appState?.bot?.running
                ? 'Zapisano. Zmiany zadziałają po następnym uruchomieniu bota.'
                : 'Ustawienia zapisane.');
        }
        return true;
    } catch (error) {
        showToast(error.message || String(error), true);
        return false;
    } finally {
        setBusy(false);
    }
}

async function startBot() {
    if (!api || busy) return;
    if (!validateCredentials()) return;

    setBusy(true);
    clearLog();
    appendLog('[APP] Startowanie...', 'dim');
    try {
        const result = await api.startBot(collectSettings());
        if (result && result.ok === false) {
            showToast(result.error || 'Nie udało się uruchomić bota.', true);
            appendLog(`[APP] ${result.error || 'Nie udało się uruchomić bota.'}`, 'error');
        }
    } catch (error) {
        showToast(error.message || String(error), true);
        appendLog(`[APP] ${error.message || error}`, 'error');
    } finally {
        setBusy(false);
    }
}

async function stopBot() {
    if (!api || busy) return;
    setBusy(true);
    try {
        const result = await api.stopBot();
        if (result && result.ok === false) {
            showToast(result.error || 'Bot nie działa.', true);
        }
    } catch (error) {
        showToast(error.message || String(error), true);
    } finally {
        setBusy(false);
    }
}

function eraseEmptyState() {
    const empty = els.log.querySelector('.log-empty');
    if (empty) empty.remove();
}

function clearLog() {
    els.log.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = 'Konsola jest pusta. Naciśnij Start, aby uruchomić bota.';
    els.log.appendChild(empty);
}

function classifyLogLine(line) {
    const lower = line.toLowerCase();
    if (/\[app\] bot zakończył pracę \(kod 0\)/.test(lower)) return 'success';
    if (/error|failed|błąd|nie powiod|fatal|exception|nie znaleziono|brak przeglądarki/.test(lower)) return 'error';
    if (/\[done\]|\[start\]|logged in|session finished|zakończono|thanks for using/.test(lower)) return 'success';
    if (/\[cookie\]|\[stop\]|deliberate|retrying|ostrzeżenie|warning/.test(lower)) return 'warn';
    if (/\[login\]|\[answer\]|\[app\]/.test(lower)) return 'info';
    if (/^https?:\/\//.test(line)) return 'dim';
    return '';
}

function timeString(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function appendLog(line, forcedClass = '') {
    const clean = String(line ?? '').replace(/\u001b\[[0-9;]*m/g, '').replace(/\r/g, '');
    if (!clean.trim()) return;

    eraseEmptyState();
    const row = document.createElement('div');
    row.className = `log-line ${forcedClass || classifyLogLine(clean)}`.trim();

    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = `[${timeString()}] `;

    const text = document.createElement('span');
    text.textContent = clean;

    row.append(time, text);
    els.log.appendChild(row);

    while (els.log.children.length > 2500) {
        els.log.removeChild(els.log.firstElementChild);
    }

    if (els.autoscroll.checked) {
        els.log.scrollTop = els.log.scrollHeight;
    }
}

function updateMaximizeButton(maximized) {
    els.winMaximize.textContent = maximized ? '❐' : '□';
    els.winMaximize.title = maximized ? 'Przywróć' : 'Maksymalizuj';
}

function wireEvents() {
    els.form.addEventListener('submit', event => {
        event.preventDefault();
        saveSettings();
    });

    els.validChance.addEventListener('input', updateRangeLabels);
    els.typoChance.addEventListener('input', updateRangeLabels);
    els.pauseChance.addEventListener('input', updateRangeLabels);

    els.togglePassword.addEventListener('click', () => {
        const showing = els.password.type === 'text';
        els.password.type = showing ? 'password' : 'text';
        els.togglePassword.textContent = showing ? 'Pokaż' : 'Ukryj';
    });

    els.start.addEventListener('click', startBot);
    els.stop.addEventListener('click', stopBot);
    els.openData.addEventListener('click', () => api?.openDataFolder());
    els.openLog.addEventListener('click', async () => {
        if (!api) return;
        try {
            const result = await api.openLogFile();
            if (result) showToast(result, true);
        } catch (error) {
            showToast(error.message || String(error), true);
        }
    });
    els.clearLog.addEventListener('click', clearLog);
    els.footerPath.addEventListener('click', () => {
        if (api) api.openDataFolder().catch(error => showToast(error.message || String(error), true));
    });
    els.github.addEventListener('click', () => {
        if (api) api.openExternal('https://github.com/Bmoneczek/instaling-bot').catch(error => showToast(error.message || String(error), true));
    });

    els.winMinimize.addEventListener('click', () => api?.minimizeWindow());
    els.winMaximize.addEventListener('click', async () => {
        if (!api) return;
        const maximized = await api.toggleMaximize();
        updateMaximizeButton(Boolean(maximized));
    });
    els.winClose.addEventListener('click', () => api?.closeWindow());

    els.titlebar.addEventListener('dblclick', async event => {
        if (event.target.closest('.window-controls')) return;
        if (!api) return;
        const maximized = await api.toggleMaximize();
        updateMaximizeButton(Boolean(maximized));
    });

    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveSettings();
        }
    });

    if (api) {
        api.onLog(({line}) => appendLog(line));
        api.onStatus(state => {
            appState = state;
            applyBotState(state.bot);
        });
        api.onClearLog(clearLog);
        api.onMaximized(updateMaximizeButton);
        api.isMaximized().then(updateMaximizeButton).catch(() => {});
    }
}

clearLog();
wireEvents();
updateRangeLabels();
loadState();
