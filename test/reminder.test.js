// Tests for the daily reminder helpers, including repeat intervals and the
// legacy state format that only stored a date.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
    statePath,
    dateKey,
    parseTime,
    repeatMinutes,
    isReminderDue,
    loadState,
    saveState,
    markSessionDone,
    markNotified
} = require('../src/reminder.js');

async function tempRoot(t) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'instaling-reminder-'));
    t.after(() => fs.rm(root, {recursive: true, force: true}));
    return root;
}

test('dateKey formats local dates with zero padding', () => {
    assert.equal(dateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
    assert.equal(dateKey(new Date(2026, 11, 31, 0, 0)), '2026-12-31');
});

test('parseTime accepts only HH:MM in 24-hour form', () => {
    assert.deepEqual(parseTime('17:00'), {hours: 17, minutes: 0, text: '17:00'});
    assert.deepEqual(parseTime(' 07:05 '), {hours: 7, minutes: 5, text: '07:05'});
    assert.equal(parseTime('24:00'), null);
    assert.equal(parseTime('7:05'), null);
    assert.equal(parseTime('17:60'), null);
    assert.equal(parseTime(''), null);
    assert.equal(parseTime(null), null);
});

test('repeatMinutes normalizes and clamps the interval', () => {
    assert.equal(repeatMinutes({repeat_minutes: 0}), 0);
    assert.equal(repeatMinutes({repeat_minutes: -5}), 0);
    assert.equal(repeatMinutes({repeat_minutes: '30'}), 30);
    assert.equal(repeatMinutes({repeat_minutes: 29.6}), 30);
    assert.equal(repeatMinutes({repeat_minutes: 99999}), 1440);
    assert.equal(repeatMinutes({repeat_minutes: 'abc'}), 0);
    assert.equal(repeatMinutes({}), 0);
});

test('isReminderDue respects disabled reminders and invalid times', () => {
    const now = new Date(2026, 0, 15, 18, 0);
    assert.equal(isReminderDue({reminder: {enabled: false}}, {}, now), false);
    assert.equal(isReminderDue({reminder: {time: 'not-a-time'}}, {}, now), false);
});

test('isReminderDue stays quiet before the configured time', () => {
    const now = new Date(2026, 0, 15, 16, 59);
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, {}, now), false);
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, {}, new Date(2026, 0, 15, 17, 0)), true);
});

test('isReminderDue stays quiet after a completed session', () => {
    const now = new Date(2026, 0, 15, 18, 0);
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, {lastSession: '2026-01-15'}, now), false);
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, {lastSession: '2026-01-14'}, now), true);
});

test('isReminderDue fires once per day without repeats', () => {
    const now = new Date(2026, 0, 15, 18, 0);
    const sameDay = {lastNotified: '2026-01-15', lastNotifiedAt: new Date(2026, 0, 15, 17, 30).toISOString()};
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, sameDay, now), false);
    assert.equal(isReminderDue(
        {reminder: {time: '17:00'}},
        {lastNotified: '2026-01-14', lastNotifiedAt: new Date(2026, 0, 14, 17, 0).toISOString()},
        now
    ), true);
});

test('isReminderDue honours the repeat interval', () => {
    const config = {reminder: {time: '17:00', repeat_minutes: 30}};
    const notified = new Date(2026, 0, 15, 17, 10).toISOString();
    assert.equal(isReminderDue(config, {lastNotifiedAt: notified}, new Date(2026, 0, 15, 17, 39)), false);
    assert.equal(isReminderDue(config, {lastNotifiedAt: notified}, new Date(2026, 0, 15, 17, 40)), true);
});

test('isReminderDue supports the legacy date-only state', () => {
    const now = new Date(2026, 0, 15, 18, 0);
    assert.equal(isReminderDue({reminder: {time: '17:00'}}, {lastNotified: '2026-01-15'}, now), false);
    assert.equal(isReminderDue({reminder: {time: '17:00', repeat_minutes: 30}}, {lastNotified: '2026-01-15'}, now), false);
});

test('state helpers round-trip and reject malformed JSON objects', async t => {
    const root = await tempRoot(t);
    assert.deepEqual(await loadState(root), {});

    const now = new Date(2026, 0, 15, 18, 30);
    await markSessionDone(now, root);
    await markNotified(now, root);

    const state = await loadState(root);
    assert.equal(state.lastSession, '2026-01-15');
    assert.equal(state.lastNotified, '2026-01-15');
    assert.equal(state.lastNotifiedAt, now.toISOString());
    assert.equal(statePath(root), path.join(root, 'reminder-state.json'));

    await fs.writeFile(statePath(root), '[]', 'utf8');
    assert.deepEqual(await loadState(root), {});
});

test('loadState tolerates a BOM and invalid JSON throws', async t => {
    const root = await tempRoot(t);
    await fs.writeFile(statePath(root), '\uFEFF{"lastSession":"2026-01-15"}', 'utf8');
    assert.deepEqual(await loadState(root), {lastSession: '2026-01-15'});

    await fs.writeFile(statePath(root), '{not json', 'utf8');
    await assert.rejects(loadState(root), SyntaxError);
});

test('saveState creates the root directory', async t => {
    const root = path.join(await tempRoot(t), 'nested', 'data');
    await saveState({lastSession: '2026-01-15'}, root);
    assert.deepEqual(await loadState(root), {lastSession: '2026-01-15'});
});
