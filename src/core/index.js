// Browser-safe core shared by the desktop CLI, the userscript and the mobile
// WebView shells. Everything exported here must stay free of Node APIs.

const {getRandomInt, pick} = require('./random.js');
const {buildTypingSteps, getTypoChar, misspell, ACCENT_MAP, TYPO_NEIGHBORS} = require('./typing.js');
const {chooseEnglish, normalize, shouldAnswerCorrect} = require('./answer.js');
const {ERROR_MODES, chooseErrorMode, pickWrongTranslation} = require('./mistakes.js');

module.exports = {
    ACCENT_MAP,
    ERROR_MODES,
    TYPO_NEIGHBORS,
    buildTypingSteps,
    chooseEnglish,
    chooseErrorMode,
    getRandomInt,
    getTypoChar,
    misspell,
    normalize,
    pick,
    pickWrongTranslation,
    shouldAnswerCorrect
};
