const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const express = require("express");
const { getConfig } = require("./config");
const { logInfo, logError, logWarn } = require("./logger");
const { startPolling, stopPolling } = require("./poller");
const { enqueueMessage, startQueueProcessing, stopQueueProcessing } = require("./queue");
const { supabase } = require("./supabase"); // Import supabase client for heartbeat

// --- Main Application Logic ---

async function main() {
    logInfo("Starting Mac Agent...");
    const config = getConfig();

    // --- Initialize Modules ---
    // Config is loaded automatically when required
    // Logger is initialized automatically when required
    // Supabase client is initialized automatically when required

    if (!supabase) {
        logError("Supabase client failed to initialize. Check .env configuration. Agent cannot fully operate.");
        // Decide if we should exit or continue with limited functionality
        // For now, we continue, but Supabase interactions will fail.
    }

    // --- Setup Express App ---
    const app = express();
    app.use(express.json()); // Middleware to parse JSON bodies

    // --- API Key Authentication Middleware ---
    app.use((req, res, next) => {
        const apiKey = req.headers["x-api-key"] || req.query.apiKey;
        if (!config.apiKey) {
            logWarn("API Key is not configured. Endpoint is unsecured!");
            return next(); // Allow request but log warning
        }
        if (!apiKey || apiKey !== config.apiKey) {
            logWarn(`Unauthorized access attempt to ${req.path}. Invalid or missing API Key.`);
            return res.status(401).json({ error: "Unauthorized" });
        }
        next();
    });

    // --- API Endpoints ---
    app.post("/send-message", (req, res) => {
        logInfo("Received POST request on /send-message");
        const { fan_phone_number, message_text, media_url, creator_id, outbound_message_id } = req.body;

        // Basic validation
        if (!fan_phone_number || (!message_text && !media_url) || !creator_id || !outbound_message_id) {
            logWarn("Invalid request body for /send-message:", req.body);
            return res.status(400).json({
                error: "Missing required fields: fan_phone_number, creator_id, outbound_message_id, and at least one of message_text or media_url."
            });
        }

        // Assume outbound_message_id refers to an existing record in Supabase
        // Enqueue the message for sending
        try {
            enqueueMessage(outbound_message_id, fan_phone_number, message_text || "", media_url || null);
            logInfo(`Message ID ${outbound_message_id} enqueued for sending to ${fan_phone_number}.`);
            res.status(202).json({ status: "accepted", messageId: outbound_message_id });
        } catch (error) {
            logError(`Error enqueuing message ID ${outbound_message_id}: ${error.message}`, error);
            res.status(500).json({ error: "Internal server error while queueing message." });
        }
    });

    // --- Load HTTPS Certificates ---
    const certsDir = path.resolve(__dirname, "../certs");
    const keyPath = path.join(certsDir, "key.pem");
    const certPath = path.join(certsDir, "cert.pem");

    let httpsOptions;
    try {
        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            logError(`Certificate files not found in ${certsDir}. Cannot start HTTPS server.`);
            logError("Please generate self-signed certificates (key.pem, cert.pem) or provide valid ones.");
            // In a real scenario, might generate self-signed certs here if they don't exist
            process.exit(1); // Exit if certs are missing
        }
        httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
        logInfo("HTTPS certificates loaded successfully.");
    } catch (err) {
        logError("Error reading certificate files:", err);
        process.exit(1);
    }

    // --- Create and Start HTTPS Server ---
    const server = https.createServer(httpsOptions, app);
    const port = config.port;

    server.listen(port, "0.0.0.0", () => {
        logInfo(`Mac Agent HTTPS server listening on https://0.0.0.0:${port}`);
        logInfo(`Ensure firewall allows connections to port ${port}.`);

        // --- Start Background Processes ---
        logInfo("Starting iMessage poller...");
        startPolling();

        logInfo("Starting message queue processor...");
        startQueueProcessing();

        // --- Start Heartbeat ---
        if (supabase && config.heartbeatInterval > 0) {
            logInfo(`Starting Supabase heartbeat every ${config.heartbeatInterval / 1000}s.`);
            const vmId = os.hostname() || "unknown-vm"; // Basic VM identifier
            const agentVersion = require("../package.json").version || "unknown";

            const sendHeartbeat = async () => {
                try {
                    // Assuming a table named 'agent_heartbeats' with columns: vm_id, last_seen, agent_version
                    const { error } = await supabase
                        .from("agent_heartbeats")
                        .upsert({ vm_id: vmId, last_seen: new Date().toISOString(), agent_version: agentVersion }, { onConflict: "vm_id" });

                    if (error) {
                        logWarn(`Failed to send heartbeat to Supabase: ${error.message}`);
                    } else {
                        // logInfo("Heartbeat sent successfully."); // Can be noisy
                    }
                } catch (err) {
                    logError("Error during heartbeat function:", err);
                }
            };

            sendHeartbeat(); // Initial heartbeat
            setInterval(sendHeartbeat, config.heartbeatInterval);
        }
    });

    server.on("error", (err) => {
        logError(`Server error: ${err.message}`, err);
        if (err.code === "EADDRINUSE") {
            logError(`Port ${port} is already in use. Is another instance running?`);
        }
        process.exit(1);
    });

    // --- Graceful Shutdown Handling ---
    const shutdown = (signal) => {
        logInfo(`Received ${signal}. Shutting down Mac Agent gracefully...`);
        server.close(() => {
            logInfo("HTTPS server closed.");
            stopPolling();
            stopQueueProcessing();
            // Add any other cleanup tasks here
            logInfo("Mac Agent shut down complete.");
            process.exit(0);
        });

        // Force shutdown after a timeout
        setTimeout(() => {
            logError("Graceful shutdown timed out. Forcing exit.");
            process.exit(1);
        }, 10000); // 10 seconds timeout
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

}

