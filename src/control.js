let stopRequested = false;

function resetControl() {
    stopRequested = false;
}

function requestStop() {
    stopRequested = true;
}

function isStopRequested() {
    return stopRequested;
}

module.exports = {
    resetControl,
    requestStop,
    isStopRequested
};
