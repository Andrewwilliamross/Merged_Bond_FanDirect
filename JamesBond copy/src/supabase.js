require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env file');
    // In a real app, you might want to exit or throw an error
    // For now, we'll log and proceed, but the client will be null.
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Inserts a new inbound message into the Supabase 'inbound_messages' table.
 * @param {object} messageData - The message data to insert.
 * @returns {Promise<object|null>} - The inserted data or null on error.
 */
async function insertInboundMessage(messageData) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('inbound_messages')
            .insert([messageData])
            .select();

        if (error) {
            console.error('Error inserting inbound message:', error);
            return null;
        }
        console.log('Inbound message inserted:', data);
        return data;
    } catch (err) {
        console.error('Supabase client error (insertInboundMessage):', err);
        return null;
    }
}

/**
 * Updates the status of an outbound message in the Supabase 'outbound_messages' table.
 * @param {string|number} messageId - The ID of the message to update.
 * @param {string} status - The new status ('sent', 'delivered', 'error').
 * @param {string} [errorMessage] - Optional error message if status is 'error'.
 * @returns {Promise<object|null>} - The updated data or null on error.
 */
async function updateOutboundMessageStatus(messageId, status, errorMessage = null) {
    if (!supabase) return null;
    try {
        const updateData = { status };
        if (status === 'error' && errorMessage) {
            updateData.error_message = errorMessage;
        }

        const { data, error } = await supabase
            .from('outbound_messages')
            .update(updateData)
            .eq('id', messageId) // Assuming 'id' is the primary key
            .select();

        if (error) {
            console.error(`Error updating outbound message ${messageId} status:`, error);
            return null;
        }
        console.log(`Outbound message ${messageId} status updated to ${status}:`, data);
        return data;
    } catch (err) {
        console.error('Supabase client error (updateOutboundMessageStatus):', err);
        return null;
    }
}

/**
 * Downloads media from a URL to a temporary local path.
 * @param {string} mediaUrl - The URL of the media to download.
 * @param {string} tempDir - The directory to save the temporary file.
 * @returns {Promise<string|null>} - The local path to the downloaded file or null on error.
 */
async function downloadMedia(mediaUrl, tempDir = '/tmp') {
    try {
        const response = await axios({
            method: 'get',
            url: mediaUrl,
            responseType: 'stream',
        });

        // Ensure temp directory exists
        await fs.ensureDir(tempDir);

        // Extract filename or generate one
        const urlParts = new URL(mediaUrl);
        const filename = path.basename(urlParts.pathname) || `media_${Date.now()}`;
        const tempFilePath = path.join(tempDir, filename);

        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(tempFilePath));
            writer.on('error', (err) => {
                console.error('Error writing downloaded media file:', err);
                fs.unlink(tempFilePath).catch(e => console.error('Error deleting temp file:', e)); // Clean up partial file
                reject(null);
            });
            response.data.on('error', (err) => {
                 console.error('Error downloading media stream:', err);
                 writer.close();
                 fs.unlink(tempFilePath).catch(e => console.error('Error deleting temp file:', e));
                 reject(null);
            });
        });
    } catch (error) {
        console.error('Error downloading media:', error.message);
        if (error.response) {
            console.error('Download error details:', error.response.status, error.response.statusText);
        }
        return null;
    }
}

/**
 * Uploads a local file to Supabase Storage.
 * @param {string} localPath - The path to the local file.
 * @param {string} storagePath - The desired path in Supabase Storage (e.g., 'attachments/image.png').
 * @returns {Promise<string|null>} - The public URL of the uploaded file or null on error.
 */
async function uploadMediaToStorage(localPath, storagePath) {
    if (!supabase) return null;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucketName) {
        console.error('Error: SUPABASE_STORAGE_BUCKET must be defined in .env file');
        return null;
    }

    try {
        const fileContent = await fs.readFile(localPath);
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileContent, {
                cacheControl: '3600',
                upsert: true, // Overwrite if exists
                // Determine content type automatically or set explicitly if needed
            });

        if (error) {
            console.error('Error uploading media to Supabase Storage:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

        console.log(`Media uploaded to ${storagePath}, URL: ${urlData.publicUrl}`);
        return urlData.publicUrl;

    } catch (err) {
        console.error('Supabase client error (uploadMediaToStorage):', err);
        return null;
    } finally {
        // Clean up the temporary local file after upload attempt
        fs.unlink(localPath).catch(e => console.error('Error deleting temp file after upload:', e));
    }
}

/**
 * Fetches the fan_creator_mappings from Supabase.
 * @returns {Promise<object|null>} - An object mapping fan phone numbers to creator IDs, or null on error.
 */
async function getFanCreatorMappings() {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('fan_creator_mappings')
            .select('fan_phone_number, creator_id');

        if (error) {
            console.error('Error fetching fan-creator mappings:', error);
            return null;
        }

        // Convert array to a map for quick lookup
        const mapping = data.reduce((acc, item) => {
            acc[item.fan_phone_number] = item.creator_id;
            return acc;
        }, {});

        console.log('Fan-creator mappings loaded.');
        return mapping;
    } catch (err) {
        console.error('Supabase client error (getFanCreatorMappings):', err);
        return null;
    }
}

module.exports = {
    insertInboundMessage,
    updateOutboundMessageStatus,
    downloadMedia,
    uploadMediaToStorage,
    getFanCreatorMappings,
    supabase // Export client directly if needed elsewhere
};
