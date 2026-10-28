// Mobile session engine shared by the userscript and both native WebViews.
//
// instaling.pl performs real page navigation between the answer and the result,
// so the engine is tick-based: every page load resumes the run from storage and
// performs one step (answer, check, next, start). This also keeps the userscript
// alive across full reloads.

const {SELECTORS, TEXT} = require('./selectors.js');
const dom = require('./dom.js');
const {translate} = require('./i18n.js');
const {
    chooseEnglish,
    chooseErrorMode,
    misspell,
    normalize,
    pickWrongTranslation,
    shouldAnswerCorrect
} = require('../../src/core/index.js');

const DEFAULT_CONFIG = {
    valid_chance: 0.8,
    idle_resume_ms: 1400,
    delays: {
        click_min: 2000,
        click_max: 4500,
        type_min: 90,
        type_max: 230,
        type_pause_chance: 0.12,
        type_pause_min: 250,
        type_pause_max: 700,
        typo_chance: 0.15,
        // How quickly the bot clicks navigation buttons: "next word", "start /
        // continue session" and login. One shared min/max pair, like the desktop
        // Advanced section.
        nav_min: 2000,
        nav_max: 4500,
        // Human-like waiting: think before typing, then read the result before
        // moving on (longer after a mistake, quick after a correct answer).
        think_min: 1500,
        think_max: 4000,
        review_min: 2500,
        review_max: 5500,
        review_correct_min: 500,
        review_correct_max: 1200,
        check_min: 3000,
        check_max: 5500
    }
};

// Period buckets for the statistics panel, mirroring the desktop app.
const PERIOD_DAYS = {
    week: 7,
    month: 30,
    year: 365,
    all: null
};

const FINISHED_PATTERN = /koniec|zakończ|gratulacje|wyniki|podsumowanie|nie ma już|finished|completed|results/i;
const RUN_KEY = 'run';
const CONFIG_KEY = 'config';
// Deadline (ms since epoch) of the navigation pause ("next"/"continue"/start).
// instaling.pl reloads the page on those clicks, which destroys an in-page
// setTimeout, so the deadline is persisted and re-applied on the fresh page.
const NAV_KEY = 'navUntil';
// Only the user-facing settings the shells expose are persisted: the answer
// accuracy and the humanization controls shared with the desktop Advanced
// section. Everything else (internal timings) stays at its default.
const PERSISTED_CONFIG_KEYS = ['valid_chance'];
const USER_DELAY_KEYS = [
    'click_min',
    'click_max',
    'nav_min',
    'nav_max',
    'think_min',
    'think_max',
    'review_min',
    'review_max',
    'review_correct_min',
    'review_correct_max',
    'type_min',
    'type_max',
    'type_pause_chance',
    'typo_chance'
];
// [min, max, integer] for every user-facing delay. Milliseconds for the timing
// pairs, a 0-1 fraction for the probabilities.
const DELAY_BOUNDS = {
    click_min: [0, 120000, true],
    click_max: [0, 120000, true],
    nav_min: [0, 120000, true],
    nav_max: [0, 120000, true],
    think_min: [0, 120000, true],
    think_max: [0, 120000, true],
    review_min: [0, 120000, true],
    review_max: [0, 120000, true],
    review_correct_min: [0, 120000, true],
    review_correct_max: [0, 120000, true],
    type_min: [0, 5000, true],
    type_max: [0, 5000, true],
    type_pause_chance: [0, 1, false],
    typo_chance: [0, 1, false]
};

function pickPersistedConfig(value = {}) {
    const out = {};
    for (const key of PERSISTED_CONFIG_KEYS) {
        if (value?.[key] !== undefined) out[key] = value[key];
    }
    const delays = {};
    for (const key of USER_DELAY_KEYS) {
        if (value?.delays?.[key] !== undefined) delays[key] = value.delays[key];
    }
    if (Object.keys(delays).length > 0) out.delays = delays;
    return out;
}

