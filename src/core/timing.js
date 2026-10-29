// Human timing primitives. Uniform ranges are the easiest statistical tell:
// real people cluster near the fast end and occasionally take much longer.
// These helpers produce a right-skewed distribution instead of a flat one.
//
// Pure functions with an injectable RNG so tests stay deterministic.

/**
 * Right-skewed sample inside [min, max] using the inverse triangular CDF.
 * `modeRatio` (0..1) is where the peak sits; 0.35 means most answers happen in
 * the first third of the configured range, with a tail towards the slow end.
 */
function humanDelay(min, max, random = Math.random, modeRatio = 0.35) {
    let a = Number(min);
    let b = Number(max);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    if (b < a) [a, b] = [b, a];
    if (a === b) return Math.round(a);

    const ratio = Math.min(0.99, Math.max(0.01, Number(modeRatio) || 0.35));
    const c = a + ratio * (b - a);
    const u = Math.min(0.999999, Math.max(0, random()));

    const value = u <= ratio
        ? a + Math.sqrt(u * (b - a) * (c - a))
        : b - Math.sqrt((1 - u) * (b - a) * (b - c));
    return Math.round(value);
}

/**
 * Returns 0 most of the time, and a longer "I got distracted" pause with the
 * given probability. Real sessions contain these; a bot that never idles has a
 * suspiciously tidy time distribution.
 */
function distractionPause(chance = 0, min = 8000, max = 30000, random = Math.random) {
    const probability = Math.min(1, Math.max(0, Number(chance) || 0));
    if (probability <= 0 || random() >= probability) return 0;
    return humanDelay(min, max, random, 0.5);
}

module.exports = {distractionPause, humanDelay};