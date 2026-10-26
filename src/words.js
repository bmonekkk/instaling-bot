const fs = require('fs/promises');
const path = require('path');

// The CLI uses the project directory. The Electron app provides a writable
// per-user directory through INSTALING_ROOT.
const ROOT = process.env.INSTALING_ROOT
    ? path.resolve(process.env.INSTALING_ROOT)
    : path.resolve(__dirname, '..');

const CONFIG_DIR = path.join(ROOT, 'config');
const SAVED_WORDS_PATH = path.join(CONFIG_DIR, 'SavedWords.json');

let words = null;

async function loadWords() {
    if (words) return words;

    try {
        const raw = await fs.readFile(SAVED_WORDS_PATH, 'utf8');
        const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
        words = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            words = [];
        } else {
            throw new Error(`Could not read ${SAVED_WORDS_PATH}: ${error.message}`);
        }
    }

    return words;
}

function normalize(text) {
    return String(text ?? '').trim().toLowerCase();
}

async function getWord(polish, sentence) {
    if (!polish || !sentence) {
        console.error(new TypeError('Tried to get word using nullish value! Aborting!'));
        console.error({polish, sentence});
        return [];
    }
    const saved = await loadWords();
    return saved.filter(obj => normalize(obj.polish) === normalize(polish));
}

async function insertWord(polish, english, sentence) {
    if (!polish || !english || !sentence) {
        console.error(new TypeError('Tried to insert nullish value! Aborting!'));
        console.error({polish, english, sentence});
        return;
    }

    const saved = await loadWords();
    const exists = saved.some(word => normalize(word.polish) === normalize(polish)
        && normalize(word.english) === normalize(english)
        && normalize(word.sentence) === normalize(sentence));
    if (!exists) {
        saved.push({polish, english, sentence});
    }
}

async function saveWords() {
    const saved = await loadWords();
    await fs.mkdir(CONFIG_DIR, {recursive: true});
    return fs.writeFile(
        SAVED_WORDS_PATH,
        JSON.stringify(saved, null, 4) + '\n',
        {encoding: 'utf8'}
    );
}

module.exports = {
    SAVED_WORDS_PATH,
    getWord,
    insertWord,
    saveWords
};
