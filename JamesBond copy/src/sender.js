const applescript = require("applescript");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const { downloadMedia, updateOutboundMessageStatus } = require("./supabase");
const { logInfo, logError } = require("./logger"); // Assuming a logger utility

const TEMP_DOWNLOAD_DIR = path.join(os.tmpdir(), "mac-agent-downloads");

/**
 * Executes an AppleScript string.
 * @param {string} script - The AppleScript code to execute.
 * @returns {Promise<string>} - The result of the script execution.
 * @throws {Error} - If the script execution fails.
 */
function executeAppleScript(script) {
    return new Promise((resolve, reject) => {
        applescript.execString(script, (err, result) => {
            if (err) {
                logError(`AppleScript execution failed: ${err.message}`, err);
                // Provide more context if possible
                let detailedError = err.message;
                if (detailedError.includes("Application isn't running")) {
                    detailedError = "Messages application is not running.";
                } else if (detailedError.includes("permission denied")) {
                    detailedError = "Permission denied. Check Automation/Accessibility settings for Messages.";
                } else if (detailedError.includes("Invalid receiver") || detailedError.includes("buddy id") || detailedError.includes("doesn\u2019t understand the \"send\" message")) {
                    detailedError = `Invalid recipient or service issue. Ensure contact exists, number is correct, and Messages can send to them.`;
                }
                reject(new Error(`AppleScript Error: ${detailedError}`));
            } else {
                logInfo("AppleScript executed successfully.");
                resolve(result);
            }
        });
    });
}

/**
 * Sends a message via the macOS Messages app using AppleScript.
 * Handles text and optional media attachments.
 *
 * @param {string} recipient - The recipient's phone number (E.164 format recommended) or Apple ID.
 * @param {string} text - The message text.
 * @param {string|null} mediaUrl - Optional URL of the media to attach.
 * @param {string|number} messageId - The ID of the outbound message record in Supabase for status updates.
 * @returns {Promise<{success: boolean, status: string, error?: string}>} - Result indicating success or failure.
 */
async function sendMessage(recipient, text, mediaUrl, messageId) {
    logInfo(`Attempting to send message ID ${messageId} to ${recipient}. Media URL: ${mediaUrl || 'None'}`);
    let localMediaPath = null;
    let script = '';
    let finalStatus = 'error'; // Default status
    let errorMessage = null;

    try {
        // Update status to sending
        await updateOutboundMessageStatus(messageId, 'sending');

        // Ensure temp directory exists for downloads
        await fs.ensureDir(TEMP_DOWNLOAD_DIR);

        // Escape double quotes and backslashes in the text message for AppleScript
        const escapedText = text ? text.replace(/\\/g, '\\\\').replace(/"/g, '\"') : '';

        // 1. Download media if URL is provided
        if (mediaUrl) {
            logInfo(`Downloading media for message ${messageId} from ${mediaUrl}`);
            await updateOutboundMessageStatus(messageId, 'downloading_media');
            
            localMediaPath = await downloadMedia(mediaUrl, TEMP_DOWNLOAD_DIR);
            if (!localMediaPath) {
                throw new Error("Failed to download media.");
            }
            logInfo(`Media downloaded to temporary path: ${localMediaPath}`);
            // Ensure the path is usable in AppleScript (POSIX path)
            const posixPath = localMediaPath.replace(/\//g, "/"); // Should already be POSIX on macOS/Linux

            // 2. Construct AppleScript for message with attachment
            // Note: Sending text *with* an attachment in one command can be unreliable.
            // It's often better to send the attachment, then the text (if any).
            script = `
                tell application "Messages"
                    set targetBuddy to "${recipient}"
                    set targetService to id of 1st service whose service type = iMessage
                    try
                        set theBuddy to buddy targetBuddy of service id targetService
                    on error -- If buddy doesn't exist, try participant
                        try
                           set theBuddy to participant targetBuddy of service id targetService
                        on error errMsg number errNum
                           error "AppleScript Error: Cannot find recipient '" & targetBuddy & "'. Ensure contact exists or number is correct. Original error: " & errMsg
                        end try
                    end try
                    set theAttachment to POSIX file "${posixPath}"
                    send theAttachment to theBuddy
                end tell
            `;
            logInfo(`Executing AppleScript for attachment for message ${messageId}...`);
            await executeAppleScript(script);
            logInfo(`Attachment sent successfully for message ${messageId}.`);

            // If there's text, send it separately after a short delay
            if (escapedText) {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 seconds
                logInfo(`Sending text part for message ${messageId}...`);
                script = `
                    tell application "Messages"
                        set targetBuddy to "${recipient}"
                        set targetService to id of 1st service whose service type = iMessage
                        try
                            set theBuddy to buddy targetBuddy of service id targetService
                        on error
                            try
                               set theBuddy to participant targetBuddy of service id targetService
                            on error errMsg number errNum
                               error "AppleScript Error: Cannot find recipient '" & targetBuddy & "' for text part. Original error: " & errMsg
                            end try
                        end try
                        send "${escapedText}" to theBuddy
                    end tell
                `;
                await executeAppleScript(script);
                logInfo(`Text part sent successfully for message ${messageId}.`);
            }

        } else if (escapedText) {
            // 3. Construct AppleScript for text-only message
            script = `
                tell application "Messages"
                    set targetBuddy to "${recipient}"
                    set targetService to id of 1st service whose service type = iMessage
                    try
                        set theBuddy to buddy targetBuddy of service id targetService
                    on error
                        try
                           set theBuddy to participant targetBuddy of service id targetService
                        on error errMsg number errNum
                           error "AppleScript Error: Cannot find recipient '" & targetBuddy & "'. Ensure contact exists or number is correct. Original error: " & errMsg
                        end try
                    end try
                    send "${escapedText}" to theBuddy
                end tell
            `;
            logInfo(`Executing AppleScript for text message ${messageId}...`);
            await executeAppleScript(script);
            logInfo(`Text message sent successfully for message ${messageId}.`);
        } else {
            // No text and no media - nothing to send
            throw new Error("Cannot send message: No text or media URL provided.");
        }

        // 4. If script execution succeeded, mark as 'sent'
        finalStatus = 'sent';
        logInfo(`Message ${messageId} marked as 'sent' after successful AppleScript execution.`);

    } catch (error) {
        logError(`Failed to send message ${messageId}: ${error.message}`, error);
        finalStatus = 'error';
        errorMessage = error.message;
    } finally {
        // 5. Clean up downloaded media file if it exists
        if (localMediaPath) {
            fs.unlink(localMediaPath).catch(e => logError(`Error deleting temporary media file ${localMediaPath}: ${e.message}`));
        }

        // 6. Update Supabase status
        logInfo(`Updating Supabase status for message ${messageId} to '${finalStatus}'. Error: ${errorMessage || 'None'}`);
        await updateOutboundMessageStatus(messageId, finalStatus, errorMessage);
    }

    return {
        success: finalStatus === 'sent',
        status: finalStatus,
        error: errorMessage
    };
}

module.exports = {
    sendMessage
};
