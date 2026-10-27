// Puppeteer forces `windowsHide: true` when spawning Chrome on Windows, which can
// keep the browser window hidden (no taskbar entry). Patch spawn before requiring
// Puppeteer so a normal, visible window is created when show_browser is true.
if (process.platform === 'win32') {
    const childProcess = require('child_process');
    const originalSpawn = childProcess.spawn;
    childProcess.spawn = function (command, args, options = {}) {
        if (options && options.windowsHide === true) {
            options = {...options, windowsHide: false};
        }
        return originalSpawn.call(this, command, args, options);
    };
}

const puppeteer = require('puppeteer');
const config = require('./config.js');
const {resetControl, isStopRequested} = require('./control.js');
const {
    getText,
    findSelector,
    isVisible,
    canLogin,
    click,
    clickAndWait,
    clickWait,
    type,
    typeExact,
    misspell,
    quickClick,
    delay,
    getRandomInt,
    savePage,
    prepare,
    dismissConsent
} = require('./helpers.js');
const {green, yellow, red, blue, error} = require('./printer.js');
const chalk = require('chalk');
const {getAllWords, insertWord, getWord, saveWords} = require('./words.js');
const {chooseErrorMode, pickWrongTranslation} = require('./mistakes.js');
const {markSessionDone} = require('./reminder.js');
const {recordSession} = require('./stats.js');

const blockedHosts = [
    'googletagmanager.com',
    'google-analytics.com',
    'googlesyndication.com',
    'googleadservices.com',
    'adservice.google.com',
    'fundingchoicesmessages.google.com',
    'doubleclick.net',
    'tags.refinery89.com',
    'refinery89.com',
    'uptimiarum.eu',
    'facebook.net',
    'facebook.com'
];

const SELECTORS = {
    loginEmail: ['#log_email', 'input[name="log_email"]'],
    loginPassword: ['#log_password', 'input[name="log_password"]'],
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

let i = 0;
let correctCount = 0;
let wrongCount = 0;
let newWordCount = 0;
let runStartedAt = null;
const lastTyped = new Map();

function notify(event, payload = {}) {
    if (typeof process.send !== 'function') return;
    try {
        process.send({type: 'bot-event', event, ...payload});
    } catch (e) {
        // The Electron parent may already be gone; logging must keep working.
    }
}

async function start() {
    const options = {
        headless: !config.show_browser,
        defaultViewport: config.show_browser ? null : {width: 1366, height: 900},
        // Puppeteer adds --enable-automation by default (adds the "controlled by
        // automated software" bar and sets navigator.webdriver). Drop it.
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--disable-blink-features=AutomationControlled',
            `--window-size=${config.window_width ?? 1366},${config.window_height ?? 900}`,
            '--window-position=40,40',
            '--lang=pl-PL,pl',
            '--no-first-run',
            '--no-default-browser-check'
        ]
    };

    // The desktop app bundles Chrome for Testing and passes its exact path.
    // The CLI keeps using Puppeteer's default downloaded browser.
    if (process.env.INSTALING_CHROME) {
        options.executablePath = process.env.INSTALING_CHROME;
    }

    if (config.mute_audio) {
        options.args.push('--mute-audio');
    }

    const [browser] = await Promise.all([
        puppeteer.launch(options),
        prepare()
    ]);
    const pages = await browser.pages();
    const page = pages[0] ?? await browser.newPage();

    // Block ads and the Google consent dialog script. Less noise, no cookie overlay.
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        if (blockedHosts.some(host => url.includes(host))) {
            request.abort().catch(() => {});
        } else {
            request.continue().catch(() => {});
        }
    });

    // Small, non-invasive stealth tweaks. They reduce the most common automation
    // fingerprints, but no timing tweak can guarantee that a site won't detect a bot.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        Object.defineProperty(navigator, 'languages', {get: () => ['pl-PL', 'pl', 'en-US', 'en']});
    });

    if (config.show_browser) {
        await page.bringToFront().catch(() => {});
    }

    return page;
}

