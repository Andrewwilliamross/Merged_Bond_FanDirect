const fs = require("fs-extra");
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Load .env from root
const { logInfo, logError, logWarn } = require("./logger");

const CONFIG_DIR = path.join(os.homedir(), ".config", "mac-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG = {
    port: 3000,
    pollInterval: 10000, // 10 seconds
    mapRefreshInterval: 3600000, // 1 hour
    rateLimit: 10000, // 10 seconds between sends
    apiKey: null, // Must be set in .env or config.json
    heartbeatInterval: 60000, // 60 seconds
    chatDbPath: path.join(os.homedir(), "Library", "Messages", "chat.db"),
    // Supabase details are loaded directly via process.env in supabase.js
};

let currentConfig = { ...DEFAULT_CONFIG };

/**
 * Loads configuration from JSON file and environment variables.
 */
function loadConfig() {
    logInfo("Loading configuration...");
    let fileConfig = {};

    // Ensure config directory exists
    try {
        fs.ensureDirSync(CONFIG_DIR);
    } catch (err) {
        logError(`Error ensuring config directory exists: ${CONFIG_DIR}`, err);
        // Continue with defaults and .env
    }

    // Load from config.json
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const rawData = fs.readFileSync(CONFIG_FILE, "utf8");
            fileConfig = JSON.parse(rawData);
            logInfo(`Loaded configuration from ${CONFIG_FILE}`);
        } catch (err) {
            logError(`Error reading or parsing config file ${CONFIG_FILE}. Using defaults/env vars.`, err);
            fileConfig = {};
        }
    } else {
        logWarn(`Config file not found at ${CONFIG_FILE}. Using defaults/env vars. Consider creating it.`);
        // Optionally save default config here if it doesn't exist
        // saveConfig(DEFAULT_CONFIG); // Be careful not to overwrite API key if set only in .env
    }

    // Merge: Defaults < File Config < Environment Variables
    currentConfig = {
        ...DEFAULT_CONFIG,
        ...fileConfig,
        port: parseInt(process.env.PORT || fileConfig.port || DEFAULT_CONFIG.port, 10),
        pollInterval: parseInt(process.env.POLL_INTERVAL || fileConfig.pollInterval || DEFAULT_CONFIG.pollInterval, 10),
        mapRefreshInterval: parseInt(process.env.MAP_REFRESH_INTERVAL || fileConfig.mapRefreshInterval || DEFAULT_CONFIG.mapRefreshInterval, 10),
        rateLimit: parseInt(process.env.RATE_LIMIT || fileConfig.rateLimit || DEFAULT_CONFIG.rateLimit, 10),
        apiKey: process.env.API_KEY || fileConfig.apiKey || DEFAULT_CONFIG.apiKey,
        heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || fileConfig.heartbeatInterval || DEFAULT_CONFIG.heartbeatInterval, 10),
        chatDbPath: process.env.CHAT_DB_PATH || fileConfig.chatDbPath || DEFAULT_CONFIG.chatDbPath,
    };

    // Validate essential config
    if (!currentConfig.apiKey) {
        logError("CRITICAL: API_KEY is not set. Please set it in .env or config.json. Server endpoint will be insecure.");
        // In a production scenario, you might want to exit here.
        // process.exit(1);
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
         logWarn("Supabase URL or Service Role Key not found in .env. Supabase integration will likely fail.");
    }

    logInfo("Configuration loaded successfully.");
    // Avoid logging sensitive info like API key
    // console.log("Current Config:", currentConfig);
}

/**
 * Saves the current configuration (excluding env vars) to the JSON file.
 * @param {object} configToSave - Optional config object to save, defaults to currentConfig.
 */
function saveConfig(configToSave = currentConfig) {
    logInfo(`Saving configuration to ${CONFIG_FILE}...`);
    try {
        // Create a version without potentially sensitive env-only vars if needed
        const dataToSave = { ...configToSave };
        // Remove keys that are typically only in .env if you want to keep the json clean
        // delete dataToSave.apiKey; // Example: Don't save API key derived from .env to json

        const configString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
        fs.writeFileSync(CONFIG_FILE, configString, "utf8");
        logInfo(`Configuration saved successfully to ${CONFIG_FILE}`);
    } catch (err) {
        logError(`Error saving config file ${CONFIG_FILE}`, err);
    }
}

/**
 * Returns the currently loaded configuration object.
 * @returns {object} The configuration object.
 */
function getConfig() {
    return currentConfig;
}

// Load config when module is required
loadConfig();

module.exports = {
    loadConfig,
    saveConfig,
    getConfig,
    CONFIG_FILE
};
