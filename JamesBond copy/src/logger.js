// Basic placeholder logger
const fs = require("fs");
const path = require("path");
const os = require("os");

const LOG_FILE = path.join(os.homedir(), "Library", "Logs", "MacAgent.log");

// Ensure log directory exists (basic implementation)
const logDir = path.dirname(LOG_FILE);
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
} catch (err) {
    console.error("Error creating log directory:", err);
    // Fallback or handle error appropriately
}

function log(level, message, error = null) {
    const timestamp = new Date().toISOString();
    let logEntry = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (error) {
        logEntry += `\n${error.stack || error}`;
    }
    logEntry += "\n";

    console.log(logEntry.trim()); // Also log to console

    try {
        fs.appendFileSync(LOG_FILE, logEntry, { encoding: "utf8" });
    } catch (err) {
        console.error(`Failed to write to log file ${LOG_FILE}:`, err);
    }
}

const logInfo = (message) => log("info", message);
const logWarn = (message) => log("warn", message);
const logError = (message, error = null) => log("error", message, error);

module.exports = {
    logInfo,
    logWarn,
    logError,
    LOG_FILE // Export for potential external use
};
