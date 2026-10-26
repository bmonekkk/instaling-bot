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
const {
    getText,
    findSelector,
    isVisible,
    canLogin,
    useFeature,
    click,
    clickAndWait,
    clickWait,
    type,
    delay,
    savePage,
    prepare,
    dismissConsent,
    eventer
} = require('./helpers.js');
const {green, yellow, red, blue, error} = require('./printer.js');
const chalk = require('chalk');
const {insertWord, getWord, saveWords} = require('./words.js');
const uniqueRandomArray = require('unique-random-array');

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
const lastTyped = new Map();

// MAIN
(async () => {
    let page;
    try {
        if (!canLogin()) {
            red('Please type in config/Config.json your login and password!');
            return;
        }

        page = await start();
        await login(page);
        await startSession(page);

        try {
            // When the session ends, one of the expected elements disappears and the loop stops.
            while (true) {
                if (config.max_answers > 0 && i >= config.max_answers) {
                    yellow(`[DONE] Reached max_answers limit (${config.max_answers}).`);
                    break;
                }
                await answerQuestion(page);
            }
            await handleStop(page);
        } catch (e) {
            if (await isSessionFinished(page)) {
                green('[DONE] Session finished!');
            } else {
                error(e);
                await savePage(page, 'error');
            }
            await handleStop(page);
        }
    } catch (err) {
        error(err);
        await savePage(page, 'error');
        await handleStop(page);
        eventer.emit('stopBot', 1);
    }
})();

async function start() {
    const options = {
        headless: !config.show_browser,
        devtools: Boolean(config.open_devtools),
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
        if (dialog.message() === 'BĹ‚Ä…d poĹ‚Ä…czenia') {
            error(new Error('BĹ‚Ä…d poĹ‚Ä…czenia'));
            eventer.emit('stopBot', 1);
        }
        await dialog.dismiss().catch(() => {});
    });

    blue(`[LOGIN] Logging in as \`${config.login}\`...`);
    await page.goto(config.sites.login, {waitUntil: 'domcontentloaded', timeout: 60000});

    // The Google consent dialog covers the whole login form on instaling.pl.
    await dismissConsent(page);

    await type(page, SELECTORS.loginEmail, config.login);
    await type(page, SELECTORS.loginPassword, config.password);

    await clickAndWait(page, SELECTORS.loginSubmit, 30000);
    await delay(1000);
    await dismissConsent(page, {timeout: 2000});

    const body = await page.evaluate(() => document.body.innerText).catch(() => '');
    const stillOnLogin = /Logowanie nie powiodĹ‚o siÄ™|nieprawidĹ‚owy login lub hasĹ‚o/i.test(body);
    if (stillOnLogin) {
        red('[LOGIN] Login failed - check the login and password in config/Config.json!');
        throw new Error('Login failed');
    }

    green(`[LOGIN] Logged in! (${page.url()})`);
}

async function startSession(page) {
    blue('[START] Starting...');

    // Optional "streak" popup.
    const streak = await findSelector(page, SELECTORS.streakClose, 2000);
    if (streak) {
        await click(page, streak).catch(() => {});
        await delay(500);
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

    await clickAndWait(page, startButton, 15000);
    await delay(1000);
    await dismissConsent(page, {timeout: 2000});

    // A previous session may be waiting to be continued.
    const continueButton = await findSelector(page, SELECTORS.continueSession, 5000);
    if (continueButton) {
        await clickAndWait(page, continueButton, 8000);
        green('[START] Continued previous session!');
    } else {
        const newButton = await findSelector(page, SELECTORS.newSession, 5000);
        if (newButton) {
            await clickAndWait(page, newButton, 8000);
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

async function answerQuestion(page) {
    i++;
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
    const english = englishes.find(word => !lastTyped.get(word)) ?? uniqueRandomArray(englishes)();

    if (await isVisible(page, SELECTORS.newWordForm, 1000)) {
        return newWord(page);
    }

    if (english) {
        green(`[ANSWER ${i}] Found translation for: \`${chalk.white(polish)}\`: \`${chalk.cyan(english)}\``);
        const random = Math.random();
        if (random < config.valid_chance) {
            green(`[ANSWER ${i}] Typing!`);
            await type(page, SELECTORS.answer, english);
        } else {
            yellow(`[ANSWER ${i}] Not typing! \`${chalk.white(random)}\` is higher than \`${chalk.cyan(config.valid_chance)}\``);
        }
    } else {
        red(`[ANSWER ${i}] Not found translation for: \`${chalk.white(polish)}\``);
    }

    await clickWait(page, SELECTORS.check, config.delays?.check_min, config.delays?.check_max);

    const valid_english = (await getText(page, SELECTORS.correctWord)).trim();
    blue(`[ANSWER ${i}] Valid translation for: \`${chalk.white(polish)}\` is: \`${chalk.cyan(valid_english)}\``);
    if (english) {
        lastTyped.set(english, english !== valid_english);
    }
    if (valid_english && !englishes.find(word => word === valid_english)) {
        yellow(`[ANSWER ${i}] Saving translation for: \`${chalk.white(polish)}\`: \`${chalk.cyan(valid_english)}\``);
        await insertWord(polish, valid_english, sentence);
    }

    blue(`[ANSWER ${i}] Next word!`);
    await clickWait(page, SELECTORS.nextWord, config.delays?.next_word_min, config.delays?.next_word_max);
}

async function newWord(page) {
    // The bot does not know the word yet: pick "don't know" so the correct translation is revealed.
    await savePage(page, `${i}_feature_0`);
    await clickWait(page, SELECTORS.dontKnowNew, config.delays?.check_min, config.delays?.check_max);
    await savePage(page, `${i}_feature_1`);
    blue(`[ANSWER ${i}] Next word!`);
    await clickWait(page, SELECTORS.nextWord, config.delays?.next_word_min, config.delays?.next_word_max);
}

async function isSessionFinished(page) {
    if (!page) return false;
    const body = await page.evaluate(() => document.body.innerText).catch(() => '');
    const finishedText = /koniec|zakoĹ„cz|gratulacje|wyniki|podsumowanie|nie ma juĹĽ/i.test(body);
    const hasForm = await findSelector(page, SELECTORS.answer.concat(SELECTORS.newWordForm), 1000);
    return finishedText && !hasForm;
}

async function handleStop(page) {
    if (!page) return;
    blue('[STOP] Confirming...');
    const returnButton = await findSelector(page, SELECTORS.returnMain, 3000);
    if (returnButton) {
        await click(page, returnButton).catch(() => {});
    }

    if (!useFeature()) {
        blue('[STOP] Saving words...');
        await saveWords().catch(e => console.error(e));
    }

    blue('[STOP] Closing...');
    await page.browser().close().catch(() => {});

    green('Thanks for using InstaLing Bot by PanSzelescik');
    green('https://github.com/PanSzelescik/instaling-bot');
    eventer.emit('stopBot', 0);
}
