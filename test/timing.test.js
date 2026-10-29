const test = require('node:test');
const assert = require('node:assert/strict');

const {humanDelay, distractionPause} = require('../src/core/timing.js');

test('humanDelay stays inside the inclusive range', () => {
    const random = () => 0.999999;
    assert.ok(humanDelay(100, 200, random) <= 200);
    assert.ok(humanDelay(100, 200, () => 0) >= 100);
    assert.equal(humanDelay(500, 500), 500);
});

test('humanDelay swaps a reversed range instead of returning garbage', () => {
    const value = humanDelay(400, 100, () => 0.5);
    assert.ok(value >= 100 && value <= 400, String(value));
});

test('humanDelay is right-skewed, not uniform', () => {
    // A deterministic sweep of 1000 samples must average below the midpoint,
    // because the mode sits at 35% of the range.
    let sum = 0;
    let index = 0;
    const random = () => (index++ % 1000) / 1000;
    for (let i = 0; i < 1000; i++) sum += humanDelay(1000, 6000, random);
    const mean = sum / 1000;
    const midpoint = 3500;
    assert.ok(mean < midpoint, `mean ${mean} should be below ${midpoint}`);
});

test('humanDelay handles bad input without throwing', () => {
    assert.equal(humanDelay(NaN, 100), 0);
    assert.equal(humanDelay(0, Infinity), 0);
});

test('distractionPause is off by default', () => {
    assert.equal(distractionPause(0, 100, 200, () => 0), 0);
    assert.equal(distractionPause(-1, 100, 200, () => 0), 0);
});

test('distractionPause fires with the configured chance', () => {
    const hit = distractionPause(1, 5000, 9000, () => 0.5);
    assert.ok(hit >= 5000 && hit <= 9000, String(hit));

    const miss = distractionPause(0.5, 5000, 9000, () => 0.9);
    assert.equal(miss, 0);
});