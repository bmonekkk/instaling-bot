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
        check_min: 3000,
        check_max: 5500,
        next_word_min: 2000,
        next_word_max: 4500
    }
};

const FINISHED_PATTERN = /koniec|zakończ|gratulacje|wyniki|podsumowanie|nie ma już|finished|completed|results/i;
const RUN_KEY = 'run';
const CONFIG_KEY = 'config';
// Only user-facing settings are persisted; the timing/delay block stays internal.
const PERSISTED_CONFIG_KEYS = ['valid_chance', 'max_answers'];

function pickPersistedConfig(value = {}) {
    const out = {};
    for (const key of PERSISTED_CONFIG_KEYS) {
        if (value?.[key] !== undefined) out[key] = value[key];
    }
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
    if (out.max_answers !== undefined) {
        const limit = Number.parseInt(out.max_answers, 10);
        out.max_answers = Number.isFinite(limit) && limit > 0 ? limit : 0;
    }
    return out;
}

function accuracy(correct, answers) {
    return answers > 0 ? Math.round((correct / answers) * 100) : 0;
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
    version = '4.1.0'
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

    let config = {
        ...DEFAULT_CONFIG,
        ...sanitizeConfig(storage.get(CONFIG_KEY, {}) ?? {}),
        ...sanitizeConfig(initialConfig),
        delays: {...DEFAULT_CONFIG.delays, ...(initialConfig.delays ?? {})}
    };
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
        const day = stats[key] ?? {answers: 0, correct: 0, wrong: 0, newWords: 0};
        day.answers += state.answers;
        day.correct += state.correct;
        day.wrong += state.wrong;
        day.newWords += state.newWords;
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

    async function clickFirst(selectors, timeout = 4000) {
        const element = await dom.find(selectors, timeout, shouldContinue);
        if (!element) return false;
        dom.click(element);
        return true;
    }

    async function startSession() {
        log(t('log.starting'));
        if (await clickFirst(SELECTORS.startSession, 3000)) {
            await dom.wait(randomBetween(1500, 2500));
        }
        let continued = await clickFirst(SELECTORS.continueSession, 5000);
        if (!continued) continued = await clickFirst(SELECTORS.newSession, 4000);
        if (!continued) {
            const continueText = await dom.findByText(TEXT.continue, 2000, shouldContinue);
            if (continueText) {
                dom.click(continueText);
                continued = true;
            }
        }
        if (!continued) {
            const startText = await dom.findByText(TEXT.start, 2500, shouldContinue);
            if (startText) {
                dom.click(startText);
                await dom.wait(randomBetween(1500, 2500));
                await clickFirst(SELECTORS.newSession, 4000);
            }
        }
        await dom.wait(randomBetween(config.delays.click_min, config.delays.click_max));
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
        const advanced = await clickFirst(SELECTORS.nextWord, 10000);
        if (!advanced) {
            const next = await dom.findByText(TEXT.next, 2500, shouldContinue);
            if (next) dom.click(next);
        }
        await dom.wait(randomBetween(config.delays.next_word_min, config.delays.next_word_max));
        emit({type: 'progress'});
    }

    /**
     * Records the answer that was typed before a navigation. instaling.pl reloads
     * on "check", so the result page finishes the bookkeeping started there.
     */
    function completePending(revealed) {
        const pending = state.pending;
        if (!pending) return false;
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
        return true;
    }

    async function advanceNext() {
        const next = await dom.find(SELECTORS.nextWord, 12000, shouldContinue);
        if (next) {
            dom.click(next);
        } else {
            const fallback = await dom.findByText(TEXT.next, 2000, shouldContinue);
            if (fallback) dom.click(fallback);
        }
        await dom.wait(randomBetween(config.delays.next_word_min, config.delays.next_word_max));
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
        completePending(dom.text(revealedEl));
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
            if (await dom.find(SELECTORS.loginEmail, 250, shouldContinue)) {
                throw new Error(t('error.noStart'));
            }
            if (await isFinished()) {
                finalize('complete');
                return;
            }

            if (config.max_answers > 0 && state.answers >= config.max_answers) {
                log(t('log.limitReached', {limit: config.max_answers}), 'warn');
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
                if (state.pending) {
                    const revealedEl = await dom.find(SELECTORS.correctWord, 1500, shouldContinue);
                    completePending(dom.text(revealedEl));
                }
                const next = await dom.find(SELECTORS.nextWord, 800, shouldContinue);
                if (next) {
                    dom.click(next);
                    await dom.wait(randomBetween(config.delays.next_word_min, config.delays.next_word_max));
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
        config = {
            ...config,
            ...sanitizeConfig(next),
            delays: {...config.delays, ...(next.delays ?? {})}
        };
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
    accuracy,
    computeStreak,
    createEngine,
    createStorageAdapter,
    sanitizeConfig,
    todayKey
};
