const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const {
    Browser,
    BrowserPlatform,
    BrowserTag,
    detectBrowserPlatform,
    getInstalledBrowsers,
    install,
    resolveBuildId
} = require('@puppeteer/browsers');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'resources', 'browser');
// Chrome for Testing version used when the release metadata endpoint is
// unavailable (for example on a restricted CI runner). All desktop builds use
// the same version so the installers stay reproducible.
const FALLBACK_CHROME_BUILD = '156.0.8078.47';

// electron-builder and the Chrome download URLs use "mac-arm64" / "mac-x64",
// but @puppeteer/browsers uses "mac_arm" / "mac" internally.
const PLATFORMS = {
    win32: BrowserPlatform.WIN64,
    win64: BrowserPlatform.WIN64,
    mac: BrowserPlatform.MAC,
    'mac-x64': BrowserPlatform.MAC,
    mac_arm: BrowserPlatform.MAC_ARM,
    'mac-arm64': BrowserPlatform.MAC_ARM,
    linux: BrowserPlatform.LINUX,
    linux64: BrowserPlatform.LINUX,
    linux_arm: BrowserPlatform.LINUX_ARM,
    'linux-arm64': BrowserPlatform.LINUX_ARM
};

function argValue(name, fallback) {
    const prefix = `--${name}=`;
    const inline = process.argv.find(arg => arg.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);
    const index = process.argv.indexOf(`--${name}`);
    if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
    return fallback;
}

function targetPlatform() {
    const requested = argValue('platform');
    if (requested) {
        const platform = PLATFORMS[requested];
        if (!platform) {
            throw new Error(`Unknown Chrome platform: ${requested}`);
        }
        return platform;
    }

    const arch = argValue('arch', process.arch);
    if (process.platform === 'win32') return BrowserPlatform.WIN64;
    if (process.platform === 'darwin') {
        return arch === 'arm64' ? BrowserPlatform.MAC_ARM : BrowserPlatform.MAC;
    }
    if (process.platform === 'linux') {
        return arch === 'arm64' ? BrowserPlatform.LINUX_ARM : BrowserPlatform.LINUX;
    }
    return detectBrowserPlatform();
}

function compareBuildIds(a, b) {
    return String(a).localeCompare(String(b), undefined, {numeric: true});
}

async function stableBuildId(platform) {
    const requested = argValue('build', process.env.CHROME_BUILD_ID || '');
    if (requested) {
        console.log(`[browser] Using requested Chrome build ${requested}`);
        return requested;
    }

    try {
        return await resolveBuildId(Browser.CHROME, platform, BrowserTag.STABLE);
    } catch (error) {
        console.log(`[browser] Could not resolve the latest stable Chrome: ${error.message}`);
        console.log(`[browser] Falling back to pinned build ${FALLBACK_CHROME_BUILD}`);
        return FALLBACK_CHROME_BUILD;
    }
}

async function ensureChrome(cacheDir, platform) {
    const browsers = await getInstalledBrowsers({cacheDir});
    const chrome = browsers
        .filter(item => item.browser === 'chrome' && item.platform === platform)
        .sort((a, b) => compareBuildIds(a.buildId, b.buildId));

    if (chrome.length > 0) {
        return chrome[chrome.length - 1];
    }

    console.log(`[browser] Chrome for ${platform} is not cached, downloading...`);
    const buildId = await stableBuildId(platform);
    let lastPercent = -1;

    return install({
        browser: Browser.CHROME,
        buildId,
        cacheDir,
        platform,
        downloadProgressCallback: (downloaded, total) => {
            const percent = total > 0 ? Math.floor((downloaded / total) * 100) : 0;
            if (percent >= lastPercent + 10 || percent === 100) {
                lastPercent = percent;
                console.log(`[browser] Downloading Chrome: ${percent}%`);
            }
        }
    });
}

async function main() {
    const platform = targetPlatform();
    const cacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');

    console.log(`[browser] Target platform: ${platform}`);
    console.log(`[browser] Cache: ${cacheDir}`);

    const installed = await ensureChrome(cacheDir, platform);
    const sourceEntry = path.join(cacheDir, 'chrome', `${installed.platform}-${installed.buildId}`);
    if (!fs.existsSync(installed.executablePath) || !fs.existsSync(sourceEntry)) {
        throw new Error(`Cached Chrome is incomplete: ${installed.executablePath}`);
    }

    await fsp.rm(OUTPUT_DIR, {recursive: true, force: true});
    const destinationEntry = path.join(OUTPUT_DIR, 'chrome', `${installed.platform}-${installed.buildId}`);
    await fsp.mkdir(path.dirname(destinationEntry), {recursive: true});
    await fsp.cp(sourceEntry, destinationEntry, {recursive: true});

    const relativeExecutable = path.relative(sourceEntry, installed.executablePath);
    const outputExecutable = path.join(destinationEntry, relativeExecutable);
    if (!fs.existsSync(outputExecutable)) {
        throw new Error(`Chrome was copied incorrectly: ${outputExecutable}`);
    }

    const manifest = {
        browser: 'chrome',
        platform: installed.platform,
        buildId: installed.buildId,
        executable: path.relative(OUTPUT_DIR, outputExecutable).split(path.sep).join('/')
    };
    await fsp.writeFile(
        path.join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 4) + '\n',
        'utf8'
    );

    console.log(`[browser] Bundled Chrome ${installed.buildId} (${platform})`);
    console.log(`[browser] Executable: ${outputExecutable}`);
    console.log(`[browser] Output: ${OUTPUT_DIR}`);
}

main().catch(error => {
    console.error('[browser] Failed:', error);
    process.exit(1);
});
