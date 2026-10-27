// Strategies used when valid_chance decides that the bot should answer
// incorrectly. Keeping them in one place makes the behaviour predictable and
// easy to test without launching a browser.

const ERROR_MODES = ['blank', 'wrong-word', 'misspelling'];

function chooseErrorMode(random = Math.random) {
    const index = Math.floor(random() * ERROR_MODES.length);
    return ERROR_MODES[Math.min(Math.max(index, 0), ERROR_MODES.length - 1)];
}

function normalize(text) {
    return String(text ?? '').trim().toLowerCase();
}

/**
 * Picks a different translation from the saved words. Returns null when there
 * is no other saved word (the caller then falls back to a misspelling).
 */
function pickWrongTranslation(savedWords, correctEnglish, random = Math.random) {
    const correct = normalize(correctEnglish);
    const seen = new Set();
    const candidates = [];

    for (const entry of savedWords ?? []) {
        const english = entry?.english;
        const key = normalize(english);
        if (!key || key === correct || seen.has(key)) continue;
        seen.add(key);
        candidates.push(String(english).trim());
    }

    if (candidates.length === 0) return null;
    const index = Math.floor(random() * candidates.length);
    return candidates[Math.min(index, candidates.length - 1)];
}

module.exports = {
    ERROR_MODES,
    chooseErrorMode,
    normalize,
    pickWrongTranslation
};
