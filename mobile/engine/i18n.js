// PL/EN strings for the mobile engine and shells. Keep keys flat and use the
// same {placeholder} syntax as the desktop renderer.

const STRINGS = {
    pl: {
        'status.idle': 'Gotowy',
        'status.starting': 'Uruchamianie…',
        'status.running': 'Pracuję…',
        'status.stopping': 'Zatrzymywanie…',
        'status.finished': 'Sesja zakończona',
        'status.error': 'Błąd',
        'status.stopped': 'Zatrzymano',
        'panel.title': 'instaling-bot',
        'panel.start': 'Start',
        'panel.stop': 'Stop',
        'panel.language': 'Język',
        'panel.saved': 'Słówka: {count}',
        'panel.answers': 'Odpowiedzi: {count}',
        'panel.link': 'GitHub / aktualizacje',
        'panel.settings': 'Ustawienia',
        'panel.close': 'Zamknij',
        'settings.title': 'Ustawienia',
        'settings.validity': 'Poprawność odpowiedzi',
        'settings.limit': 'Limit odpowiedzi',
        'settings.limitHint': '0 = bez limitu',
        'settings.autostart': 'Autostart na stronie nauki',
        'settings.reminder': 'Godzina przypomnienia',
        'settings.save': 'Zapisz',
        'settings.saved': 'Zapisano ustawienia.',
        'stats.title': 'Statystyki',
        'stats.today': 'Dziś: {answers} odpowiedzi, {correct} poprawnych',
        'stats.session': 'Sesja: {answers} odpowiedzi, {correct} poprawnych',
        'stats.accuracy': 'Skuteczność: {percent}%',
        'stats.streak': 'Seria: {days} dni',
        'stats.total': 'Łącznie: {answers} odpowiedzi',
        'stats.empty': 'Brak statystyk — uruchom bota.',
        'log.starting': 'Szukam przycisku rozpoczęcia sesji…',
        'log.started': 'Sesja uruchomiona.',
        'log.answering': 'Odpowiedź {index}: {polish}',
        'log.correct': 'Poprawna odpowiedź.',
        'log.wrong': 'Celowy błąd ({mode}).',
        'log.newWord': 'Nowe słowo — pokazuję tłumaczenie.',
        'log.next': 'Następne słowo.',
        'log.finished': 'Koniec sesji: {answers} odpowiedzi, {correct} poprawnych.',
        'log.stopped': 'Zatrzymano przez użytkownika.',
        'log.limitReached': 'Osiągnięto limit odpowiedzi ({limit}).',
        'error.noAnswer': 'Nie znalazłem pola odpowiedzi. Strona mogła się zmienić.',
        'error.noStart': 'Nie znalazłem przycisku startu sesji. Zaloguj się i otwórz stronę nauki.',
        'error.generic': 'Błąd: {message}'
    },
    en: {
        'status.idle': 'Ready',
        'status.starting': 'Starting…',
        'status.running': 'Working…',
        'status.stopping': 'Stopping…',
        'status.finished': 'Session finished',
        'status.error': 'Error',
        'status.stopped': 'Stopped',
        'panel.title': 'instaling-bot',
        'panel.start': 'Start',
        'panel.stop': 'Stop',
        'panel.language': 'Language',
        'panel.saved': 'Words: {count}',
        'panel.answers': 'Answers: {count}',
        'panel.link': 'GitHub / updates',
        'panel.settings': 'Settings',
        'panel.close': 'Close',
        'settings.title': 'Settings',
        'settings.validity': 'Answer accuracy',
        'settings.limit': 'Answer limit',
        'settings.limitHint': '0 = no limit',
        'settings.autostart': 'Autostart on the learning page',
        'settings.reminder': 'Reminder time',
        'settings.save': 'Save',
        'settings.saved': 'Settings saved.',
        'stats.title': 'Statistics',
        'stats.today': 'Today: {answers} answers, {correct} correct',
        'stats.session': 'Session: {answers} answers, {correct} correct',
        'stats.accuracy': 'Accuracy: {percent}%',
        'stats.streak': 'Streak: {days} days',
        'stats.total': 'All time: {answers} answers',
        'stats.empty': 'No statistics yet — start the bot.',
        'log.starting': 'Looking for the start button…',
        'log.started': 'Session started.',
        'log.answering': 'Answer {index}: {polish}',
        'log.correct': 'Correct answer.',
        'log.wrong': 'Deliberate mistake ({mode}).',
        'log.newWord': 'New word — revealing the translation.',
        'log.next': 'Next word.',
        'log.finished': 'Session finished: {answers} answers, {correct} correct.',
        'log.stopped': 'Stopped by the user.',
        'log.limitReached': 'Answer limit reached ({limit}).',
        'error.noAnswer': 'Could not find the answer field. The page may have changed.',
        'error.noStart': 'Could not find the session start button. Log in and open the learning page.',
        'error.generic': 'Error: {message}'
    }
};

function normalizeLanguage(language) {
    return String(language ?? '').toLowerCase().startsWith('en') ? 'en' : 'pl';
}

function translate(language, key, vars) {
    const lang = normalizeLanguage(language);
    const template = STRINGS[lang][key] ?? STRINGS.pl[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) => (
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    ));
}

module.exports = {STRINGS, normalizeLanguage, translate};
