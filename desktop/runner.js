const {requestStop} = require('../src/control.js');

// Electron starts this file with ELECTRON_RUN_AS_NODE, so it is a normal Node
// process with an IPC channel back to the desktop app.
process.on('message', message => {
    if (message?.type === 'stop') {
        requestStop();
    }
});

// Requiring the CLI entry point starts the bot. It returns a promise that
// resolves with the process exit code after the browser and words are saved.
require('../src/main.js')
    .then(code => process.exit(code))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
