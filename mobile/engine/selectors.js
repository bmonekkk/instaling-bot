// Mobile DOM selectors. The desktop list is reused and extended with broader
// fallbacks because instaling.pl may render a slightly different page on phones.

const {SELECTORS: DESKTOP_SELECTORS} = require('../../src/core/selectors.js');

const SELECTORS = {
    ...DESKTOP_SELECTORS,
    answer: [
        ...DESKTOP_SELECTORS.answer,
        'input[type="text"]',
        'textarea'
    ],
    check: [
        ...DESKTOP_SELECTORS.check,
        'button[name="check"]',
        'input[type="submit"]'
    ],
    nextWord: [
        ...DESKTOP_SELECTORS.nextWord,
        'button.next',
        'a.next'
    ],
    translation: [
        ...DESKTOP_SELECTORS.translation,
        '[class*="translations"]',
        '[class*="translation"]'
    ],
    usage: [
        ...DESKTOP_SELECTORS.usage,
        '[class*="usage"]'
    ],
    newWordForm: [
        ...DESKTOP_SELECTORS.newWordForm,
        '#new_word_form',
        'form[name="new_word"]'
    ]
};

// Fallback labels used when the site drops its ids/classes.
const TEXT = {
    start: ['rozpocznij', 'start', 'zacznij', 'start session', 'begin'],
    continue: ['kontynuuj', 'continue', 'wróć do sesji', 'resume'],
    newSession: ['nowa sesja', 'new session', 'rozpocznij naukę'],
    check: ['sprawdź', 'check', 'zatwierdź', 'submit'],
    next: ['dalej', 'next', 'następne', 'kontynuuj'],
    dontKnow: ['nie wiem', "don't know", 'pokaż', 'show']
};

module.exports = {SELECTORS, TEXT};
