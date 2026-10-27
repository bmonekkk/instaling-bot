#!/usr/bin/env node
// Command-line entry point for instaling-bot.
//
// Usage:
//   instaling-bot                 start a session (default command)
//   instaling-bot start           start a session, update check first
//   instaling-bot stats           weekly, monthly, yearly and all-time stats
//   instaling-bot remind          keep sending the daily reminder
//   instaling-bot update-check    compare with the latest GitHub release
//   instaling-bot help            this help
//   instaling-bot version         print the installed version

const {version} = require('../package.json');
const {checkLatestRelease} = require('../src/update.js');
const {loadStats, summarize, PERIODS} = require('../src/stats.js');

const PERIOD_LABELS = {
    week: 'Ostatnie 7 dni',
    month: 'Ostatnie 30 dni',
    year: 'Ostatnie 365 dni',
    all: 'Łącznie'
};

const HELP = `
instaling-bot ${version} — bot do rozwiązywania słówek na instaling.pl

Użycie:
  instaling-bot [komenda] [opcje]

Komendy:
  start             Uruchom sesję (domyślnie). Najpierw sprawdza aktualizacje.
  stats             Statystyki: tydzień, miesiąc, rok i cały okres.
  remind            Przypomnienie o codziennej sesji (działa w tle, Ctrl+C kończy).
  update-check      Sprawdź, czy jest nowsze wydanie na GitHubie.
  version           Pokaż zainstalowaną wersję.
  help              Pokaż tę pomoc.

Opcje startu:
  --skip-update-check        Nie sprawdzaj aktualizacji przed startem.
  --no-update-check          To samo co --skip-update-check.
  (zmienna środowiskowa INSTALING_SKIP_UPDATE_CHECK=1 też pomija sprawdzanie)

Opcje statystyk:
  --period week|month|year|all   Tylko wybrany okres (domyślnie wszystkie).
  --json                         Wynik w formacie JSON.

Przykłady:
  npx instaling-bot start
  npx instaling-bot stats --period month
  npm run remind

Pierwsze uruchomienie: skopiuj config/Config.defaults.json do config/Config.json
i wpisz login oraz hasło. Więcej: README.md (sekcja CLI).
`.trim();

function fail(message) {
    console.error(`Błąd: ${message}`);
    process.exitCode = 1;
}

function wantsHelp(args) {
    return args.includes('--help') || args.includes('-h');
}

function parseOptions(args) {
    const options = {period: null, json: false, skipUpdateCheck: false, rest: []};
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === '--skip-update-check' || arg === '--no-update-check') {
            options.skipUpdateCheck = true;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg === '--period' || arg === '-p') {
            options.period = args[++index] ?? null;
        } else if (arg.startsWith('--period=')) {
            options.period = arg.slice('--period='.length);
        } else {
            options.rest.push(arg);
        }
    }
    return options;
}

async function checkForUpdates({blocking = false, skip = false} = {}) {
    if (skip || process.env.INSTALING_SKIP_UPDATE_CHECK === '1') {
        if (blocking) console.log('[UPDATE] Pomijam sprawdzanie aktualizacji.');
        return null;
    }

    console.log('[UPDATE] Sprawdzanie najnowszej wersji...');
    let result;
    try {
        result = await checkLatestRelease(version);
    } catch (error) {
        console.warn(`[UPDATE] Nie udało się sprawdzić aktualizacji (${error.message}).`);
        if (blocking) console.warn('[UPDATE] Kontynuuję z zainstalowaną wersją.');
        return null;
    }

    if (!result.available) {
        console.log(`[UPDATE] Wersja ${version} jest aktualna.`);
        return result;
    }

    console.error('');
    console.error(`[UPDATE] Dostępna jest nowsza wersja ${result.latest} (masz ${version}).`);
    console.error(`[UPDATE] Pobierz: ${result.url}`);
    console.error('[UPDATE] Zaktualizuj bota przed uruchomieniem sesji.');
    console.error('[UPDATE] Pełna aktualizacja CLI: git pull && npm install --omit=dev');
    console.error('');
    console.error('Aby uruchomić mimo to: instaling-bot start --skip-update-check');

    if (blocking) process.exit(1);
    return result;
}

