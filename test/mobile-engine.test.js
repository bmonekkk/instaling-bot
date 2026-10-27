const test = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');

const {
    accuracy,
    computeStreak,
    createEngine,
    sanitizeConfig
} = require('../mobile/engine/engine.js');
const {STRINGS} = require('../mobile/engine/i18n.js');

function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        get(key, fallback) {
            return data.has(key) ? data.get(key) : fallback;
        },
        set(key, value) {
            data.set(key, value);
        },
        dump() {
            return Object.fromEntries(data);
        }
    };
}

async function waitForStatus(engine, statuses, timeout = 8000) {
    const expected = Array.isArray(statuses) ? statuses : [statuses];
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const state = engine.getState();
        if (expected.includes(state.status)) return state;
        await new Promise(resolve => setTimeout(resolve, 25));
    }
    return engine.getState();
}

function setupDom() {
    const dom = new JSDOM(`<!doctype html><html><body>
        <div id="question">
            <div class="usage_example">I have a house.</div>
            <div class="translations">dom</div>
        </div>
        <input id="answer" type="text">
        <button id="check">Sprawdź</button>
        <button id="next_word" hidden>Dalej</button>
        <div id="word" hidden></div>
    </body></html>`, {url: 'https://instaling.pl/learning'});

    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.Event = dom.window.Event;
    globalThis.KeyboardEvent = dom.window.KeyboardEvent;
    globalThis.MouseEvent = dom.window.MouseEvent;
    globalThis.PointerEvent = dom.window.PointerEvent ?? dom.window.MouseEvent;
    globalThis.HTMLInputElement = dom.window.HTMLInputElement;
    globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

    // jsdom has no layout engine, so every element reports zero client rects.
    dom.window.Element.prototype.getClientRects = function getClientRects() {
        return [{width: 100, height: 20}];
    };
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};

    const check = dom.window.document.querySelector('#check');
    const next = dom.window.document.querySelector('#next_word');
    check.addEventListener('click', () => {
        dom.window.document.querySelector('#word').textContent = 'house';
        dom.window.document.querySelector('#word').hidden = false;
        next.hidden = false;
    });
    next.addEventListener('click', () => {
        dom.window.document.querySelector('#question').remove();
        dom.window.document.querySelector('#answer').remove();
        dom.window.document.querySelector('#check').remove();
        dom.window.document.querySelector('#next_word').remove();
        dom.window.document.body.append('Koniec sesji. Gratulacje!');
    });

    return dom;
}

const fastConfig = {
    valid_chance: 1,
    delays: {
        click_min: 1,
        click_max: 2,
        type_min: 1,
        type_max: 2,
        type_pause_chance: 0,
        type_pause_min: 1,
        type_pause_max: 2,
        typo_chance: 0,
        check_min: 1,
        check_max: 2,
        nav_min: 1,
        nav_max: 2
    }
};

test('mobile engine answers a word, saves it and stops at the end', async () => {
    const dom = setupDom();
    const storage = memoryStorage({
        savedWords: [{polish: 'dom', english: 'house', sentence: 'I have a house.'}]
    });
    const events = [];
    const engine = createEngine({
        storage,
        config: fastConfig,
        language: 'pl',
        onEvent: event => events.push(event)
    });

    await engine.start();
    const state = await waitForStatus(engine, 'finished');

    assert.equal(state.answers, 1);
    assert.equal(state.correct, 1);
    assert.equal(state.wrong, 0);
    assert.equal(state.status, 'finished', state.lastError);
    assert.equal(state.savedWords, 1);
    assert.ok(events.some(event => event.type === 'answered' && event.correct));
    assert.ok(events.some(event => event.type === 'finished'));

    const lastSession = storage.get('lastSession', null);
    assert.equal(lastSession.answers, 1);
    assert.equal(lastSession.correct, 1);
    dom.window.close();
});

test('mobile engine records a deliberate mistake and still saves the word', async () => {
    const dom = setupDom();
    const storage = memoryStorage({
        savedWords: [
            {polish: 'dom', english: 'house', sentence: ''},
            {polish: 'kot', english: 'cat', sentence: ''}
        ]
    });
    const engine = createEngine({
        storage,
        language: 'en',
        config: {...fastConfig, valid_chance: 0},
        onEvent: () => {}
    });

    await engine.start();
    const state = await waitForStatus(engine, 'finished');
    assert.equal(state.answers, 1);
    assert.equal(state.correct, 0);
    assert.equal(state.wrong, 1);
    assert.equal(state.status, 'finished', state.lastError);
    dom.window.close();
});

