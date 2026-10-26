const words = require('../config/SavedWords.json');
const {ROOT} = require('./helpers.js');
const {writeFile} = require('fs/promises');
const path = require('path');

function normalize(text) {
    return String(text ?? '').trim().toLowerCase();
}

async function getWord(polish, sentence) {
    if (!polish || !sentence) {
        console.error(new TypeError('Tried to get word using nullish value! Aborting!'));
        console.error({polish, sentence});
        return [];
    }
    return words.filter(obj => normalize(obj.polish) === normalize(polish));
}

async function insertWord(polish, english, sentence) {
    if (!polish || !english || !sentence) {
        console.error(new TypeError('Tried to insert nullish value! Aborting!'));
        console.error({polish, english, sentence});
        return;
    }

    const exists = words.some(word => normalize(word.polish) === normalize(polish)
        && normalize(word.english) === normalize(english)
        && normalize(word.sentence) === normalize(sentence));
    if (!exists) {
        words.push({polish, english, sentence});
    }
}

async function saveWords() {
    return writeFile(
        path.join(ROOT, 'config', 'SavedWords.json'),
        JSON.stringify(words, null, 4) + '\n',
        {encoding: 'utf8'}
    );
}

module.exports = {
    getWord,
    insertWord,
    saveWords
};
