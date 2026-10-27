// DOM selectors shared by the desktop bot and the mobile engine.
// Keep the desktop list first; mobile clients append their own fallbacks.

const SELECTORS = {
    loginEmail: ['#log_email', 'input[name="log_email"]'],
    loginMaskedField: ['#log_password', 'input[name="log_password"]'],
    loginSubmit: ['#main-container form button[type="submit"]', 'form button[type="submit"]', 'button[type="submit"]'],
    startSession: ['a.btn-start-session', '#session_button', 'button#session_button', '.btn-start-session'],
    continueSession: [
        '#continue_session_button',
        '#continue_session_page .btn-start-session',
        '#continue_session_page div.btn-start-session',
        '.continue-session',
        'a.continue-session'
    ],
    newSession: ['#start_session_button', 'div.btn-start-session', 'a.btn-start-session'],
    streakClose: ['#streak-button-close', '.streak-modal .close'],
    usage: ['#question div.usage_example', 'div.usage_example', '.usage_example'],
    translation: ['#question div.caption > div.translations', '#question .translations', 'div.translation', '.translation'],
    answer: ['#answer', 'input[name="answer"]'],
    check: ['#check', 'button#check', '.check-button'],
    correctWord: ['#word', '#correct_word', '.correct-word'],
    nextWord: ['#next_word', 'button#next_word', '#skip > #next_word'],
    newWordForm: ['#new_word_form', '.new-word-form', '#new_word'],
    dontKnowNew: ['#dont_know_new', 'button#dont_know_new'],
    returnMain: ['#return_mainpage', 'a#return_mainpage', '#return_main_page']
};

module.exports = {SELECTORS};
