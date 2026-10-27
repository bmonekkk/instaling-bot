// Session statistics shared by the desktop app and the CLI.
//
// The stats file lives next to the rest of the runtime data:
//   - desktop: app.getPath('userData') via INSTALING_ROOT
//   - CLI:     the project directory (INSTALING_ROOT is honoured)
//
// Every finished run with at least one answer adds one entry to the current
// day. Summaries are derived on demand, so the file stays small and readable.

const fs = require('fs/promises');
const path = require('path');
const {dateKey} = require('./reminder.js');

const ROOT = process.env.INSTALING_ROOT
    ? path.resolve(process.env.INSTALING_ROOT)
    : path.resolve(__dirname, '..');

const STATS_FILE = 'stats.json';
const PERIODS = {
    week: 7,
    month: 30,
    year: 365,
    all: null
};

function statsPath(root = ROOT) {
    return path.join(root, STATS_FILE);
}

function emptyStats() {
    return {version: 1, days: {}};
}

function asCount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function normalizeDay(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        sessions: asCount(source.sessions),
        answers: asCount(source.answers),
        correct: asCount(source.correct),
        wrong: asCount(source.wrong),
        newWords: asCount(source.newWords),
        durationMs: asCount(source.durationMs)
    };
}

async function loadStats(root = ROOT) {
    try {
        const raw = await fs.readFile(statsPath(root), 'utf8');
        const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
        const days = parsed?.days && typeof parsed.days === 'object' ? parsed.days : {};
        const normalized = {};
        for (const [key, value] of Object.entries(days)) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(key)) normalized[key] = normalizeDay(value);
        }
        return {version: 1, days: normalized};
    } catch (error) {
        if (error.code === 'ENOENT') return emptyStats();
        throw error;
    }
}

async function saveStats(stats, root = ROOT) {
    await fs.mkdir(root, {recursive: true});
    await fs.writeFile(statsPath(root), JSON.stringify(stats, null, 4) + '\n', 'utf8');
    return stats;
}

/**
 * Adds one finished run to today's bucket. Runs without answers are ignored so
 * that failed launches do not inflate the session count.
 */
async function recordSession(entry = {}, root = ROOT) {
    const answers = asCount(entry.answers);
    if (answers === 0) return loadStats(root);

    const stats = await loadStats(root);
    const key = entry.date ? String(entry.date) : dateKey(entry.now instanceof Date ? entry.now : new Date());
    const day = normalizeDay(stats.days[key]);

    day.sessions += 1;
    day.answers += answers;
    day.correct += Math.min(answers, asCount(entry.correct));
    day.wrong += Math.min(answers, asCount(entry.wrong));
    day.newWords += asCount(entry.newWords);
    day.durationMs += asCount(entry.durationMs);

    stats.days[key] = day;
    await saveStats(stats, root);
    return stats;
}

function cutoffKey(period, now = new Date()) {
    const days = PERIODS[period];
    if (!days) return null;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
    return dateKey(start);
}

function summarize(stats, {period = 'week', now = new Date()} = {}) {
    const bucketDays = Object.prototype.hasOwnProperty.call(PERIODS, period)
        ? PERIODS[period]
        : PERIODS.week;
    const from = cutoffKey(period, now);
    const to = dateKey(now);

    const summary = {
        period,
        days: bucketDays,
        from: from ?? Object.keys(stats?.days ?? {}).sort()[0] ?? to,
        to,
        sessions: 0,
        answers: 0,
        correct: 0,
        wrong: 0,
        newWords: 0,
        durationMs: 0,
        activeDays: 0
    };

    for (const [key, raw] of Object.entries(stats?.days ?? {})) {
        if (from && key < from) continue;
        const day = normalizeDay(raw);
        summary.sessions += day.sessions;
        summary.answers += day.answers;
        summary.correct += day.correct;
        summary.wrong += day.wrong;
        summary.newWords += day.newWords;
        summary.durationMs += day.durationMs;
        if (day.sessions > 0) summary.activeDays += 1;
    }

    summary.percent = summary.answers > 0
        ? Math.round((summary.correct / summary.answers) * 1000) / 10
        : 0;
    summary.averageAnswers = summary.sessions > 0
        ? Math.round(summary.answers / summary.sessions)
        : 0;
    summary.averageMinutes = summary.sessions > 0
        ? Math.round((summary.durationMs / summary.sessions / 60000) * 10) / 10
        : 0;

    return summary;
}

function summarizeAll(stats, now = new Date()) {
    const periods = {};
    for (const period of Object.keys(PERIODS)) {
        periods[period] = summarize(stats, {period, now});
    }
    return {
        updatedAt: new Date().toISOString(),
        periods
    };
}

module.exports = {
    ROOT,
    STATS_FILE,
    PERIODS,
    statsPath,
    emptyStats,
    loadStats,
    saveStats,
    recordSession,
    cutoffKey,
    summarize,
    summarizeAll
};
