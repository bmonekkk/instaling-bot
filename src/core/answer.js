// Answer evaluation shared by every client. Pure functions only: no DOM, no
// filesystem, no Node built-ins.

const {getRandomInt} = require('./random.js');

function normalize(text) {
    return String(text ?? '').trim().toLowerCase();
}

/** Chooses the next translation, preferring words that were not used recently. */
function chooseEnglish(englishes, isUsed = () => false, random = Math.random) {
    const list = Array.isArray(englishes) ? englishes.filter(Boolean) : [];
    if (list.length === 0) return undefined;
    const fresh = list.find(word => !isUsed(word));
    if (fresh !== undefined) return fresh;
    return list[getRandomInt(0, list.length, random)];
}

/** Whether this answer should be correct, based on valid_chance. */
function shouldAnswerCorrect(validChance, random = Math.random) {
    const chance = Math.min(1, Math.max(0, Number(validChance)));
    if (!Number.isFinite(chance)) return true;
    return random() < chance;
}

module.exports = {chooseEnglish, normalize, shouldAnswerCorrect};
