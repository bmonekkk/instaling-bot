const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const {
    Browser,
    BrowserTag,
    computeExecutablePath,
    detectBrowserPlatform,
    getInstalledBrowsers,
    install,
    resolveBuildId
} = require('@puppeteer/browsers');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'resources', 'browser');

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
        if (!Object.values(Browser.Platform ?? {}).includes(requested) &&
            !['win32', 'win64', 'mac-arm64', 'mac-x64', 'linux'].includes(requested)) {
            throw new Error(`Unknown Chrome platform: ${requested}`);
        }
        return requested === 'win32' ? 'win64' : requested;
    }

    const arch = argValue('arch', process.arch);
    if (process.platform === 'win32') return 'win64';
    if (process.platform === 'darwin') return arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
    if (process.platform === 'linux') return 'linux';
    return detectBrowserPlatform();
}

function compareBuildIds(a, b) {
    return String(a).localeCompare(String(b), undefined, {numeric: true});
}

async function ensureChrome(cacheDir, platform) {
    const browsers = await getInstalledBrowsers({cacheDir});
    const chrome = browsers
        .filter(item => item.browser === 'chrome' && item.platform === platform)
        .sort((a, b) => compareBuildIds(a.buildId, b.buildId));

    if (chrome.length > 0) {
        return chrome[chrome.length - 1];
    }

    console.log(`[browser] Chrome for ${platform} is not cached, downloading stable...`);
    const buildId = await resolveBuildId(Browser.CHROME, platform, BrowserTag.STABLE);
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
