// Privacy-friendly, cookie-free analytics.
//
// Nothing loads until you set GOATCOUNTER_SUBACCOUNT below to the subaccount
// you created at https://www.goatcounter.com/ (for example "instaling-bot"
// for https://instaling-bot.goatcounter.com). While it is empty this file is
// a no-op, so the site stays completely tracker-free by default.
//
// GoatCounter does not use cookies or fingerprint visitors and is GDPR-friendly.
(function () {
    var GOATCOUNTER_SUBACCOUNT = ''; // e.g. 'instaling-bot'

    if (!GOATCOUNTER_SUBACCOUNT) return;

    var base = 'https://' + GOATCOUNTER_SUBACCOUNT + '.goatcounter.com';
    var script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-goatcounter', base + '/count');
    script.src = base + '/count.js';
    document.head.appendChild(script);
})();