async function runStart(args) {
    const options = parseOptions(args);
    await checkForUpdates({blocking: true, skip: options.skipUpdateCheck});

    // Required lazily so `help`, `version` and `stats` work without Config.json.
    let run;
    try {
        ({run} = require('../src/main.js'));
    } catch (error) {
        console.error(`Błąd: ${error.message}`);
        process.exit(1);
    }
    const code = await run();
    process.exit(code);
}

async function runStats(args) {
    const options = parseOptions(args);
    if (options.period && !(options.period in PERIODS)) {
        fail(`nieznany okres "${options.period}". Użyj: week, month, year lub all.`);
        return;
    }

    const stats = await loadStats();
    const periods = options.period ? [options.period] : Object.keys(PERIODS);

    if (options.json) {
        const payload = {};
        for (const period of periods) payload[period] = summarize(stats, {period});
        console.log(JSON.stringify(payload, null, 2));
        return;
    }

    console.log(`Statystyki instaling-bot ${version}`);
    console.log('');

    const rows = periods.map(period => summarize(stats, {period}));
    const header = ['Okres', 'Sesje', 'Odp.', 'Dobrze', 'Błędnie', 'Skut.', 'Nowe', 'Czas'];
    const widths = [18, 6, 6, 7, 8, 7, 6, 8];

    const pad = (value, width) => String(value).padEnd(width);
    console.log(header.map((cell, index) => pad(cell, widths[index])).join(' '));
    console.log(widths.map(width => '-'.repeat(width)).join(' '));

    for (const row of rows) {
        const values = [
            PERIOD_LABELS[row.period] ?? row.period,
            row.sessions,
            row.answers,
            row.correct,
            row.wrong,
            row.answers > 0 ? `${row.percent}%` : '—',
            row.newWords,
            row.sessions > 0 ? `${row.averageMinutes} min` : '—'
        ];
        console.log(values.map((cell, index) => pad(cell, widths[index])).join(' '));
    }

    console.log('');
    if (rows.every(row => row.sessions === 0)) {
        console.log('Brak zapisanych sesji. Uruchom bota: instaling-bot start');
    } else {
        const active = rows.find(row => row.period === (options.period ?? 'all')) ?? rows[rows.length - 1];
        console.log(`Aktywne dni: ${active.activeDays} · średnio ${active.averageAnswers} odpowiedzi na sesję · łącznie ${Math.round(active.durationMs / 60000)} min.`);
        console.log('Filtruj: --period week|month|year|all · dane dla skryptów: --json.');
    }
}

async function main() {
    const [command = 'start', ...args] = process.argv.slice(2);

    if (command === 'start' || command === 'run') {
        if (wantsHelp(args)) {
            console.log(HELP);
            return;
        }
        return runStart(args);
    }
    if (command === 'stats' || command === 'statystyki') {
        if (wantsHelp(args)) {
            console.log(HELP);
            return;
        }
        return runStats(args);
    }
    if (command === 'remind' || command === 'przypomnienie') {
        if (wantsHelp(args)) {
            console.log(HELP);
            return;
        }
        require('../scripts/remind.js');
        return;
    }
    if (command === 'update-check' || command === 'update') {
        await checkForUpdates({blocking: false, skip: false});
        return;
    }
    if (command === 'version' || command === '--version' || command === '-V') {
        console.log(version);
        return;
    }
    if (command === 'help' || command === '--help' || command === '-h') {
        console.log(HELP);
        return;
    }

    console.error(`Nieznana komenda: ${command}`);
    console.error('');
    console.log(HELP);
    process.exitCode = 1;
}

main().catch(error => {
    console.error(error?.stack ?? error);
    process.exit(1);
});
