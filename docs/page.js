// Shared behaviour for the sub-pages: the taskbar clock in Europe/Warsaw,
// matching the homepage. Analytics is loaded separately by analytics.js.
(function () {
    var clock = document.getElementById('clock');
    if (!clock) return;
    var formatter = new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        hour: '2-digit',
        minute: '2-digit'
    });
    function tick() { clock.textContent = formatter.format(new Date()); }
    tick();
    setInterval(tick, 30000);
})();
