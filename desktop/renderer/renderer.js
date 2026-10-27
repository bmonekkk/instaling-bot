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
    reminderEnabled: $('reminder-enabled'),
    reminderTime: $('reminder-time'),
    reminderRepeat: $('reminder-repeat'),
    runInTray: $('run-in-tray'),
    startAtLogin: $('start-at-login'),
    start: $('start'),
    stop: $('stop'),
    save: $('save'),
    openData: $('open-data'),
    openLog: $('open-log'),
    clearLog: $('clear-log'),
    github: $('github-link'),
    openKofi: $('open-kofi'),
    checkUpdates: $('check-updates'),
    footerAuthor: $('footer-author'),
    updateBanner: $('update-banner'),
    updateVersion: $('update-version'),
    updateDownload: $('update-download'),
    updateDismiss: $('update-dismiss'),
    errorModal: $('error-modal'),
    errorModalTitle: $('error-modal-title'),
    errorMessage: $('error-modal-message'),
    errorReadme: $('error-modal-readme'),
    errorClose: $('error-modal-close'),
    openStats: $('open-stats'),
    statsModal: $('stats-modal'),
    statsClose: $('stats-close'),
    statsTabs: Array.from(document.querySelectorAll('.stats-tab')),
    statsNote: $('stats-note'),
    statsSessions: $('stats-sessions'),
    statsAnswers: $('stats-answers'),
    statsCorrect: $('stats-correct'),
    statsWrong: $('stats-wrong'),
    statsPercent: $('stats-percent'),
    statsNew: $('stats-new'),
    statsTime: $('stats-time'),
    statsDays: $('stats-days'),
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
let lastLogSeq = 0;
let lastErrorShown = '';
let replayingLogs = false;
let pendingLogs = [];
let statsCache = null;
let statsPeriod = 'week';

const README_FAQ_URL = 'https://github.com/bmonekkk/instaling-bot/blob/master/README.md#-rozwiązywanie-problemów';

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
    els.clickMin.value = String(config.delays?.click_min ?? 2000);
    els.clickMax.value = String(config.delays?.click_max ?? 4500);
    els.debug.checked = Boolean(config.debug);
    els.reminderEnabled.checked = config.reminder?.enabled !== false;
    els.reminderTime.value = config.reminder?.time ?? '17:00';
    els.reminderRepeat.value = String(config.reminder?.repeat_minutes ?? 0);
    if (!els.reminderRepeat.value || ![...els.reminderRepeat.options].some(option => option.value === els.reminderRepeat.value)) {
        els.reminderRepeat.value = '0';
    }
    els.runInTray.checked = Boolean(config.background?.run_in_tray);
    els.startAtLogin.checked = Boolean(config.background?.start_at_login);
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
        reminder: {
            enabled: els.reminderEnabled.checked,
            time: els.reminderTime.value || '17:00',
            repeat_minutes: Math.max(0, Math.round(toNumber(els.reminderRepeat, 0)))
        },
        background: {
            run_in_tray: els.runInTray.checked,
            start_at_login: els.startAtLogin.checked
        },
        delays: {
            type_min: Math.max(0, Math.round(toNumber(els.typeMin, 90))),
            type_max: Math.max(0, Math.round(toNumber(els.typeMax, 230))),
            typo_chance: toNumber(els.typoChance, 15) / 100,
            type_pause_chance: toNumber(els.pauseChance, 12) / 100,
            click_min: Math.max(0, Math.round(toNumber(els.clickMin, 2000))),
            click_max: Math.max(0, Math.round(toNumber(els.clickMax, 4500)))
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

function showErrorModal(title, message, kind = 'error') {
    els.errorModalTitle.textContent = title;
    els.errorMessage.textContent = message;
    els.errorModal.dataset.kind = kind;
    els.errorModal.hidden = false;
}

function openHelp(url) {
    if (api) api.openExternal(url).catch(error => showToast(error.message || String(error), true));
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

    if ((status === 'error' || (bot.lastError && !bot.running)) && bot.lastError && bot.lastError !== lastErrorShown) {
        lastErrorShown = bot.lastError;
        const offline = navigator.onLine === false
            || /offline|internet|ENOTFOUND|ERR_NAME|ERR_INTERNET|net::/i.test(bot.lastError);
        if (offline) {
            showErrorModal(
                'Brak połączenia z internetem 📡',
                `Bot nie mógł połączyć się z instaling.pl.\n\nSzczegóły: ${bot.lastError}\n\nSprawdź połączenie z internetem i spróbuj ponownie. Pomoc: FAQ w README.`,
                'offline'
            );
        } else {
            showErrorModal(
                'Bot zatrzymał się z błędem ⚠️',
                `${bot.lastError}\n\nZajrzyj do FAQ w README — najczęstsze przyczyny to zmiana układu strony, brak Chrome albo odrzucone logowanie.`,
                'error'
            );
        }
    }

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
        const version = state.version ? `v${state.version}` : 'v3.2.0';
        els.titleVersion.textContent = version;
        els.footerVersion.textContent = version;
        document.title = `instaling-bot ${version}`;
        els.footerPath.textContent = state.paths?.data ?? '—';
        els.footerPath.title = state.paths?.data ?? '';

        const buffered = await api.getLogBuffer().catch(() => []);
        lastLogSeq = 0;
        replayingLogs = true;
        for (const entry of Array.isArray(buffered) ? buffered : []) {
            appendLog(entry?.line ?? '', '', entry?.seq ?? 0);
        }
        replayingLogs = false;
        const queued = pendingLogs;
        pendingLogs = [];
        for (const entry of queued) {
            appendLog(entry?.line ?? '', '', entry?.seq ?? 0);
        }

        if (navigator.onLine === false) {
            showErrorModal(
                'Brak połączenia z internetem 📡',
                'Aplikacja nie widzi połączenia z siecią. Sprawdź połączenie z internetem — bez niego bot nie zaloguje się do instaling.pl. Pomoc: FAQ w README.',
                'offline'
            );
        }
    } catch (error) {
        showToast(error.message || String(error), true);
        appendLog(`[APP] Nie udało się wczytać ustawień: ${error.message || error}`, 'error');
    }
}

