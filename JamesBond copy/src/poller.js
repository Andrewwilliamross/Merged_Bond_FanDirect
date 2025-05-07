const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const { insertInboundMessage, uploadMediaToStorage, getFanCreatorMappings } = require("./supabase");
const { getConfig } = require("./config"); // Assuming config.js provides getConfig()
const { logInfo, logError } = require("./logger"); // Assuming a logger utility

// --- Configuration ---
const config = getConfig();
const DB_PATH = config.chatDbPath;
const TEMP_ATTACHMENT_DIR = path.join(os.tmpdir(), "mac-agent-attachments");
let fanCreatorMap = {}; // In-memory cache
let lastMessageROWID = 0; // Track the last processed message ROWID
let isPolling = false;
let pollIntervalId = null;

// --- Helper Functions ---

/**
 * Converts Apple Core Data timestamp (seconds since 2001-01-01 UTC) to ISO 8601 string.
 * @param {number} appleTimestamp - The Apple Core Data timestamp.
 * @returns {string} - ISO 8601 formatted date string.
 */
function convertAppleTimestamp(appleTimestamp) {
    const APPLE_EPOCH_OFFSET = 978307200; // Seconds between Unix epoch and Apple epoch (2001-01-01)
    const unixTimestamp = appleTimestamp + APPLE_EPOCH_OFFSET;
    return new Date(unixTimestamp * 1000).toISOString();
}

/**
 * Fetches and updates the fan-creator mapping cache.
 */
async function refreshFanCreatorMap() {
    logInfo("Refreshing fan-creator mapping...");
    const mapping = await getFanCreatorMappings();
    if (mapping) {
        fanCreatorMap = mapping;
        logInfo(`Fan-creator map refreshed. ${Object.keys(fanCreatorMap).length} mappings loaded.`);
    } else {
        logError("Failed to refresh fan-creator map from Supabase.");
    }
}

/**
 * Processes a single message row retrieved from the database.
 * @param {object} row - The message row data from SQLite.
 */
async function processMessage(row) {
    const fanPhoneNumber = row.handle_id; // handle.id is usually the phone number/email
    const creatorId = fanCreatorMap[fanPhoneNumber];

    if (!creatorId) {
        logInfo(`No creator mapping found for sender: ${fanPhoneNumber}. Skipping message ROWID: ${row.message_ROWID}`);
        return; // Skip if no mapping exists
    }

    let attachmentUrl = null;
    if (row.attachment_filename) {
        // Attachment paths in chat.db are relative to ~/Library/Messages/
        const fullAttachmentPath = path.join(os.homedir(), "Library", "Messages", row.attachment_filename);
        logInfo(`Found attachment for message ${row.message_ROWID}: ${fullAttachmentPath}`);

        if (await fs.pathExists(fullAttachmentPath)) {
            try {
                // Ensure temp dir exists
                await fs.ensureDir(TEMP_ATTACHMENT_DIR);
                const tempFileName = `${Date.now()}_${path.basename(row.attachment_filename)}`;
                const tempPath = path.join(TEMP_ATTACHMENT_DIR, tempFileName);

                // Copy to temp location before upload
                await fs.copy(fullAttachmentPath, tempPath);
                logInfo(`Copied attachment to temp path: ${tempPath}`);

                // Define storage path (e.g., creator_id/timestamp_filename)
                const storagePath = `${creatorId}/attachments/${tempFileName}`;

                // Upload to Supabase Storage
                attachmentUrl = await uploadMediaToStorage(tempPath, storagePath);

                if (attachmentUrl) {
                    logInfo(`Attachment uploaded for message ${row.message_ROWID}. URL: ${attachmentUrl}`);
                } else {
                    logError(`Failed to upload attachment for message ${row.message_ROWID} from path: ${tempPath}`);
                }
                // uploadMediaToStorage should handle deleting the temp file
            } catch (uploadError) {
                logError(`Error processing attachment for message ${row.message_ROWID}: ${uploadError.message}`, uploadError);
            }
        } else {
            logError(`Attachment file not found for message ${row.message_ROWID} at path: ${fullAttachmentPath}`);
        }
    }

    const messageData = {
        fan_phone_number: fanPhoneNumber,
        creator_id: creatorId,
        message_text: row.message_text,
        attachment_url: attachmentUrl,
        apple_id: row.handle_id, // Using handle_id as apple_id for now
        created_at: convertAppleTimestamp(row.message_date), // Convert timestamp
        conversation_id: row.chat_guid, // Use chat GUID as conversation ID
        // Add any other relevant fields from your Supabase table schema
    };

    logInfo(`Inserting inbound message to Supabase for ROWID: ${row.message_ROWID}`);
    const inserted = await insertInboundMessage(messageData);
    if (!inserted) {
        logError(`Failed to insert inbound message to Supabase for ROWID: ${row.message_ROWID}`);
    }
}

/**
 * Polls the iMessage database for new messages.
 */
