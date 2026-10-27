// Tests for the shared statistics module. They use a temporary root so the
// real stats.json and the user's data are never touched.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
    statsPath,
    emptyStats,
    loadStats,
    saveStats,
    recordSession,
    cutoffKey,
    summarize,
    summarizeAll
} = require('../src/stats.js');

async function tempRoot(t) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'instaling-stats-'));
    t.after(() => fs.rm(root, {recursive: true, force: true}));
    return root;
}

test('loadStats returns empty stats when the file is missing', async t => {
    const root = await tempRoot(t);
    assert.deepEqual(await loadStats(root), emptyStats());
});

test('loadStats drops invalid keys and normalizes values', async t => {
    const root = await tempRoot(t);
    await saveStats({
        version: 1,
        days: {
            '2026-01-15': {sessions: 2, answers: '10', correct: 8, wrong: 2, newWords: 3, durationMs: 60000},
            'not-a-date': {sessions: 5},
            '2026-1-5': {sessions: 5},
            '2026-01-16': {sessions: -1, answers: 'x'}
        }
    }, root);

    const stats = await loadStats(root);
    assert.deepEqual(Object.keys(stats.days), ['2026-01-15', '2026-01-16']);
    assert.deepEqual(stats.days['2026-01-15'], {
        sessions: 2, answers: 10, correct: 8, wrong: 2, newWords: 3, durationMs: 60000
    });
    assert.deepEqual(stats.days['2026-01-16'], {
        sessions: 0, answers: 0, correct: 0, wrong: 0, newWords: 0, durationMs: 0
    });
});

test('recordSession ignores runs without answers', async t => {
    const root = await tempRoot(t);
    await recordSession({answers: 0, correct: 0}, root);
    assert.deepEqual(await loadStats(root), emptyStats());
    await assert.rejects(fs.access(statsPath(root)));
});

test('recordSession accumulates multiple runs on the same day', async t => {
    const root = await tempRoot(t);
    await recordSession({date: '2026-01-15', answers: 10, correct: 8, wrong: 2, newWords: 3, durationMs: 60000}, root);
    const stats = await recordSession({date: '2026-01-15', answers: 5, correct: 4, wrong: 1, newWords: 1, durationMs: 30000}, root);

    assert.deepEqual(stats.days['2026-01-15'], {
        sessions: 2, answers: 15, correct: 12, wrong: 3, newWords: 4, durationMs: 90000
    });
});

test('recordSession does not let correct/wrong exceed the answer count', async t => {
    const root = await tempRoot(t);
    const stats = await recordSession({date: '2026-01-15', answers: 4, correct: 99, wrong: 99}, root);
    assert.equal(stats.days['2026-01-15'].correct, 4);
    assert.equal(stats.days['2026-01-15'].wrong, 4);
});

test('cutoffKey computes an inclusive window', () => {
    const now = new Date(2026, 0, 15, 12, 0);
    assert.equal(cutoffKey('week', now), '2026-01-09');
    assert.equal(cutoffKey('month', now), '2025-12-17');
    assert.equal(cutoffKey('year', now), '2025-01-16');
    assert.equal(cutoffKey('all', now), null);
    assert.equal(cutoffKey('nonsense', now), null);
});

test('summarize filters by period and computes derived values', () => {
    const stats = {
        version: 1,
        days: {
            '2025-12-01': {sessions: 1, answers: 100, correct: 100, wrong: 0, newWords: 0, durationMs: 0},
            '2026-01-10': {sessions: 1, answers: 10, correct: 8, wrong: 2, newWords: 2, durationMs: 60000},
            '2026-01-14': {sessions: 2, answers: 30, correct: 21, wrong: 9, newWords: 4, durationMs: 240000}
        }
    };
    const now = new Date(2026, 0, 15, 12, 0);

    const week = summarize(stats, {period: 'week', now});
    assert.equal(week.from, '2026-01-09');
    assert.equal(week.to, '2026-01-15');
    assert.equal(week.sessions, 3);
    assert.equal(week.answers, 40);
    assert.equal(week.correct, 29);
    assert.equal(week.wrong, 11);
    assert.equal(week.activeDays, 2);
    assert.equal(week.percent, 72.5);
    assert.equal(week.averageAnswers, 13);
    assert.equal(week.averageMinutes, 1.7);

    const all = summarize(stats, {period: 'all', now});
    assert.equal(all.from, '2025-12-01');
    assert.equal(all.answers, 140);
    assert.equal(all.activeDays, 3);

    const empty = summarize({version: 1, days: {}}, {period: 'week', now});
    assert.equal(empty.percent, 0);
    assert.equal(empty.averageAnswers, 0);
    assert.equal(empty.averageMinutes, 0);
});

test('summarize falls back to week for an unknown period', () => {
    const summary = summarize({version: 1, days: {}}, {period: 'decade', now: new Date(2026, 0, 15)});
    assert.equal(summary.period, 'decade');
    assert.equal(summary.days, 7);
});

test('summarizeAll returns every period', () => {
    const result = summarizeAll({version: 1, days: {}}, new Date(2026, 0, 15));
    assert.deepEqual(Object.keys(result.periods), ['week', 'month', 'year', 'all']);
    assert.ok(result.updatedAt);
});
