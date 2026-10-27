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
        'log.starting': 'Szukam przycisku rozpoczęcia sesji…',
        'log.started': 'Sesja uruchomiona.',
        'log.answering': 'Odpowiedź {index}: {polish}',
        'log.correct': 'Poprawna odpowiedź.',
        'log.wrong': 'Celowy błąd ({mode}).',
        'log.newWord': 'Nowe słowo — pokazuję tłumaczenie.',
        'log.next': 'Następne słowo.',
        'log.finished': 'Koniec sesji: {answers} odpowiedzi, {correct} poprawnych.',
        'log.stopped': 'Zatrzymano przez użytkownika.',
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
        'log.starting': 'Looking for the start button…',
        'log.started': 'Session started.',
        'log.answering': 'Answer {index}: {polish}',
        'log.correct': 'Correct answer.',
        'log.wrong': 'Deliberate mistake ({mode}).',
        'log.newWord': 'New word — revealing the translation.',
        'log.next': 'Next word.',
        'log.finished': 'Session finished: {answers} answers, {correct} correct.',
        'log.stopped': 'Stopped by the user.',
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