// --- Run the Agent ---
main().catch(err => {
    logError("Unhandled error during agent startup:", err);
    process.exit(1);
});

// --- Service Installation (using node-mac - requires macOS) ---
/*
// This part should be run separately, perhaps via a setup script or command.
// It requires the 'node-mac' package, which is macOS-only.

const Service = require("node-mac").Service;

// Create a new service object
const svc = new Service({
  name: "Mac Agent",
  description: "Node.js bridge between Supabase and iMessage.",
  script: path.resolve(__dirname, "agent.js"), // Path to the main script
  nodeOptions: [
    // Add any Node.js options if needed
  ],
  // Optional: Specify working directory, environment variables, etc.
  // workingDirectory: path.resolve(__dirname, ".."),
  // env: {
  //   name: "NODE_ENV",
  //   value: "production"
  // }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on("install", function () {
  logInfo("Mac Agent service installed.");
  svc.start();
  logInfo("Mac Agent service started.");
});

// Listen for the "uninstall" event so we know when it
// is no longer installed.
svc.on("uninstall", function () {
  logInfo("Mac Agent service uninstalled.");
});

// Listen for "alreadyinstalled" event
svc.on("alreadyinstalled", function(){
    logWarn("Mac Agent service is already installed.");
});

// Listen for "invalidinstallation" event
svc.on("invalidinstallation", function(){
    logError("Mac Agent service installation is invalid.");
});

// Install the service.
// To run: node src/agent.js --install
// To uninstall: node src/agent.js --uninstall

if (process.argv.includes("--install")) {
    logInfo("Attempting to install Mac Agent service...");
    svc.install();
} else if (process.argv.includes("--uninstall")) {
    logInfo("Attempting to uninstall Mac Agent service...");
    svc.uninstall();
} else {
    // If not installing/uninstalling, run the main application logic
    main().catch(err => {
        logError("Unhandled error during agent startup:", err);
        process.exit(1);
    });
}
*/

