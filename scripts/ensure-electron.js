const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const electronDir = path.join(__dirname, '..', 'node_modules', 'electron');
const pathFile = path.join(electronDir, 'path.txt');

if (fs.existsSync(pathFile)) {
    const relative = fs.readFileSync(pathFile, 'utf8').trim();
    if (relative && fs.existsSync(path.join(electronDir, 'dist', relative))) {
        process.exit(0);
    }
}

const installer = path.join(electronDir, 'install.js');
if (!fs.existsSync(installer)) {
    console.log('[electron] electron package is not installed yet, skipping binary check.');
    process.exit(0);
}

console.log('[electron] Downloading the Electron runtime...');
const result = spawnSync(process.execPath, [installer], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
});

if (result.status !== 0) {
    console.error('[electron] Could not install the Electron runtime.');
    process.exit(result.status ?? 1);
}
