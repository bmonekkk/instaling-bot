const config = require('./config.js');
const words = require('../config/SavedWords.json');
const {ROOT, useFeature} = require('./helpers.js');
const {writeFile} = require('fs/promises');
const path = require('path');

const FEATURE_API = 'https://api.crawcik.space/instaling.php';

function normalize(text) {
    return String(text ?? '').trim().toLowerCase();
}

async function featureRequest(params) {
    const url = new URL(FEATURE_API);
    for (const [key, value] of Object.entries({
        user: config.feature.user,
        pass: config.feature.password,
        ...params
    })) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url, {signal: AbortSignal.timeout(10000)});
    if (!response.ok) {
        throw new Error(`Feature API returned ${response.status}`);
    }
    return response.json();
}

async function getAllWords() {
    if (useFeature()) {
        try {
            return await featureRequest({type: 'select'});
        } catch (e) {
            console.error('Could not fetch words from the optional feature API, using local words:', e.message);
        }
    }
    return words;
}

async function getWord(polish, sentence) {
    if (!polish || !sentence) {
        console.error(new TypeError('Tried to get word using nullish value! Aborting!'));
        console.error({polish, sentence});
        return [];
    }

    if (useFeature()) {
        try {
            const data = await featureRequest({type: 'select', pol: polish, sentence});
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.error('Could not fetch translation from the optional feature API, using local words:', e.message);
        }
    }
    return words.filter(obj => normalize(obj.polish) === normalize(polish));
}

async function insertWord(polish, english, sentence) {
    if (!polish || !english || !sentence) {
        console.error(new TypeError('Tried to insert nullish value! Aborting!'));
        console.error({polish, english, sentence});
        return;
    }

    if (useFeature()) {
        try {
            return await featureRequest({
                type: 'insert',
                pol: polish,
                eng: english.replace(/'/g, "''"),
                sentence
            });
        } catch (e) {
            console.error('Could not save word to the optional feature API, saving locally:', e.message);
        }
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
    getAllWords,
    getWord,
    insertWord,
    saveWords
};
