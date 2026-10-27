// Lightweight CLI reminder: keeps running in the background and sends native
// notifications when no session has been completed yet.
//
// Usage:
//   npm run remind
//
// It honours the same `reminder` section in Config.json as the desktop app and
// shares its state file, so finishing a CLI run or a desktop session suppresses
// the reminder for that day. With `reminder.repeat_minutes` it repeats every N
// minutes until a session is done.

const config = require('../src/config.js');
const {
    DEFAULT_TIME,
    dateKey,
    isReminderDue,
    loadState,
    markNotified,
    parseTime,
    repeatMinutes,
    sendSystemNotification
} = require('../src/reminder.js');

const TITLE = 'instaling-bot';
const MESSAGE = 'Nie zapomnij o dzisiejszej sesji na InstaLing.';
const CHECK_INTERVAL = 60 * 1000;

let lastStatus = '';

function status(text) {
    if (text === lastStatus) return;
    lastStatus = text;
    console.log(text);
}

async function tick() {
    const now = new Date();
    const time = parseTime(config.reminder?.time ?? DEFAULT_TIME);

    if (config.reminder?.enabled === false) {
        status('[REMIND] Przypomnienia są wyłączone w Config.json (reminder.enabled = false).');
        return;
    }
    if (!time) {
        status('[REMIND] Nieprawidłowa godzina w reminder.time. Użyj formatu HH:MM.');
        return;
    }

    const state = await loadState();
    if (!isReminderDue(config, state, now)) {
        const today = dateKey(now);
        const waiting = now.getHours() * 60 + now.getMinutes() < time.hours * 60 + time.minutes;
        const repeat = repeatMinutes(config.reminder);
        if (waiting) {
            status(`[REMIND] Czekam do ${time.text}...`);
        } else if (state.lastSession === today) {
            status(`[REMIND] Dzisiejsza sesja jest już odhaczona (${today}).`);
        } else if (repeat > 0 && state.lastNotifiedAt) {
            const next = new Date(new Date(state.lastNotifiedAt).getTime() + repeat * 60000);
            status(`[REMIND] Następne przypomnienie po ${next.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}.`);
        } else if (state.lastNotified === today) {
            status(`[REMIND] Przypomnienie na dziś zostało już wysłane (${today}).`);
        } else {
            status('[REMIND] Nic do zrobienia.');
        }
        return;
    }

    status(`[REMIND] Wysyłam przypomnienie o ${time.text}.`);
    if (!sendSystemNotification(TITLE, MESSAGE)) {
        console.log(`\n*** ${TITLE}: ${MESSAGE} ***\n`);
    }
    await markNotified(now);
}

console.log('[REMIND] Codzienne przypomnienie o sesji. Zatrzymaj przez Ctrl+C.');
tick().catch(error => console.error(error));
setInterval(() => tick().catch(error => console.error(error)), CHECK_INTERVAL);
