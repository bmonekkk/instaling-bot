// Human-like typing primitives. Kept free of Node and Puppeteer APIs so the
// same code can drive the desktop bot, the userscript and the mobile WebViews.

const {getRandomInt} = require('./random.js');

const TYPO_NEIGHBORS = {
    q: ['w', 'a', 's'],
    w: ['q', 'e', 'a', 's', 'd'],
    e: ['w', 'r', 's', 'd', 'f'],
    r: ['e', 't', 'd', 'f', 'g'],
    t: ['r', 'y', 'f', 'g', 'h'],
    y: ['t', 'u', 'g', 'h', 'j'],
    u: ['y', 'i', 'h', 'j', 'k'],
    i: ['u', 'o', 'j', 'k', 'l'],
    o: ['i', 'p', 'k', 'l'],
    p: ['o', 'l'],
    a: ['q', 'w', 's', 'z', 'x'],
    s: ['a', 'd', 'w', 'e', 'z', 'x', 'c'],
    d: ['s', 'f', 'e', 'r', 'x', 'c', 'v'],
    f: ['d', 'g', 'r', 't', 'c', 'v', 'b'],
    g: ['f', 'h', 't', 'y', 'v', 'b', 'n'],
    h: ['g', 'j', 'y', 'u', 'b', 'n', 'm'],
    j: ['h', 'k', 'u', 'i', 'n', 'm'],
    k: ['j', 'l', 'i', 'o', 'm'],
    l: ['k', 'o', 'p'],
    z: ['a', 's', 'x'],
    x: ['z', 'c', 's', 'd'],
    c: ['x', 'v', 'd', 'f'],
    v: ['c', 'b', 'f', 'g'],
    b: ['v', 'n', 'g', 'h'],
    n: ['b', 'm', 'h', 'j'],
    m: ['n', 'j', 'k']
};

const ACCENT_MAP = {
    á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a', å: 'a',
    é: 'e', è: 'e', ë: 'e', ê: 'e',
    í: 'i', ì: 'i', ï: 'i', î: 'i',
    ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
    ú: 'u', ù: 'u', ü: 'u', û: 'u',
    ñ: 'n', ç: 'c', ß: 's', ł: 'l', ą: 'a', ć: 'c', ę: 'e',
    ś: 's', ź: 'z', ż: 'z', ń: 'n'
};

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

function getTypoChar(char, random = Math.random) {
    const lower = char.toLowerCase();
    if (lower === char.toUpperCase()) {
        return char;
    }
    const base = ACCENT_MAP[lower] ?? lower;
    const options = TYPO_NEIGHBORS[base] ?? LETTERS;
    const wrong = options[getRandomInt(0, options.length, random)];
    return char === char.toUpperCase() ? wrong.toUpperCase() : wrong;
}

/**
 * Creates a plausible (but wrong) spelling of a word. Used when valid_chance
 * decides that the bot should answer incorrectly, so the answer field is filled
 * with a human-like mistake instead of being left empty.
 */
function misspell(word, random = Math.random) {
    const chars = [...word];
    if (chars.length < 2) {
        return word + 'x';
    }
    const style = getRandomInt(0, 3, random);
    if (style === 0) {
        const i = getRandomInt(0, chars.length - 1, random);
        [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    } else if (style === 1) {
        chars.splice(getRandomInt(0, chars.length, random), 1);
    } else {
        const i = getRandomInt(0, chars.length, random);
        chars[i] = getTypoChar(chars[i], random);
    }
    const result = chars.join('');
    return result === word ? word.slice(0, -1) : result;
}

/**
 * Builds the list of keyboard operations for human-like typing. The adapter is
 * responsible for executing them (Puppeteer keyboard, DOM input events, ...).
 *
 * Steps: {op: 'type', text}, {op: 'key', key: 'Backspace'}, {op: 'wait', ms}.
 */
function buildTypingSteps(text, delays = {}, random = Math.random) {
    const typeMin = delays.type_min ?? 90;
    const typeMax = delays.type_max ?? 230;
    const pauseChance = delays.type_pause_chance ?? 0.12;
    const pauseMin = delays.type_pause_min ?? 250;
    const pauseMax = delays.type_pause_max ?? 700;
    const typoChance = delays.typo_chance ?? 0.15;

    const chars = [...String(text ?? '')];
    const typoable = chars
        .map((char, index) => (/[a-z]/i.test(char) ? index : -1))
        .filter(index => index >= 0);
    const typoAt = typoable.length > 0 && random() < typoChance
        ? typoable[getRandomInt(0, typoable.length, random)]
        : -1;

    const steps = [];
    for (let index = 0; index < chars.length; index++) {
        if (index === typoAt) {
            steps.push({op: 'type', text: getTypoChar(chars[index], random)});
            steps.push({op: 'wait', ms: getRandomInt(90, 200, random)});
            steps.push({op: 'key', key: 'Backspace'});
            steps.push({op: 'wait', ms: getRandomInt(60, 150, random)});
        }

        steps.push({op: 'type', text: chars[index]});
        steps.push({op: 'wait', ms: getRandomInt(typeMin, typeMax, random)});

        const isBreak = chars[index] === ' ' || chars[index] === ',';
        if (index < chars.length - 1 && (isBreak || random() < pauseChance)) {
            steps.push({op: 'wait', ms: getRandomInt(pauseMin, pauseMax, random)});
        }
    }
    return steps;
}

module.exports = {
    ACCENT_MAP,
    TYPO_NEIGHBORS,
    buildTypingSteps,
    getTypoChar,
    misspell
};
