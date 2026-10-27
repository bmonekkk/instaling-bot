#!/usr/bin/env node
// Bundles the shared mobile engine into the userscript and the native shells.
// Run: npm run build:mobile

const fs = require('fs/promises');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));

const USERSCRIPT_HEADER = `// ==UserScript==
// @name         instaling-bot
// @namespace    https://github.com/bmonekkk/instaling-bot
// @version      ${pkg.version}
// @description  Human-like bot for instaling.pl (PL/EN). Shared engine with the desktop app.
// @author       bmonekkk
// @match        https://instaling.pl/*
// @match        https://www.instaling.pl/*
// @match        https://*.instaling.pl/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL    https://github.com/bmonekkk/instaling-bot/releases/latest/download/instaling-bot.user.js
// @downloadURL  https://github.com/bmonekkk/instaling-bot/releases/latest/download/instaling-bot.user.js
// ==/UserScript==
`;

async function build(entry, outfile, {banner, globalName} = {}) {
    await fs.mkdir(path.dirname(outfile), {recursive: true});
    await esbuild.build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        format: 'iife',
        globalName,
        target: ['es2019'],
        platform: 'browser',
        legalComments: 'none',
        banner: banner ? {js: banner} : undefined,
        define: {__VERSION__: JSON.stringify(pkg.version)},
        logLevel: 'warning'
    });
    const stat = await fs.stat(outfile);
    console.log(`built ${path.relative(ROOT, outfile)} (${stat.size} bytes)`);
}

async function main() {
    const engineEntry = path.join(ROOT, 'mobile/engine/browser.js');
    await build(
        path.join(ROOT, 'mobile/userscript/entry.js'),
        path.join(ROOT, 'dist/instaling-bot.user.js'),
        {banner: USERSCRIPT_HEADER}
    );
    await build(engineEntry, path.join(ROOT, 'mobile/android/app/src/main/assets/core.js'));
    await build(engineEntry, path.join(ROOT, 'mobile/ios/InstalingBot/Resources/core.js'));
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
