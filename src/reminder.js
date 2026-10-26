// Daily-session reminder shared by the desktop app and the CLI.
//
// The state file lives next to the rest of the runtime data:
//   - desktop: app.getPath('userData') via the optional root argument
//   - CLI:     the project directory (INSTALING_ROOT is honoured)
//
// A reminder fires at most once per day, only after the configured time, and
// only when no session has been completed that day.

const fs = require('fs/promises');
const path = require('path');
const {execFile} = require('child_process');

const ROOT = process.env.INSTALING_ROOT
    ? path.resolve(process.env.INSTALING_ROOT)
    : path.resolve(__dirname, '..');

const STATE_FILE = 'reminder-state.json';
const DEFAULT_TIME = '17:00';

function statePath(root = ROOT) {
    return path.join(root, STATE_FILE);
}

function dateKey(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseTime(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? '').trim());
    if (!match) return null;
    return {hours: Number(match[1]), minutes: Number(match[2]), text: `${match[1]}:${match[2]}`};
}

function minutesOfDay(date = new Date()) {
    return date.getHours() * 60 + date.getMinutes();
}

async function loadState(root = ROOT) {
    try {
        const raw = await fs.readFile(statePath(root), 'utf8');
        const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

async function saveState(state, root = ROOT) {
    await fs.mkdir(root, {recursive: true});
    await fs.writeFile(statePath(root), JSON.stringify(state, null, 4) + '\n', 'utf8');
    return state;
}

async function markSessionDone(now = new Date(), root = ROOT) {
    const state = await loadState(root);
    state.lastSession = dateKey(now);
    return saveState(state, root);
}

async function markNotified(now = new Date(), root = ROOT) {
    const state = await loadState(root);
    state.lastNotified = dateKey(now);
    return saveState(state, root);
}

function isReminderDue(config, state, now = new Date()) {
    const reminder = config?.reminder ?? {};
    if (reminder.enabled === false) return false;

    const time = parseTime(reminder.time ?? DEFAULT_TIME);
    if (!time) return false;
    if (minutesOfDay(now) < time.hours * 60 + time.minutes) return false;

    const today = dateKey(now);
    if (state?.lastSession === today) return false;
    if (state?.lastNotified === today) return false;
    return true;
}

function quoteAppleScript(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function quotePowerShell(text) {
    return `'${String(text).replace(/'/g, "''")}'`;
}

/**
 * Sends a best-effort native notification without adding dependencies.
 * Returns true when a helper process was spawned.
 */
function sendSystemNotification(title, message) {
    let command;
    let args;

    if (process.platform === 'darwin') {
        command = 'osascript';
        args = [
            '-e',
            `display notification "${quoteAppleScript(message)}" with title "${quoteAppleScript(title)}"`
        ];
    } else if (process.platform === 'win32') {
        command = 'powershell.exe';
        args = [
            '-NoProfile',
            '-NonInteractive',
            '-WindowStyle',
            'Hidden',
            '-Command',
            [
                'Add-Type -AssemblyName System.Windows.Forms',
                'Add-Type -AssemblyName System.Drawing',
                '$notify = New-Object System.Windows.Forms.NotifyIcon',
                '$notify.Icon = [System.Drawing.SystemIcons]::Information',
                '$notify.Visible = $true',
                `$notify.ShowBalloonTip(10000, ${quotePowerShell(title)}, ${quotePowerShell(message)}, [System.Windows.Forms.ToolTipIcon]::Info)`,
                'Start-Sleep -Seconds 10',
                '$notify.Dispose()'
            ].join('; ')
        ];
    } else {
        command = 'notify-send';
        args = ['-a', 'instaling-bot', title, message];
    }

    try {
        const child = execFile(command, args, {detached: true, stdio: 'ignore', windowsHide: true});
        child.on('error', () => {});
        child.unref();
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    ROOT,
    STATE_FILE,
    DEFAULT_TIME,
    statePath,
    dateKey,
    parseTime,
    isReminderDue,
    loadState,
    saveState,
    markSessionDone,
    markNotified,
    sendSystemNotification
};