function showUpdate(info) {
    if (!info?.available) return;
    els.updateVersion.textContent = `v${info.latest}`;
    els.updateBanner.dataset.url = info.url || '';
    els.updateBanner.hidden = false;
}

async function checkForUpdates({silent = false} = {}) {
    if (!api) return;
    try {
        const result = await api.checkUpdates();
        if (result?.available) {
            showUpdate(result);
        } else if (!silent) {
            showToast(result?.error ? 'Nie udało się sprawdzić aktualizacji.' : 'Masz najnowszą wersję.', Boolean(result?.error));
        }
    } catch (error) {
        if (!silent) showToast(error.message || 'Nie udało się sprawdzić aktualizacji.', true);
    }
}

function formatMinutes(ms) {
    const total = Math.max(0, Math.round(Number(ms ?? 0) / 60000));
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function renderStats(period = statsPeriod) {
    statsPeriod = period;
    const summary = statsCache?.periods?.[period];
    for (const tab of els.statsTabs) {
        const active = tab.dataset.period === period;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    }
    if (!summary) {
        els.statsNote.textContent = 'Nie udało się wczytać statystyk.';
        return;
    }
    els.statsSessions.textContent = String(summary.sessions ?? 0);
    els.statsAnswers.textContent = String(summary.answers ?? 0);
    els.statsCorrect.textContent = String(summary.correct ?? 0);
    els.statsWrong.textContent = String(summary.wrong ?? 0);
    els.statsPercent.textContent = summary.answers > 0 ? `${summary.percent}%` : '—';
    els.statsNew.textContent = String(summary.newWords ?? 0);
    els.statsTime.textContent = formatMinutes(summary.durationMs);
    els.statsDays.textContent = String(summary.activeDays ?? 0);

    if (summary.sessions === 0) {
        els.statsNote.textContent = 'Brak sesji w tym okresie. Uruchom bota, aby zobaczyć statystyki.';
    } else {
        els.statsNote.textContent = `Od ${summary.from} do ${summary.to} · średnio ${summary.averageAnswers} odpowiedzi i ${summary.averageMinutes} min na sesję.`;
    }
}

async function openStats() {
    if (!api) return;
    els.statsModal.hidden = false;
    els.statsNote.textContent = 'Wczytywanie statystyk...';
    try {
        statsCache = await api.getStats();
        renderStats(statsPeriod);
    } catch (error) {
        els.statsNote.textContent = error.message || 'Nie udało się wczytać statystyk.';
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
    if (navigator.onLine === false) {
        showErrorModal(
            'Brak połączenia z internetem 📡',
            'Nie można rozpocząć sesji bez internetu. Sprawdź połączenie z internetem, a potem naciśnij Start ponownie.',
            'offline'
        );
        return;
    }
    if (!validateCredentials()) return;

    lastErrorShown = '';
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

function appendLog(line, forcedClass = '', seq = 0) {
    if (seq) {
        if (seq <= lastLogSeq) return;
        lastLogSeq = seq;
    }
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
    els.clearLog.addEventListener('click', () => {
        clearLog();
        api?.clearLogBuffer().catch(() => {});
    });
    els.footerPath.addEventListener('click', () => {
        if (api) api.openDataFolder().catch(error => showToast(error.message || String(error), true));
    });
    els.github.addEventListener('click', () => {
        if (api) api.openExternal('https://github.com/bmonekkk/instaling-bot').catch(error => showToast(error.message || String(error), true));
    });
    els.openKofi.addEventListener('click', () => {
        if (api) api.openExternal('https://ko-fi.com/bmonekkk').catch(error => showToast(error.message || String(error), true));
    });
    els.footerAuthor.addEventListener('click', () => {
        if (api) api.openExternal('https://github.com/bmonekkk').catch(error => showToast(error.message || String(error), true));
    });
    els.checkUpdates.addEventListener('click', () => checkForUpdates());
    els.openStats.addEventListener('click', () => openStats());
    els.statsClose.addEventListener('click', () => {
        els.statsModal.hidden = true;
    });
    for (const tab of els.statsTabs) {
        tab.addEventListener('click', () => renderStats(tab.dataset.period));
    }
    els.updateDownload.addEventListener('click', () => {
        const url = els.updateBanner.dataset.url;
        if (api && url) api.openExternal(url).catch(error => showToast(error.message || String(error), true));
    });
    els.updateDismiss.addEventListener('click', () => {
        els.updateBanner.hidden = true;
    });

    els.errorClose.addEventListener('click', () => {
        els.errorModal.hidden = true;
    });
    els.errorReadme.addEventListener('click', () => openHelp(README_FAQ_URL));
    window.addEventListener('offline', () => {
        showErrorModal(
            'Brak połączenia z internetem 📡',
            'Połączenie z siecią zostało utracone. Bot nie będzie mógł odpowiadać na słówka, dopóki internet nie wróci. Sprawdź połączenie z internetem. Pomoc: FAQ w README.',
            'offline'
        );
    });
    window.addEventListener('online', () => {
        showToast('Połączenie z internetem wróciło.');
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
        if (event.key === 'Escape' && !els.statsModal.hidden) {
            els.statsModal.hidden = true;
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveSettings();
        }
    });

    if (api) {
        api.onLog(({line, seq}) => {
            if (replayingLogs) {
                pendingLogs.push({line, seq});
                return;
            }
            appendLog(line, '', seq);
        });
        api.onStatus(state => {
            appState = state;
            applyBotState(state.bot);
        });
        api.onClearLog(() => {
            clearLog();
            lastErrorShown = '';
        });
        api.onMaximized(updateMaximizeButton);
        api.onUpdateAvailable(showUpdate);
        api.onReminder(() => showToast('Nie zapomnij o dzisiejszej sesji na InstaLing.'));
        api.isMaximized().then(updateMaximizeButton).catch(() => {});
    }
}

clearLog();
wireEvents();
updateRangeLabels();
loadState().then(() => checkForUpdates({silent: true}));