test('mobile engine reports an error when the answer field is missing', async () => {
    const dom = new JSDOM('<!doctype html><html><body><form><input id="log_email" name="log_email"><input id="log_password" name="log_password"></form></body></html>', {
        url: 'https://instaling.pl/teacher.php?page=login'
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.Event = dom.window.Event;
    globalThis.KeyboardEvent = dom.window.KeyboardEvent;
    globalThis.MouseEvent = dom.window.MouseEvent;
    globalThis.PointerEvent = dom.window.MouseEvent;
    globalThis.HTMLInputElement = dom.window.HTMLInputElement;
    globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
    dom.window.Element.prototype.getClientRects = () => [{width: 100, height: 20}];

    const engine = createEngine({
        storage: memoryStorage(),
        config: fastConfig,
        language: 'en',
        onEvent: () => {}
    });
    await engine.start();
    const failed = await waitForStatus(engine, 'error');
    assert.equal(failed.status, 'error');
    assert.match(failed.lastError, /session start button|answer field/i);
    dom.window.close();
});


test('mobile engine resumes a persisted run after a page reload', async () => {
    const dom = setupDom();
    const storage = memoryStorage({
        savedWords: [{polish: 'dom', english: 'house', sentence: ''}],
        run: {running: true, answers: 0, correct: 0, wrong: 0, newWords: 0, startedAt: Date.now(), used: []}
    });
    const engine = createEngine({storage, config: fastConfig, language: 'pl', onEvent: () => {}});

    assert.equal(engine.resume(), true);
    const state = await waitForStatus(engine, 'finished');
    assert.equal(state.answers, 1);
    assert.equal(state.correct, 1);
    assert.equal(storage.get('run', null), null);
    dom.window.close();
});

test('mobile engine finishes a pending answer on the result page after navigation', async () => {
    // Simulates the real site reload: the check click destroyed the old document,
    // and only the persisted run survives into the result page.
    const dom = new JSDOM(`<!doctype html><html><body>
        <div id="word">house</div>
        <button id="next_word">Dalej</button>
    </body></html>`, {url: 'https://instaling.pl/learning'});

    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.Event = dom.window.Event;
    globalThis.KeyboardEvent = dom.window.KeyboardEvent;
    globalThis.MouseEvent = dom.window.MouseEvent;
    globalThis.PointerEvent = dom.window.MouseEvent;
    globalThis.HTMLInputElement = dom.window.HTMLInputElement;
    globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
    dom.window.Element.prototype.getClientRects = () => [{width: 100, height: 20}];
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};

    dom.window.document.querySelector('#next_word').addEventListener('click', () => {
        dom.window.document.body.innerHTML = '<p>Koniec sesji. Gratulacje!</p>';
    });

    const storage = memoryStorage({
        savedWords: [],
        run: {
            running: true,
            answers: 0,
            correct: 0,
            wrong: 0,
            newWords: 0,
            startedAt: Date.now(),
            used: ['house'],
            pending: {polish: 'dom', typed: 'house', valid: 'house', sentence: '', mistake: null}
        }
    });
    const events = [];
    const engine = createEngine({
        storage,
        config: fastConfig,
        language: 'pl',
        onEvent: event => events.push(event)
    });

    assert.equal(engine.resume(), true);
    const state = await waitForStatus(engine, 'finished');
    assert.equal(state.answers, 1, state.lastError);
    assert.equal(state.correct, 1);
    assert.equal(engine.getSavedWords().length, 1);
    assert.ok(events.some(event => event.type === 'answered' && event.valid === 'house'));
    dom.window.close();
});

test('mobile i18n keeps PL and EN in sync', () => {
    const pl = Object.keys(STRINGS.pl).sort();
    const en = Object.keys(STRINGS.en).sort();
    assert.deepEqual(en, pl);
    const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)]
        .map(match => match[1]).sort();
    for (const key of pl) {
        assert.deepEqual(placeholders(STRINGS.en[key]), placeholders(STRINGS.pl[key]), key);
    }
});

