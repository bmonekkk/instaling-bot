// Builds the AppleScript used as the macOS fallback when the native
// UNNotification API refuses to deliver a notification from an unsigned build
// (`Notification.show()` fires `failed` with UNErrorDomain error 1).
//
// Kept dependency-free so `desktop/main.js` and the tests can share it.

function escapeAppleScript(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function buildDisplayNotificationScript(title, body) {
    return `display notification "${escapeAppleScript(body)}" with title "${escapeAppleScript(title)}"`;
}

module.exports = {escapeAppleScript, buildDisplayNotificationScript};