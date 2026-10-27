const test = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');

const {createEngine} = require('../mobile/engine/engine.js');

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
        next_word_min: 1,
        next_word_max: 2
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