async function pollMessages() {
    if (!fs.existsSync(DB_PATH)) {
        logError(`iMessage database not found at ${DB_PATH}. Ensure Messages app is set up and permissions are granted.`);
        return;
    }

    let db;
    try {
        // Open DB in read-only mode
        db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
        logInfo(`Polling iMessage DB (Last ROWID: ${lastMessageROWID})...`);

        // Query for new incoming messages since the last poll
        // IMPORTANT: Adjust table/column names if they differ in your macOS version
        const query = `
            SELECT
                m.ROWID as message_ROWID,
                m.text as message_text,
                m.handle_id as message_handle_id,
                m.date as message_date,
                h.id as handle_id, -- Phone number or email
                c.guid as chat_guid,
                att.filename as attachment_filename,
                att.mime_type as attachment_mime_type
            FROM message m
            JOIN handle h ON m.handle_id = h.ROWID
            JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
            JOIN chat c ON cmj.chat_id = c.ROWID
            LEFT JOIN message_attachment_join maj ON m.ROWID = maj.message_id
            LEFT JOIN attachment att ON maj.attachment_id = att.ROWID
            WHERE m.is_from_me = 0
              AND m.ROWID > ?
            ORDER BY m.ROWID ASC;
        `;

        const rows = db.prepare(query).all(lastMessageROWID);

        if (rows.length > 0) {
            logInfo(`Found ${rows.length} new incoming message(s).`);
            for (const row of rows) {
                try {
                    await processMessage(row);
                    lastMessageROWID = row.message_ROWID; // Update last ROWID *after* successful processing attempt
                } catch (processingError) {
                    logError(`Error processing message ROWID ${row.message_ROWID}: ${processingError.message}`, processingError);
                    // Decide if you want to stop processing or skip to the next message
                }
            }
            logInfo(`Polling finished. Next poll in ${config.pollInterval / 1000}s. Last ROWID: ${lastMessageROWID}`);
        } else {
            // logInfo("No new incoming messages found.");
        }

    } catch (error) {
        logError(`Error polling iMessage database: ${error.message}`, error);
        // Handle specific errors like permission denied or DB locked
        if (error.code === "SQLITE_BUSY" || error.code === "SQLITE_IOERR_LOCK") {
            logError("Database is busy/locked. Retrying later.");
        }
        if (error.code === "SQLITE_READONLY" || error.message.includes("permission denied")) {
             logError("Permission denied accessing chat.db. Ensure Full Disk Access is granted.");
             // Consider stopping polling if permissions are permanently denied
             // stopPolling();
        }
    } finally {
        if (db) {
            db.close();
            // logInfo("Database connection closed.");
        }
    }
}

/**
 * Initializes the poller: fetches initial state and starts the interval.
 */
async function initializePoller() {
    logInfo("Initializing iMessage Poller...");
    await fs.ensureDir(TEMP_ATTACHMENT_DIR);
    await refreshFanCreatorMap(); // Initial load

    // Fetch the latest message ROWID on startup to avoid processing old messages
    let db;
    try {
        if (!fs.existsSync(DB_PATH)) {
             logError(`Initial check: iMessage database not found at ${DB_PATH}. Polling will not start until it exists.`);
             // Optionally, implement a retry mechanism or wait for the file
             return; // Don't start polling if DB doesn't exist
        }
        db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
        const stmt = db.prepare("SELECT MAX(ROWID) as max_rowid FROM message WHERE is_from_me = 0");
        const result = stmt.get();
        lastMessageROWID = result?.max_rowid || 0;
        logInfo(`Initialized poller. Starting poll from message ROWID: ${lastMessageROWID}`);
    } catch (error) {
        logError(`Error getting initial max ROWID from chat.db: ${error.message}`, error);
        logError("Polling will start from ROWID 0, potentially processing old messages if DB becomes available later.");
        // Decide if you want to prevent startup or proceed cautiously
    } finally {
        if (db) {
            db.close();
        }
    }
}

/**
 * Starts the polling process.
 */
async function startPolling() {
    if (isPolling) {
        logInfo("Polling is already running.");
        return;
    }

    await initializePoller(); // Fetch initial state before starting interval

    const interval = config.pollInterval || 10000; // Default 10 seconds

    // Run immediately first, then set interval
    logInfo(`Starting polling interval: ${interval / 1000} seconds.`);
    pollMessages(); // Initial poll
    pollIntervalId = setInterval(pollMessages, interval);

    // Periodically refresh the fan-creator map (e.g., every hour)
    setInterval(refreshFanCreatorMap, config.mapRefreshInterval || 3600000); // Default 1 hour

    isPolling = true;
}

/**
 * Stops the polling process.
 */
function stopPolling() {
    if (!isPolling) {
        logInfo("Polling is not running.");
        return;
    }
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
    isPolling = false;
    logInfo("Polling stopped.");
}

module.exports = {
    startPolling,
    stopPolling
};
