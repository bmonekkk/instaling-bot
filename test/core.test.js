const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildTypingSteps,
    chooseEnglish,
    chooseErrorMode,
    getRandomInt,
    getTypoChar,
    misspell,
    pickWrongTranslation,
    shouldAnswerCorrect
} = require('../src/core/index.js');

function seeded(values) {
    let i = 0;
    return () => values[i++ % values.length];
}

test('getRandomInt stays inside the half-open range', () => {
    assert.equal(getRandomInt(0, 3, () => 0), 0);
    assert.equal(getRandomInt(0, 3, () => 0.999), 2);
    assert.equal(getRandomInt(2, 2, () => 0.5), 2);
});

test('getTypoChar returns a neighbouring key and preserves case', () => {
    assert.equal(getTypoChar('a', () => 0), 'q');
    assert.equal(getTypoChar('A', () => 0), 'Q');
    assert.equal(getTypoChar(' ', () => 0), ' ');
});

test('misspell always changes the word', () => {
    for (let seed = 0; seed < 30; seed++) {
        const word = 'answers';
        const result = misspell(word, seeded([seed / 30, 0.1, 0.9, 0.4]));
        assert.notEqual(result, word);
        assert.ok(result.length > 0);
    }
});

test('buildTypingSteps reproduces the text after typos are corrected', () => {
    const steps = buildTypingSteps('hello world', {
        type_min: 1,
        type_max: 2,
        type_pause_chance: 0,
        type_pause_min: 1,
        type_pause_max: 2,
        typo_chance: 1
    }, seeded([0, 0.5, 0.2, 0.7, 0.1]));

    let value = '';
    for (const step of steps) {
        if (step.op === 'type') value += step.text;
        if (step.op === 'key' && step.key === 'Backspace') value = value.slice(0, -1);
    }
    assert.equal(value, 'hello world');
    assert.ok(steps.some(step => step.op === 'key'), 'expected at least one simulated typo');
});

test('buildTypingSteps adds pauses after spaces', () => {
    const steps = buildTypingSteps('a b', {
        type_min: 1,
        type_max: 1,
        type_pause_chance: 0,
        type_pause_min: 300,
        type_pause_max: 300,
        typo_chance: 0
    }, seeded([0.5, 0.5, 0.5, 0.5]));
    assert.ok(steps.some(step => step.op === 'wait' && step.ms === 300));
});

test('chooseErrorMode covers every strategy', () => {
    assert.equal(chooseErrorMode(() => 0), 'blank');
    assert.equal(chooseErrorMode(() => 0.5), 'wrong-word');
    assert.equal(chooseErrorMode(() => 0.99), 'misspelling');
});

test('pickWrongTranslation skips the correct word and duplicates', () => {
    const words = [
        {english: 'answer'},
        {english: 'Answer'},
        {english: 'question'},
        {english: 'question'},
        {english: 'lesson'}
    ];
    assert.equal(pickWrongTranslation(words, 'answer', () => 0), 'question');
    assert.equal(pickWrongTranslation(words, 'answer', () => 0.99), 'lesson');
    assert.equal(pickWrongTranslation([{english: 'answer'}], 'answer'), null);
});

test('chooseEnglish prefers words that were not typed yet', () => {
    const typed = new Set(['one']);
    assert.equal(chooseEnglish(['one', 'two', 'three'], word => typed.has(word), () => 0), 'two');
    assert.equal(chooseEnglish([], () => false), undefined);
});

test('shouldAnswerCorrect respects the configured chance', () => {
    assert.equal(shouldAnswerCorrect(0.8, () => 0.79), true);
    assert.equal(shouldAnswerCorrect(0.8, () => 0.81), false);
    assert.equal(shouldAnswerCorrect(1, () => 0.99), true);
    assert.equal(shouldAnswerCorrect(0, () => 0), false);
});