function sanitizeConfig(value = {}) {
    const out = {...value};
    if (out.valid_chance !== undefined) {
        const chance = Number(out.valid_chance);
        out.valid_chance = Number.isFinite(chance)
            ? Math.min(1, Math.max(0, chance))
            : DEFAULT_CONFIG.valid_chance;
    }
    if (out.delays && typeof out.delays === 'object') {
        const delays = {...out.delays};
        for (const key of USER_DELAY_KEYS) {
            if (delays[key] === undefined) continue;
            const parsed = Number(delays[key]);
            if (!Number.isFinite(parsed)) {
                delete delays[key];
                continue;
            }
            const [min, max, integer] = DELAY_BOUNDS[key];
            const clamped = Math.min(max, Math.max(min, parsed));
            delays[key] = integer ? Math.round(clamped) : clamped;
        }
        const pairs = [
            ['click_min', 'click_max'],
            ['nav_min', 'nav_max'],
            ['think_min', 'think_max'],
            ['review_min', 'review_max'],
            ['review_correct_min', 'review_correct_max'],
            ['type_min', 'type_max']
        ];
        for (const [minKey, maxKey] of pairs) {
            if (delays[maxKey] < delays[minKey]) delays[maxKey] = delays[minKey];
        }
        out.delays = delays;
    }
    return out;
}

function accuracy(correct, answers) {
    return answers > 0 ? Math.round((correct / answers) * 100) : 0;
}

function asCount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

/**
 * Sums the per-day buckets for one period, mirroring the desktop stats model
 * (week/month/year/all) so the mobile shells can show the same panel.
 */
function summarizePeriod(stats, period, now = new Date()) {
    const bucketDays = Object.prototype.hasOwnProperty.call(PERIOD_DAYS, period)
        ? PERIOD_DAYS[period]
        : PERIOD_DAYS.week;
    const to = todayKey(now);
    let from = null;
    if (bucketDays) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (bucketDays - 1));
        from = todayKey(start);
    }

    const summary = {
        period,
        days: bucketDays,
        from,
        to,
        sessions: 0,
        answers: 0,
        correct: 0,
        wrong: 0,
        newWords: 0,
        durationMs: 0,
        activeDays: 0
    };

    for (const [key, day] of Object.entries(stats)) {
        if (!day || typeof day !== 'object') continue;
        if (from && key < from) continue;
        summary.sessions += asCount(day.sessions);
        summary.answers += asCount(day.answers);
        summary.correct += asCount(day.correct);
        summary.wrong += asCount(day.wrong);
        summary.newWords += asCount(day.newWords);
        summary.durationMs += asCount(day.durationMs);
        if (asCount(day.sessions) > 0 || asCount(day.answers) > 0) summary.activeDays += 1;
    }

    if (!from) {
        summary.from = Object.keys(stats).sort()[0] ?? to;
    }
    summary.percent = accuracy(summary.correct, summary.answers);
    summary.averageAnswers = summary.sessions > 0
        ? Math.round(summary.answers / summary.sessions)
        : 0;
    summary.averageMinutes = summary.sessions > 0
        ? Math.round((summary.durationMs / summary.sessions / 60000) * 10) / 10
        : 0;
    return summary;
}

function hasActivity(day) {
    return Boolean(day) && ((day.answers ?? 0) > 0 || (day.newWords ?? 0) > 0);
}

/** Consecutive days (ending today or yesterday) with at least one answer. */
function computeStreak(stats, now = new Date()) {
    const cursor = new Date(now.getTime());
    let streak = 0;
    // Today may still be empty; the streak is only broken once the day is over.
    if (!hasActivity(stats[todayKey(cursor)])) {
        cursor.setDate(cursor.getDate() - 1);
    }
    while (streak < 3660 && hasActivity(stats[todayKey(cursor)])) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function createStorageAdapter(storage) {
    return {
        get(key, fallback) {
            try {
                const value = storage.getItem(`instalingBot.${key}`);
                return value == null ? fallback : JSON.parse(value);
            } catch (error) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                if (value == null) storage.removeItem(`instalingBot.${key}`);
                else storage.setItem(`instalingBot.${key}`, JSON.stringify(value));
                return true;
            } catch (error) {
                return false;
            }
        }
    };
}