// STEPS
async function login(page) {
    if (config.debug) {
        page.on('console', message => console.log(`${message.type().slice(0, 3).toUpperCase()} ${message.text()}`))
            .on('pageerror', ({message}) => console.log(message))
            .on('response', response => console.log(`${response.status()} ${response.url()}`))
            .on('requestfailed', request => console.log(`${request.failure()?.errorText} ${request.url()}`));
    }

    page.on('dialog', async dialog => {
        red(`Dialog: \`${dialog.message()}\``);
        if (dialog.message() === 'Błąd połączenia') {
            error(new Error('Błąd połączenia'));
        }
        await dialog.dismiss().catch(() => {});
    });

    blue(`[LOGIN] Logging in as \`${config.login}\`...`);
    await page.goto(config.loginUrl, {waitUntil: 'domcontentloaded', timeout: 60000});

    // The Google consent dialog covers the whole login form on instaling.pl.
    await dismissConsent(page);

    // Login must be fast and deterministic. Type the credentials with a short
    // fixed-ish delay, verify both values, and retry once if the site rejects
    // the first submit (for example because of a transient session issue).
    for (let attempt = 1; attempt <= 2; attempt++) {
        if (attempt > 1) {
            yellow('[LOGIN] Login was rejected, retrying once...');
            await delay(1200);
            await page.goto(config.loginUrl, {waitUntil: 'domcontentloaded', timeout: 60000});
            await dismissConsent(page);
        }

        let loginValue;
        let passwordValue;
        try {
            loginValue = await typeExact(page, SELECTORS.loginEmail, config.login, getRandomInt(18, 35));
            passwordValue = await typeExact(page, SELECTORS.loginPassword, config.password, getRandomInt(18, 35));
        } catch {
            // Never let a browser or typing error carry the credentials into the
            // error log; the user gets a fixed message instead.
            throw new Error('Could not fill the login form correctly');
        }
        if (loginValue !== config.login || passwordValue !== config.password) {
            throw new Error('Could not fill the login form correctly');
        }

        await clickAndWait(page, SELECTORS.loginSubmit, 30000);
        await delay(300);
        await dismissConsent(page, {timeout: 2000});

        const body = await page.evaluate(() => document.body.innerText).catch(() => '');
        const onLoginPage = /teacher\.php\?page=login/i.test(page.url());
        const rejected = /Logowanie nie powiodło się|nieprawidłowy login lub hasło/i.test(body) || onLoginPage;
        if (!rejected) {
            green(`[LOGIN] Logged in! (${page.url()})`);
            return;
        }
    }

    red('[LOGIN] Login failed - check the login and password in config/Config.json!');
    throw new Error('Login failed');
}

async function startSession(page) {
    blue('[START] Starting...');

    // Optional "streak" popup.
    const streak = await findSelector(page, SELECTORS.streakClose, 2000);
    if (streak) {
        await quickClick(page, streak).catch(() => {});
    }

    // Make sure the learning page is loaded before looking for the start button.
    const startButton = await findSelector(page, SELECTORS.startSession, 15000);
    if (!startButton) {
        // Some accounts go straight to the session page.
        if (await findSelector(page, SELECTORS.answer.concat(SELECTORS.newWordForm), 5000)) {
            green('[START] Session already active!');
            return;
        }
        throw new Error('Could not find the "start session" button');
    }

    // Navigation buttons should react quickly. If the page takes longer, the
    // selectors below keep waiting for the actual content.
    await clickAndWait(page, startButton, 2500);
    await delay(getRandomInt(200, 400));
    await dismissConsent(page, {timeout: 2000});

    // A previous session may be waiting to be continued.
    const continueButton = await findSelector(page, SELECTORS.continueSession, 8000);
    if (continueButton) {
        await clickAndWait(page, continueButton, 2500);
        green('[START] Continued previous session!');
    } else {
        const newButton = await findSelector(page, SELECTORS.newSession, 8000);
        if (newButton) {
            await clickAndWait(page, newButton, 2500);
            green('[START] Started new session!');
        }
    }

    const ready = await findSelector(page, SELECTORS.answer.concat(SELECTORS.newWordForm), 20000);
    if (!ready) {
        await savePage(page, 'start-failed');
        throw new Error('The learning page did not load (no answer field found)');
    }
    green('[START] Started!');
}

