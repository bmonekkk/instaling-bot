// Guards the PL/EN dictionaries: both languages must stay in sync.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {MESSAGES, normalizeLanguage, t} = require('../desktop/renderer/i18n.js');

test('both languages expose the same keys', () => {
    const pl = Object.keys(MESSAGES.pl).sort();
    const en = Object.keys(MESSAGES.en).sort();
    assert.deepEqual(en, pl);
});

test('placeholders match between languages', () => {
    const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    for (const key of Object.keys(MESSAGES.pl)) {
        assert.deepEqual(placeholders(MESSAGES.en[key]), placeholders(MESSAGES.pl[key]), key);
    }
});

test('normalizes the language and falls back to Polish', () => {
    assert.equal(normalizeLanguage('en'), 'en');
    assert.equal(normalizeLanguage('en-US'), 'en');
    assert.equal(normalizeLanguage('EN'), 'en');
    assert.equal(normalizeLanguage('pl'), 'pl');
    assert.equal(normalizeLanguage('de'), 'pl');
    assert.equal(normalizeLanguage(undefined), 'pl');
});

test('interpolates variables and leaves unknown keys visible', () => {
    assert.equal(t('pl', 'notify.finished', {answers: 10, correct: 8}), 'Sesja zakończona. Odpowiedzi: 10, poprawne: 8.');
    assert.equal(t('en', 'notify.finished', {answers: 10, correct: 8}), 'Session finished. Answers: 10, correct: 8.');
    assert.equal(t('en', 'phase.runningWord', {word: 'kot'}), 'Solving words — kot...');
    assert.equal(t('en', 'missing.key'), 'missing.key');
    assert.equal(t('en', 'stats.noteRange', {from: 'a', to: 'b'}), 'From a to b · on average {avgAnswers} answers and {avgMinutes} min per session.');
});

test('every key used by the interface exists in both languages', () => {
    const html = fs.readFileSync(
        path.join(__dirname, '..', 'desktop', 'renderer', 'index.html'),
        'utf8'
    );
    const keys = [...html.matchAll(/data-i18n(?:-html|-title|-placeholder|-aria-label)?="([^"]+)"/g)]
        .map(match => match[1]);
    assert.ok(keys.length > 50);
    for (const key of keys) {
        assert.ok(MESSAGES.pl[key], `missing PL translation: ${key}`);
        assert.ok(MESSAGES.en[key], `missing EN translation: ${key}`);
    }
});