function todayKey(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function createEngine({
    storage = createStorageAdapter(globalThis.localStorage),
    onEvent = () => {},
    language = 'pl',
    config: initialConfig = {},
    version = '4.3.0'
} = {}) {
    const state = {
        version,
        running: false,
        status: 'idle',
        answers: 0,
        correct: 0,
        wrong: 0,
        newWords: 0,
        savedWords: 0,
        startedAt: null,
        lastError: null,
        pending: null
    };

    const storedConfig = sanitizeConfig(storage.get(CONFIG_KEY, {}) ?? {});
    const providedConfig = sanitizeConfig(initialConfig);
    let config = sanitizeConfig({
        ...DEFAULT_CONFIG,
        ...storedConfig,
        ...providedConfig,
        delays: {
            ...DEFAULT_CONFIG.delays,
            ...(storedConfig.delays ?? {}),
            ...(initialConfig.delays ?? {})
        }
    });
    let words = storage.get('savedWords', []);
    if (!Array.isArray(words)) words = [];
    state.savedWords = words.length;

    let lang = language;
    let used = [];
    let busy = false;
    let timer = null;
    let startAttempted = false;

    const t = (key, vars) => translate(lang, key, vars);
    const emit = (event, payload = {}) => {
        try {
            onEvent({...event, state: {...state, language: lang}, ...payload});
        } catch (error) {
            // A broken bridge must not stop the bot.
        }
    };
    const log = (message, level = 'info') => emit({type: 'log', level, message});
    const shouldContinue = () => state.running;
    const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));
    // Shared delay before/after navigation clicks ("next", login/start, continue).
    const navWait = () => randomBetween(config.delays.nav_min, config.delays.nav_max);
    // "Thinking" pause after the prompt is visible, before the first keystroke.
    const thinkWait = () => randomBetween(config.delays.think_min, config.delays.think_max);
    // "Reading the result" pause before "next": longer after a mistake or a new
    // word, short after a correct answer.
    const reviewWait = correct => (correct
        ? randomBetween(config.delays.review_correct_min, config.delays.review_correct_max)
        : randomBetween(config.delays.review_min, config.delays.review_max));
    // Short transition wait after a plain click. The real pacing is the think
    // pause on the fresh page, so this only lets an AJAX response settle.
    const transitionWait = () => randomBetween(150, 400);
    // Remembers when the current navigation pause ends *before* the click, so it
    // survives the page reload the site performs on "next"/"continue". Without
    // it the delay would run as an in-page timer and die on navigation, making
    // every word transition as fast as the page load.
    function beginNavWait() {
        storage.set(NAV_KEY, Date.now() + navWait());
    }
    // Waits out the remaining navigation pause. Called right after a navigation
    // click (AJAX case) and at the start of every tick, which is where a fresh
    // page after a reload picks the wait back up.
    async function endNavWait() {
        const deadline = Number(storage.get(NAV_KEY, 0)) || 0;
        if (!deadline) return;
        const remaining = deadline - Date.now();
        if (remaining > 0) await dom.wait(remaining);
        // Do not step on a newer navigation planned while we waited.
        if ((Number(storage.get(NAV_KEY, 0)) || 0) === deadline) storage.set(NAV_KEY, 0);
    }
    async function clickWithNav(click, waitMs = navWait()) {
        storage.set(NAV_KEY, Date.now() + waitMs);
        click();
        await endNavWait();
    }

    function setStatus(status) {
        state.status = status;
        emit({type: 'status', status});
    }

    function persistRun() {
        if (!state.running) {
            storage.set(RUN_KEY, null);
            return;
        }
        storage.set(RUN_KEY, {
            running: true,
            answers: state.answers,
            correct: state.correct,
            wrong: state.wrong,
            newWords: state.newWords,
            startedAt: state.startedAt,
            updatedAt: Date.now(),
            used,
            pending: state.pending
        });
    }

    function restoreRun() {
        const run = storage.get(RUN_KEY, null);
        if (!run?.running) return false;
        // A run that survived a reload is seconds old. Do not silently resume
        // yesterday's session when the user just opens the page again.
        const staleAfter = 15 * 60 * 1000;
        if (run.updatedAt && Date.now() - run.updatedAt > staleAfter) {
            storage.set(RUN_KEY, null);
            return false;
        }
        state.running = true;
        state.answers = run.answers ?? 0;
        state.correct = run.correct ?? 0;
        state.wrong = run.wrong ?? 0;
        state.newWords = run.newWords ?? 0;
        state.startedAt = run.startedAt ?? Date.now();
        state.pending = run.pending ?? null;
        used = Array.isArray(run.used) ? run.used : [];
        return true;
    }

    function saveWords() {
        state.savedWords = words.length;
        storage.set('savedWords', words);
        emit({type: 'saved', count: words.length});
    }

    function findTranslation(polish) {
        const key = normalize(polish);
        return words
            .filter(entry => normalize(entry.polish) === key)
            .map(entry => entry.english)
            .filter(Boolean);
    }

    function rememberWord(polish, english, sentence) {
        if (!polish || !english) return;
        const key = normalize(polish);
        const exists = words.some(entry => normalize(entry.polish) === key
            && normalize(entry.english) === normalize(english));
        if (exists) return;
        words.push({polish, english, sentence: sentence || ''});
        saveWords();
    }

    function recordStats() {
        if (state.answers === 0 && state.newWords === 0) return;
        const stats = storage.get('stats', {});
        const key = todayKey();
        const day = stats[key] ?? {answers: 0, correct: 0, wrong: 0, newWords: 0, sessions: 0, durationMs: 0};
        day.answers += state.answers;
        day.correct += state.correct;
        day.wrong += state.wrong;
        day.newWords += state.newWords;
        // A "session" is a finished run with at least one answer, matching the
        // desktop recorder so the statistics panel shows the same numbers.
        if (state.answers > 0) day.sessions = asCount(day.sessions) + 1;
        day.durationMs = asCount(day.durationMs)
            + (state.startedAt ? Math.max(0, Date.now() - state.startedAt) : 0);
        stats[key] = day;
        storage.set('stats', stats);
        storage.set('lastSession', {
            answers: state.answers,
            correct: state.correct,
            wrong: state.wrong,
            newWords: state.newWords,
            durationMs: state.startedAt ? Date.now() - state.startedAt : 0,
            finishedAt: Date.now()
        });
    }

    function clearTimer() {
        if (timer) clearTimeout(timer);
        timer = null;
    }

    function scheduleTick(delay = config.idle_resume_ms) {
        clearTimer();
        if (!state.running) return;
        timer = setTimeout(() => {
            tick();
        }, delay);
    }

    async function clickFirst(selectors, timeout = 4000, nav = false) {
        const element = await dom.find(selectors, timeout, shouldContinue);
        if (!element) return false;
        if (nav) beginNavWait();
        dom.click(element);
        if (nav) await endNavWait();
        return true;
    }

    async function startSession() {
        log(t('log.starting'));
        await clickFirst(SELECTORS.startSession, 3000, true);
        let continued = await clickFirst(SELECTORS.continueSession, 5000, true);
        if (!continued) continued = await clickFirst(SELECTORS.newSession, 4000, true);
        if (!continued) {
            const continueText = await dom.findByText(TEXT.continue, 2000, shouldContinue);
            if (continueText) {
                await clickWithNav(() => dom.click(continueText));
                continued = true;
            }
        }
        if (!continued) {
            const startText = await dom.findByText(TEXT.start, 2500, shouldContinue);
            if (startText) {
                await clickWithNav(() => dom.click(startText));
                await clickFirst(SELECTORS.newSession, 4000, true);
            }
        }
        await endNavWait();
    }

    async function handleNewWord() {
        state.newWords++;
        log(t('log.newWord'), 'warn');
        persistRun();

        const clicked = await clickFirst(SELECTORS.dontKnowNew, 5000);
        if (!clicked) {
            const dontKnow = await dom.findByText(TEXT.dontKnow, 2500, shouldContinue);
            if (dontKnow) dom.click(dontKnow);
        }
        await dom.wait(randomBetween(config.delays.check_min, config.delays.check_max));
        // A revealed new word is read like a correction, so use the longer pause.
        await dom.wait(reviewWait(false));
        const advanced = await clickFirst(SELECTORS.nextWord, 10000);
        if (!advanced) {
            const next = await dom.findByText(TEXT.next, 2500, shouldContinue);
            if (next) await clickWithNav(() => dom.click(next), transitionWait());
        } else {
            await dom.wait(transitionWait());
        }
        emit({type: 'progress'});
    }

    /**
     * Records the answer that was typed before a navigation. instaling.pl reloads
     * on "check", so the result page finishes the bookkeeping started there.
     */
    /** Records the result of the pending answer. Returns whether it was correct,
     * or null when there is nothing pending. */
    function completePending(revealed) {
        const pending = state.pending;
        if (!pending) return null;
        const validEnglish = revealed || pending.valid || '';
        if (validEnglish) rememberWord(pending.polish, validEnglish, pending.sentence);
        const correct = Boolean(validEnglish && pending.typed === validEnglish);
        state.answers++;
        if (correct) {
            state.correct++;
            log(t('log.correct'));
        } else {
            state.wrong++;
            if (!pending.mistake) log(t('log.wrong', {mode: 'unknown'}), 'warn');
        }
        emit({
            type: 'answered',
            index: state.answers,
            polish: pending.polish,
            typed: pending.typed,
            valid: validEnglish || null,
            correct,
            mistake: pending.mistake
        });
        state.pending = null;
        persistRun();
        return correct;
    }

    async function advanceNext() {
        const next = await dom.find(SELECTORS.nextWord, 12000, shouldContinue);
        if (next) {
            await clickWithNav(() => dom.click(next), transitionWait());
        } else {
            const fallback = await dom.findByText(TEXT.next, 2000, shouldContinue);
            if (fallback) await clickWithNav(() => dom.click(fallback), transitionWait());
        }
        log(t('log.next'));
        emit({type: 'progress'});
    }

    async function answerOne() {
        const translationEl = await dom.find(SELECTORS.translation, 8000, shouldContinue);
        const usageEl = await dom.find(SELECTORS.usage, 3000, shouldContinue);
        const polish = dom.text(translationEl);
        const sentence = dom.text(usageEl);
        if (!polish) throw new Error(t('error.noAnswer'));

        const index = state.answers + 1;
        emit({type: 'answering', index, polish});
        log(t('log.answering', {index, polish}));

        const englishes = findTranslation(polish);
        const english = chooseEnglish(englishes, word => used.includes(word));
        if (english) used.push(english);
        persistRun();

        let typed = '';
        let mistake = null;
        if (english && shouldAnswerCorrect(config.valid_chance)) {
            typed = english;
        } else if (english) {
            mistake = chooseErrorMode();
            if (mistake === 'wrong-word') {
                typed = pickWrongTranslation(words, english) ?? misspell(english);
            } else if (mistake === 'misspelling') {
                typed = misspell(english);
            }
            log(t('log.wrong', {mode: mistake}), 'warn');
        }

        const answerEl = await dom.find(SELECTORS.answer, 8000, shouldContinue);
        if (!answerEl) throw new Error(t('error.noAnswer'));

        // Think of the translation before typing, like a person would.
        await dom.wait(thinkWait());
        if (!shouldContinue()) return;
        await dom.typeText(answerEl, typed, config.delays, shouldContinue);
        if (!shouldContinue()) return;
        const checkEl = await dom.find(SELECTORS.check, 5000, shouldContinue);
        if (!checkEl) throw new Error(t('error.noStart'));

        // Persist the answer *before* clicking: the site may reload the page and
        // destroy this JavaScript context while the request is in flight.
        state.pending = {polish, typed, valid: english || '', sentence, mistake};
        persistRun();

        dom.click(checkEl);
        await dom.wait(500);

        // Without a reload the result is already here; with a reload the next
        // tick finds it on the fresh document and calls completePending().
        const revealedEl = await dom.find(SELECTORS.correctWord, 2500, shouldContinue);
        if (!revealedEl) return;
        const correct = completePending(dom.text(revealedEl));
        // Read the correction before moving on; correctness changes the pause.
        if (correct !== null) await dom.wait(reviewWait(correct));
        if (!shouldContinue()) return;
        await advanceNext();
    }

    async function isFinished() {
        const body = dom.bodyText();
        if (!FINISHED_PATTERN.test(body)) return false;
        const form = await dom.find(SELECTORS.answer.concat(SELECTORS.newWordForm), 300, shouldContinue);
        return !form;
    }

    function finalize(reason) {
        if (!state.running) return;
        state.running = false;
        clearTimer();
        storage.set(RUN_KEY, null);
        storage.set(NAV_KEY, 0);
        recordStats();
        if (reason === 'stopped') {
            setStatus('stopped');
            log(t('log.stopped'));
        } else if (reason === 'error') {
            setStatus('error');
        } else {
            setStatus('finished');
            log(t('log.finished', {answers: state.answers, correct: state.correct}));
        }
        emit({type: 'finished', reason});
    }

    function fail(error) {
        state.lastError = error?.message ?? String(error);
        log(t('error.generic', {message: state.lastError}), 'error');
        finalize('error');
        emit({type: 'error', message: state.lastError});
    }

    /** Performs exactly one page step and reschedules itself while running. */
    async function tick() {
        if (!state.running || busy) return;
        busy = true;
        try {
            // A page reload kills the in-page navigation timer; pick the pause
            // back up here, before the next word is read or answered.
            await endNavWait();
            if (await dom.find(SELECTORS.loginEmail, 250, shouldContinue)) {
                throw new Error(t('error.noStart'));
            }
            if (await isFinished()) {
                finalize('complete');
                return;
            }

            const answerForm = await dom.find(SELECTORS.answer, 600, shouldContinue);
            const newWordForm = await dom.find(SELECTORS.newWordForm, 300, shouldContinue);

            if (newWordForm) {
                await handleNewWord();
            } else if (answerForm) {
                await answerOne();
            } else {
                let answeredCorrect = null;
                if (state.pending) {
                    const revealedEl = await dom.find(SELECTORS.correctWord, 1500, shouldContinue);
                    answeredCorrect = completePending(dom.text(revealedEl));
                }
                const next = await dom.find(SELECTORS.nextWord, 800, shouldContinue);
                if (next) {
                    if (answeredCorrect !== null) await dom.wait(reviewWait(answeredCorrect));
                    if (!shouldContinue()) return;
                    await clickWithNav(() => dom.click(next), transitionWait());
                } else if (!startAttempted) {
                    startAttempted = true;
                    await startSession();
                }
            }
        } catch (error) {
            fail(error);
        } finally {
            busy = false;
            if (state.running) scheduleTick();
        }
    }

    async function start() {
        if (state.running) return state;
        state.running = true;
        state.answers = 0;
        state.correct = 0;
        state.wrong = 0;
        state.newWords = 0;
        state.lastError = null;
        state.startedAt = Date.now();
        state.pending = null;
        used = [];
        startAttempted = false;
        storage.set(NAV_KEY, 0);
        persistRun();
        setStatus('starting');
        emit({type: 'progress'});
        tick();
        return state;
    }

    /** Called on every page load: continues a run that survived navigation. */
    function resume() {
        if (state.running) {
            tick();
            return true;
        }
        if (!restoreRun()) return false;
        setStatus('running');
        emit({type: 'progress'});
        tick();
        return true;
    }

    async function stop() {
        if (!state.running) {
            setStatus('idle');
            return;
        }
        finalize('stopped');
    }

    function setLanguage(next) {
        lang = String(next ?? '').toLowerCase().startsWith('en') ? 'en' : 'pl';
        emit({type: 'language', language: lang});
        return lang;
    }

    function setConfig(next = {}) {
        config = sanitizeConfig({
            ...config,
            ...next,
            delays: {...config.delays, ...(next.delays ?? {})}
        });
        storage.set(CONFIG_KEY, pickPersistedConfig(config));
        return {...config};
    }

    function getConfig() {
        return {...config};
    }

    function getStats(now = new Date()) {
        const stats = storage.get('stats', {}) ?? {};
        const lastSession = storage.get('lastSession', null);
        const today = stats[todayKey(now)] ?? {answers: 0, correct: 0, wrong: 0, newWords: 0};
        const total = {answers: 0, correct: 0, wrong: 0, newWords: 0};
        for (const day of Object.values(stats)) {
            if (!day || typeof day !== 'object') continue;
            total.answers += day.answers ?? 0;
            total.correct += day.correct ?? 0;
            total.wrong += day.wrong ?? 0;
            total.newWords += day.newWords ?? 0;
        }
        return {
            today: {...today, accuracy: accuracy(today.correct, today.answers)},
            total: {...total, accuracy: accuracy(total.correct, total.answers)},
            session: lastSession
                ? {...lastSession, accuracy: accuracy(lastSession.correct, lastSession.answers)}
                : null,
            periods: {
                week: summarizePeriod(stats, 'week', now),
                month: summarizePeriod(stats, 'month', now),
                year: summarizePeriod(stats, 'year', now),
                all: summarizePeriod(stats, 'all', now)
            },
            savedWords: words.length,
            streak: computeStreak(stats, now)
        };
    }

    return {
        getState: () => ({...state, language: lang}),
        getSavedWords: () => words.slice(),
        getConfig,
        getStats,
        resume,
        setConfig,
        setLanguage,
        start,
        stop
    };
}

module.exports = {
    DEFAULT_CONFIG,
    DELAY_BOUNDS,
    PERIOD_DAYS,
    USER_DELAY_KEYS,
    accuracy,
    computeStreak,
    createEngine,
    createStorageAdapter,
    sanitizeConfig,
    summarizePeriod,
    todayKey
};