async function typeWrongAnswer(page, english) {
    const mode = chooseErrorMode();

    if (mode === 'blank') {
        yellow(`[ANSWER ${i}] Deliberate error: leaving the answer blank`);
        await type(page, SELECTORS.answer, '');
        return 'blank';
    }

    if (mode === 'wrong-word') {
        const wrongWord = pickWrongTranslation(await getAllWords(), english);
        if (wrongWord) {
            yellow(`[ANSWER ${i}] Deliberate wrong translation: \`${chalk.cyan(wrongWord)}\` (was: \`${chalk.white(english)}\`)`);
            await type(page, SELECTORS.answer, wrongWord);
            return 'wrong-word';
        }
    }

    const wrong = misspell(english);
    yellow(`[ANSWER ${i}] Deliberate misspelling: \`${chalk.cyan(wrong)}\` (was: \`${chalk.white(english)}\`)`);
    await type(page, SELECTORS.answer, wrong);
    return 'misspelling';
}

async function answerQuestion(page) {
    i++;
    notify('answer', {index: i});
    await savePage(page, i);
    blue(`[ANSWER ${i}] Detecting word...`);

    const [sentence, polish] = await Promise.all([
        getText(page, SELECTORS.usage),
        getText(page, SELECTORS.translation)
    ]);

    blue(`[ANSWER ${i}] Detected sentence: \`${chalk.white(sentence)}\``);
    blue(`[ANSWER ${i}] Detected polish word: \`${chalk.white(polish)}\``);

    const translation = await getWord(polish, sentence);
    const englishes = translation?.map?.(obj => obj.english) ?? [];
    const english = englishes.find(word => !lastTyped.get(word)) ?? englishes[getRandomInt(0, englishes.length)];

    if (await isVisible(page, SELECTORS.newWordForm, 1000)) {
        return newWord(page);
    }

    let mistake = null;
    if (english) {
        green(`[ANSWER ${i}] Found translation for: \`${chalk.white(polish)}\`: \`${chalk.cyan(english)}\``);
        const random = Math.random();
        if (random < config.valid_chance) {
            green(`[ANSWER ${i}] Typing!`);
            await type(page, SELECTORS.answer, english);
        } else {
            mistake = await typeWrongAnswer(page, english);
        }
    } else {
        red(`[ANSWER ${i}] Not found translation for: \`${chalk.white(polish)}\``);
    }

    await clickWait(page, SELECTORS.check, config.delays?.check_min, config.delays?.check_max);

    // The answer-result page normally puts the correct word in #word. For a
    // "Literówka" (typo) result that element can stay empty, so fall back to
    // the translation we already know instead of failing the whole run.
    const correctSelector = await findSelector(page, SELECTORS.correctWord, 2000);
    const revealed = correctSelector
        ? await page.$eval(correctSelector, el => (el.textContent || '').trim()).catch(() => '')
        : '';
    const validEnglish = revealed || english || '';
    if (validEnglish) {
        blue(`[ANSWER ${i}] Valid translation for: \`${chalk.white(polish)}\` is: \`${chalk.cyan(validEnglish)}\``);
    } else {
        yellow(`[ANSWER ${i}] Could not read the correct answer from the page.`);
    }
    if (english) {
        lastTyped.set(english, english !== validEnglish);
    }
    if (validEnglish && !englishes.find(word => word === validEnglish)) {
        yellow(`[ANSWER ${i}] Saving translation for: \`${chalk.white(polish)}\`: \`${chalk.cyan(validEnglish)}\``);
        await insertWord(polish, validEnglish, sentence);
    }

    const correct = Boolean(validEnglish && english === validEnglish);
    if (correct) {
        correctCount++;
    } else {
        wrongCount++;
    }

    notify('answered', {
        index: i,
        polish,
        typed: english || null,
        valid: validEnglish || null,
        correct,
        mistake
    });

    blue(`[ANSWER ${i}] Next word!`);
    await clickWait(page, SELECTORS.nextWord, config.delays?.next_word_min, config.delays?.next_word_max);
}

