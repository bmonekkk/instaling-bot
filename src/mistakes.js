// Backwards-compatible entry point. The implementation lives in src/core so the
// browser engine can share it; desktop imports and tests keep working.

module.exports = require('./core/mistakes.js');