test('sanitizeConfig clamps accuracy and the humanization delays', () => {
    assert.deepEqual(sanitizeConfig({valid_chance: 2}), {valid_chance: 1});
    assert.deepEqual(sanitizeConfig({valid_chance: -1}), {valid_chance: 0});
    assert.deepEqual(sanitizeConfig({valid_chance: 'x'}), {valid_chance: 0.8});
    assert.deepEqual(
        sanitizeConfig({delays: {click_min: -5, typo_chance: 5}}),
        {delays: {click_min: 0, typo_chance: 1}}
    );
    assert.deepEqual(sanitizeConfig({delays: {type_max: 'x'}}), {delays: {}});
    // Internal timings the shells do not expose are passed through untouched.
    assert.deepEqual(sanitizeConfig({delays: {check_min: 3000}}), {delays: {check_min: 3000}});
});

test('setConfig persists the user-facing settings', () => {
    const storage = memoryStorage();
    const engine = createEngine({storage, language: 'pl', onEvent: () => {}});

    engine.setConfig({valid_chance: 0.5, delays: {click_min: 1, click_max: 3, typo_chance: 0.2}});

    assert.deepEqual(storage.get('config', null), {
        valid_chance: 0.5,
        delays: {
            click_min: 1,
            click_max: 3,
            nav_min: 2000,
            nav_max: 4500,
            type_min: 90,
            type_max: 230,
            type_pause_chance: 0.12,
            typo_chance: 0.2
        }
    });
    assert.equal(engine.getConfig().delays.click_min, 1);
});

test('a new engine restores persisted settings and the shell can override them', () => {
    const storage = memoryStorage({config: {valid_chance: 0.25, delays: {click_min: 500}}});
    const restored = createEngine({storage, language: 'pl', onEvent: () => {}});
    assert.equal(restored.getConfig().valid_chance, 0.25);
    assert.equal(restored.getConfig().delays.click_min, 500);

    const overridden = createEngine({
        storage,
        config: {valid_chance: 0.9, delays: {click_min: 2000}},
        language: 'pl',
        onEvent: () => {}
    });
    assert.equal(overridden.getConfig().valid_chance, 0.9);
    assert.equal(overridden.getConfig().delays.click_min, 2000);
});

test('accuracy and streak helpers ignore empty days', () => {
    assert.equal(accuracy(0, 0), 0);
    assert.equal(accuracy(8, 10), 80);
    assert.equal(accuracy(2, 3), 67);

    const now = new Date('2026-10-27T12:00:00');
    const stats = {
        '2026-10-27': {answers: 2},
        '2026-10-26': {answers: 1},
        '2026-10-25': {newWords: 1},
        '2026-10-23': {answers: 5}
    };
    assert.equal(computeStreak(stats, now), 3);
    // An empty "today" does not break a streak that ended yesterday.
    assert.equal(computeStreak({'2026-10-26': {answers: 1}}, now), 1);
    assert.equal(computeStreak({}, now), 0);
});

test('getStats aggregates days and exposes today, total, session and streak', () => {
    const now = new Date('2026-10-27T12:00:00');
    const storage = memoryStorage({
        savedWords: [{polish: 'dom', english: 'house', sentence: ''}],
        stats: {
            '2026-10-27': {answers: 4, correct: 3, wrong: 1, newWords: 0},
            '2026-10-26': {answers: 6, correct: 6, wrong: 0, newWords: 2}
        },
        lastSession: {answers: 4, correct: 3, wrong: 1, newWords: 0}
    });
    const engine = createEngine({storage, language: 'pl', onEvent: () => {}});
    const stats = engine.getStats(now);

    assert.equal(stats.today.answers, 4);
    assert.equal(stats.today.accuracy, 75);
    assert.equal(stats.total.answers, 10);
    assert.equal(stats.total.correct, 9);
    assert.equal(stats.total.accuracy, 90);
    assert.equal(stats.total.newWords, 2);
    assert.equal(stats.session.accuracy, 75);
    assert.equal(stats.savedWords, 1);
    assert.equal(stats.streak, 2);

    // Period summaries mirror the desktop panel (week/month/year/all).
    assert.equal(stats.periods.week.answers, 10);
    assert.equal(stats.periods.all.answers, 10);
    assert.equal(stats.periods.all.activeDays, 2);
    assert.equal(stats.periods.all.percent, 90);
});
