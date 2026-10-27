// Device detection for the download page.
//
// Kept as a small, dependency-free UMD module so it can be unit tested
// (test/download-detect.test.js) and reused by the page script. Detection
// prefers structured signals (User-Agent Client Hints architecture/bitness)
// over the raw User-Agent string, and returns 'unknown' when nothing is
// conclusive so the page keeps every option visible and asks the visitor.

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.instalingDetectDownload = api;
})(typeof self !== 'undefined' ? self : this, function () {
    const LABELS = {
        win: 'Windows (x64)',
        'mac-arm64': 'macOS · Apple Silicon (ARM64)',
        'mac-x64': 'macOS · Intel (x64)',
        mac: 'macOS',
        android: 'Android',
        iphone: 'iPhone / iOS',
        ipad: 'iPad / iPadOS',
        linux: 'Linux / terminal',
        unknown: 'nieznany system'
    };

    // Which download card(s) to highlight for each detected platform.
    const CARD_FOR = {
        win: ['dl-windows'],
        'mac-arm64': ['dl-mac-arm64'],
        'mac-x64': ['dl-mac-x64'],
        mac: ['dl-mac-arm64', 'dl-mac-x64'],
        android: ['dl-android'],
        iphone: ['dl-userscript'],
        ipad: ['dl-userscript'],
        linux: ['dl-cli'],
        unknown: []
    };

    function normalizeArch(architecture, bitness) {
        const value = String(architecture || '').toLowerCase();
        const bits = String(bitness || '');
        if (value.includes('arm')) return 'arm';
        if (value.includes('x86') || value.includes('x64') || value === 'amd64') {
            return bits === '32' ? 'x86' : 'x64';
        }
        return null;
    }

    function detect(input = {}) {
        const ua = String(input.userAgent || '');
        const platform = String(input.platform || '');
        const touch = Number(input.maxTouchPoints || 0) > 1;

        // iPadOS 13+ Safari reports "MacIntel" and only reveals itself through
        // the touch points, so that is the extra signal we rely on.
        const looksLikeDesktopSafari = /AppleWebKit/i.test(ua) && !/Chrome|CriOS|FxiOS|Edg|OPR/i.test(ua);
        if (/iPad/i.test(ua) || (/^Mac/i.test(platform) && touch && looksLikeDesktopSafari)) {
            return result('ipad');
        }
        if (/iPhone|iPod/i.test(ua)) return result('iphone');
        if (/Android/i.test(ua) || /Android/i.test(platform)) return result('android');
        if (/Windows NT|Win32|Win64/i.test(ua) || /^Win/i.test(platform)) return result('win');
        if (/Macintosh|Mac OS X/i.test(ua) || /^Mac/i.test(platform)) {
            const arch = normalizeArch(input.architecture, input.bitness);
            if (arch === 'arm') return result('mac-arm64');
            if (arch === 'x64' || arch === 'x86') return result('mac-x64');
            return result('mac');
        }
        if (/Linux|X11|CrOS/i.test(ua) || /Linux/i.test(platform)) return result('linux');
        return result('unknown');
    }

    function result(key) {
        return {
            key,
            label: LABELS[key] || LABELS.unknown,
            cards: CARD_FOR[key] || []
        };
    }

    return {CARD_FOR, LABELS, detect, normalizeArch};
});
