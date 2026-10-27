// Small randomness helpers shared by the Node bot and the browser engine.
// Every function accepts an optional RNG so tests can stay deterministic.

function getRandomInt(min, max, random = Math.random) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random() * (max - min)) + min;
}

function pick(list, random = Math.random) {
    if (!Array.isArray(list) || list.length === 0) return undefined;
    const index = Math.floor(random() * list.length);
    return list[Math.min(index, list.length - 1)];
}

module.exports = {getRandomInt, pick};
