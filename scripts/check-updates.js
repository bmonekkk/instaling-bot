const {version} = require('../package.json');
const {checkLatestRelease} = require('../src/update.js');

checkLatestRelease(version)
    .then(result => {
        console.log(`Zainstalowana wersja: ${result.current}`);
        console.log(`Najnowsze wydanie:   ${result.latest}`);
        if (result.available) {
            console.log(`Dostępna aktualizacja: ${result.url}`);
        } else {
            console.log('Masz najnowszą wersję.');
        }
    })
    .catch(error => {
        console.error(`Nie udało się sprawdzić aktualizacji: ${error.message}`);
        process.exitCode = 1;
    });
