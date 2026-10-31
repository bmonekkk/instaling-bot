// Guards the macOS notification fallback. Native Electron notifications are
// rejected for unsigned builds, so desktop/main.js re-sends the message through
// osascript. The AppleScript must stay valid (and injection-free) for arbitrary
// titles and bodies.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildDisplayNotificationScript,
    escapeAppleScript
} = require('../desktop/apple-notification.js');

test('builds a display notification command from the title and body', () => {
    assert.equal(
        buildDisplayNotificationScript('instaling-bot', 'Sesja zakonczona: 30 odpowiedzi'),
        'display notification "Sesja zakonczona: 30 odpowiedzi" with title "instaling-bot"'
    );
});

test('escapes double quotes so the AppleScript string cannot be broken', () => {
    assert.equal(escapeAppleScript('say "hi"'), 'say \\"hi\\"');
    assert.equal(
        buildDisplayNotificationScript('t', 'a "b" c'),
        'display notification "a \\"b\\" c" with title "t"'
    );
});

test('escapes backslashes before quotes', () => {
    assert.equal(escapeAppleScript('C:\\path\\'), 'C:\\\\path\\\\');
    assert.equal(escapeAppleScript('\\"'), '\\\\\\"');
});

test('handles empty and null-ish values without throwing', () => {
    assert.equal(escapeAppleScript(null), '');
    assert.equal(escapeAppleScript(undefined), '');
    assert.equal(buildDisplayNotificationScript('t', ''), 'display notification "" with title "t"');
});