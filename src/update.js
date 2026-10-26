// Update checking shared by the desktop app and the CLI. Installers are
// unsigned, so this only detects a newer release and returns its page; it never
// downloads or installs anything.

const REPOSITORY = 'bmonekkk/instaling-bot';
const RELEASES_URL = `https://github.com/${REPOSITORY}/releases/latest`;

function versionParts(version) {
    return String(version ?? '')
        .trim()
        .replace(/^v/i, '')
        .split('-')[0]
        .split('.')
        .map(part => Number.parseInt(part, 10) || 0);
}

function compareVersions(left, right) {
    const a = versionParts(left);
    const b = versionParts(right);
    const length = Math.max(a.length, b.length);
    for (let index = 0; index < length; index++) {
        const first = a[index] ?? 0;
        const second = b[index] ?? 0;
        if (first !== second) return first > second ? 1 : -1;
    }
    return 0;
}

async function checkLatestRelease(currentVersion, options = {}) {
    const {
        repository = REPOSITORY,
        fetchImpl = globalThis.fetch,
        timeout = 8000
    } = options;

    if (typeof fetchImpl !== 'function') {
        throw new Error('Fetch is not available in this Node.js version');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let response;
    try {
        response = await fetchImpl(`https://api.github.com/repos/${repository}/releases/latest`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': `instaling-bot/${currentVersion}`
            },
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        throw new Error(`GitHub responded with HTTP ${response.status}`);
    }

    const release = await response.json();
    const latest = String(release.tag_name ?? '').replace(/^v/i, '') || String(currentVersion);

    return {
        current: String(currentVersion),
        latest,
        available: compareVersions(latest, currentVersion) > 0,
        url: release.html_url || RELEASES_URL,
        name: release.name || `instaling-bot ${latest}`,
        publishedAt: release.published_at || null,
        notes: release.body || ''
    };
}

module.exports = {
    REPOSITORY,
    RELEASES_URL,
    compareVersions,
    checkLatestRelease
};
