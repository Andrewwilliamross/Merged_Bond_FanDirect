const { sendMessage } = require("./sender");
const { updateOutboundMessageStatus } = require("./supabase");
const { getConfig } = require("./config");
const { logInfo, logError, logWarn } = require("./logger");

// --- Queue State ---
let messageQueue = []; // Stores { messageId, recipient, text, mediaUrl, attempts: 0, retryDelay: 0, addedAt: Date.now() }
let isProcessing = false;
let lastSentTimestamp = 0;
let queueIntervalId = null;

// --- Configuration ---
const BASE_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

/**
 * Adds a message sending task to the queue.
 * @param {string|number} messageId - The Supabase ID of the outbound message.
 * @param {string} recipient - The recipient phone number/Apple ID.
 * @param {string} text - The message text.
 * @param {string|null} mediaUrl - Optional media URL.
 */
function enqueueMessage(messageId, recipient, text, mediaUrl) {
    logInfo(`Enqueueing message ID ${messageId} for ${recipient}`);
    
    // Update message status to processing in Supabase
    updateOutboundMessageStatus(messageId, 'processing')
        .catch(err => logError(`Failed to update message ${messageId} status to processing: ${err.message}`));
    
    messageQueue.push({
        messageId,
        recipient,
        text,
        mediaUrl,
        attempts: 0,
        retryDelay: 0,
        addedAt: Date.now()
    });

    // If not currently processing, start immediately
    if (!isProcessing) {
        processQueue();
    }
}

/**
 * Processes the next message in the queue if rate limit allows.
 */
async function processQueue() {
    if (isProcessing) return; // Already processing
    if (messageQueue.length === 0) {
        logInfo("Queue is empty. Stopping processor until new message arrives.");
        stopQueueProcessing(); // Stop interval if queue is empty
        return;
    }

    isProcessing = true;
    const config = getConfig();
    const rateLimit = config.rateLimit || 10000; // Default 10 seconds
    const now = Date.now();
    const timeSinceLastSend = now - lastSentTimestamp;

    if (timeSinceLastSend < rateLimit) {
        const waitTime = rateLimit - timeSinceLastSend;
        logInfo(`Rate limit active. Waiting ${waitTime}ms before next send.`);
        isProcessing = false; // Allow the interval timer to try again
        // Reschedule the check slightly after the rate limit expires
        if (!queueIntervalId) { // Ensure interval is running if we hit rate limit
             startQueueProcessing(waitTime + 50); // Start with a delay
        }
        return;
    }

    // Find the next message to process (prioritize ready retries or oldest message)
    let messageIndex = -1;
    let taskToProcess = null;

    // Check for messages ready for retry first
    messageIndex = messageQueue.findIndex(task => task.retryDelay > 0 && (task.addedAt + task.retryDelay) <= now);

    // If no retries ready, take the oldest message (FIFO)
    if (messageIndex === -1) {
        messageIndex = messageQueue.findIndex(task => task.retryDelay === 0);
    }

    if (messageIndex !== -1) {
        taskToProcess = messageQueue.splice(messageIndex, 1)[0]; // Remove from queue
    } else {
        // No messages ready (e.g., all are waiting for retry delays)
        logInfo("No messages ready to send currently (likely waiting on retry delays).");
        isProcessing = false;
        if (!queueIntervalId) { // Ensure interval is running
             startQueueProcessing();
        }
        return;
    }

    logInfo(`Processing message ID ${taskToProcess.messageId} (Attempt ${taskToProcess.attempts + 1})`);
    lastSentTimestamp = now; // Mark send time *before* async operation

    try {
        // Update status to retrying if this is a retry attempt
        if (taskToProcess.attempts > 0) {
            await updateOutboundMessageStatus(taskToProcess.messageId, 'retrying', `Retry attempt ${taskToProcess.attempts + 1}`);
        }

        // Call the sender function (which handles its own Supabase updates for final status)
        const result = await sendMessage(
            taskToProcess.recipient,
            taskToProcess.text,
            taskToProcess.mediaUrl,
            taskToProcess.messageId
        );

        if (!result.success) {
            // sendMessage failed, schedule a retry if attempts < MAX_RETRIES
            handleSendFailure(taskToProcess, result.error);
        } else {
            logInfo(`Message ID ${taskToProcess.messageId} sent successfully.`);
            // Success is handled by sendMessage updating Supabase
        }
    } catch (error) {
        // Catch unexpected errors from sendMessage itself
        logError(`Unexpected error processing message ID ${taskToProcess.messageId}: ${error.message}`, error);
        handleSendFailure(taskToProcess, error.message || "Unknown processing error");
    }

    // Ready to process the next item (if any)
    isProcessing = false;
    // Immediately try processing the next item rather than waiting for interval
    // Use setImmediate or process.nextTick to avoid blocking event loop / deep stacks
    setImmediate(processQueue);
}

/**
 * Handles failures, schedules retries, or marks as final error.
 * @param {object} task - The message task that failed.
 * @param {string} errorMessage - The error message.
 */
async function handleSendFailure(task, errorMessage) {
    task.attempts += 1;
    logWarn(`Send failed for message ID ${task.messageId} (Attempt ${task.attempts}). Error: ${errorMessage}`);

    if (task.attempts >= MAX_RETRIES) {
        logError(`Message ID ${task.messageId} failed after ${MAX_RETRIES} attempts. Marking as error in Supabase.`);
        await updateOutboundMessageStatus(task.messageId, 'error', `Failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
    } else {
        // Calculate next retry delay (5s -> 15s -> 30s)
        switch (task.attempts) {
            case 1: task.retryDelay = 5000; break;  // Wait 5s after 1st failure
            case 2: task.retryDelay = 15000; break; // Wait 15s after 2nd failure
            case 3: task.retryDelay = 30000; break; // Wait 30s after 3rd failure (this attempt will be the last)
            default: task.retryDelay = 30000; // Should not happen with MAX_RETRIES=3
        }

        task.addedAt = Date.now(); // Reset addedAt to calculate delay from now
        logInfo(`Scheduling retry ${task.attempts} for message ID ${task.messageId} in ${task.retryDelay / 1000}s.`);
        
        // Update status to waiting_retry
        await updateOutboundMessageStatus(
            task.messageId, 
            'waiting_retry', 
            `Retry ${task.attempts} scheduled in ${task.retryDelay / 1000}s. Previous error: ${errorMessage}`
        );
        
        // Add back to the queue for retry
        messageQueue.push(task);
        // Sort to prioritize older messages
        messageQueue.sort((a, b) => a.addedAt - b.addedAt);
    }
}

/**
 * Starts the queue processing interval.
 * @param {number} initialDelay - Optional delay before the first execution.
 */
function startQueueProcessing(initialDelay = 1000) { // Check every second by default
    if (queueIntervalId) {
        logWarn("Queue processing interval already running.");
        return;
    }
    logInfo(`Starting queue processor interval (check every ${initialDelay}ms initially, then 1000ms).`);
    // Use setTimeout for the first run if delayed, then setInterval
    setTimeout(() => {
        processQueue(); // Run once
        if (!queueIntervalId) { // Check again in case it was stopped
             queueIntervalId = setInterval(processQueue, 1000); // Then check every second
        }
    }, initialDelay);
}

/**
 * Stops the queue processing interval.
 */
function stopQueueProcessing() {
    if (queueIntervalId) {
        clearInterval(queueIntervalId);
        queueIntervalId = null;
        logInfo("Queue processor interval stopped.");
    }
    isProcessing = false; // Ensure processing stops
}

module.exports = {
    enqueueMessage,
    startQueueProcessing,
    stopQueueProcessing
};