async function newWord(page) {
    // The bot does not know the word yet: pick "don't know" so the correct translation is revealed.
    newWordCount++;
    wrongCount++;
    notify('new-word', {index: i});
    await savePage(page, `${i}_new_word_0`);
    await clickWait(page, SELECTORS.dontKnowNew, config.delays?.check_min, config.delays?.check_max);
    await savePage(page, `${i}_new_word_1`);
    blue(`[ANSWER ${i}] Next word!`);
    await clickWait(page, SELECTORS.nextWord, config.delays?.next_word_min, config.delays?.next_word_max);
}

async function isSessionFinished(page) {
    if (!page) return false;
    const body = await page.evaluate(() => document.body.innerText).catch(() => '');
    const finishedText = /koniec|zakończ|gratulacje|wyniki|podsumowanie|nie ma już/i.test(body);
    const hasForm = await findSelector(page, SELECTORS.answer.concat(SELECTORS.newWordForm), 1000);
    return finishedText && !hasForm;
}

async function handleStop(page, code = 0) {
    notify('phase', {phase: 'stopping'});

    if (page) {
        blue('[STOP] Confirming...');
        const returnButton = await findSelector(page, SELECTORS.returnMain, 3000);
        if (returnButton) {
            await click(page, returnButton).catch(() => {});
        }

        blue('[STOP] Saving words...');
        await saveWords().catch(e => console.error(e));

        blue('[STOP] Closing...');
        await page.browser().close().catch(() => {});
    } else {
        blue('[STOP] Saving words...');
        await saveWords().catch(e => console.error(e));
    }

    // Used by the daily reminder: a run with at least one answer counts as the
    // session done for today (desktop and CLI share the same state file).
    if (i > 0) {
        await markSessionDone().catch(e => console.error(e));
        await recordSession({
            answers: i,
            correct: correctCount,
            wrong: wrongCount,
            newWords: newWordCount,
            durationMs: runStartedAt ? Date.now() - runStartedAt : 0
        }).catch(e => console.error(e));
    }

    green('Thanks for using InstaLing Bot by bmonekkk');
    green('https://github.com/bmonekkk/instaling-bot');
    notify('finished', {code});
    return code;
}

async function run() {
    resetControl();
    i = 0;
    correctCount = 0;
    wrongCount = 0;
    newWordCount = 0;
    runStartedAt = Date.now();
    lastTyped.clear();

    let page;
    try {
        if (!canLogin()) {
            red('Please type in config/Config.json your login and password!');
            notify('error', {message: 'Missing login or password'});
            return 0;
        }

        page = await start();
        if (isStopRequested()) {
            yellow('[STOP] Stop requested.');
            return await handleStop(page, 0);
        }

        await login(page);
        notify('phase', {phase: 'logged-in'});
        if (isStopRequested()) {
            yellow('[STOP] Stop requested.');
            return await handleStop(page, 0);
        }

        await startSession(page);
        notify('phase', {phase: 'running'});

        try {
            // When the session ends, one of the expected elements disappears and the loop stops.
            while (true) {
                if (isStopRequested()) {
                    yellow('[STOP] Stop requested.');
                    break;
                }
                if (config.max_answers > 0 && i >= config.max_answers) {
                    yellow(`[DONE] Reached max_answers limit (${config.max_answers}).`);
                    break;
                }
                await answerQuestion(page);
            }
            return await handleStop(page, 0);
        } catch (e) {
            if (isStopRequested()) {
                yellow('[STOP] Stop requested.');
                return await handleStop(page, 0);
            }
            if (await isSessionFinished(page)) {
                green('[DONE] Session finished!');
            } else {
                error(e);
                notify('error', {message: String(e?.message ?? e)});
                await savePage(page, 'error');
            }
            return await handleStop(page, 0);
        }
    } catch (err) {
        if (isStopRequested()) {
            return await handleStop(page, 0);
        }
        error(err);
        notify('error', {message: String(err?.message ?? err)});
        await savePage(page, 'error');
        return await handleStop(page, 1);
    }
}

if (require.main === module) {
    run()
        .then(code => process.exit(code))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

// The Electron runner and the CLI entry point start the bot explicitly.
module.exports = {run};
