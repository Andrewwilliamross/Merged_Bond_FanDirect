# Mac Agent

Mac Agent is a Node.js application designed to run on macOS. It acts as a bridge between a Supabase backend and the local iMessage application, enabling programmatic sending and receiving of iMessages.

## Features

*   **Outbound Messaging**: Receives requests via a local HTTPS API endpoint to send iMessages (text and media) using AppleScript.
*   **Inbound Messaging**: Polls the local `chat.db` SQLite database to detect new incoming iMessages.
*   **Supabase Integration**: 
    *   Uploads incoming messages and media attachments to Supabase tables and storage.
    *   Updates the status of outbound messages in Supabase.
    *   Downloads media specified in outbound message requests.
    *   Fetches and caches fan-to-creator mappings from Supabase.
*   **Rate Limiting & Queuing**: Implements a queue with rate limiting (default 10 seconds per message) and retry logic for outbound messages.
*   **HTTPS Server**: Provides a secure local API endpoint (`/send-message`) protected by an API key.
*   **Configuration**: Uses a `.env` file and a local JSON configuration file (`~/.config/mac-agent/config.json`) for settings.
*   **Monitoring & Logging**: Logs activities and errors to `~/Library/Logs/MacAgent.log` and sends heartbeats to Supabase.
*   **Auto-Start (macOS Service)**: Includes functionality (using `node-mac`) to install/uninstall the agent as a macOS LaunchAgent for automatic startup.

## Prerequisites

*   **macOS**: This application is designed specifically for macOS and relies on macOS-specific features (Messages app, AppleScript, `chat.db`).
*   **Node.js**: Version 16 or later recommended.
*   **npm**: Node Package Manager (comes with Node.js).
*   **iMessage**: A configured and running Messages application on the macOS machine.
*   **Supabase Project**: A Supabase project with the necessary tables and storage bucket configured.
*   **Permissions**: The application requires specific macOS permissions:
    *   **Full Disk Access**: To read the `~/Library/Messages/chat.db` file.
    *   **Accessibility**: Potentially required for AppleScript interaction with Messages.
    *   **Automation**: To allow the script (or Terminal/Node) to control the Messages application via AppleScript.

## Setup & Installation

1.  **Clone the Repository**: 
    ```bash
    git clone <repository_url>
    cd mac-agent
    ```

2.  **Install Dependencies**: 
    ```bash
    npm install
    ```
    *Note: The `node-mac` dependency will only install successfully on macOS. Installation might show warnings or errors on other platforms, but the core logic can still be developed.* 

3.  **Configure Environment Variables**: Create a `.env` file in the project root directory (`mac-agent/`) with your Supabase credentials and a secure API key:
    ```dotenv
    # .env
    SUPABASE_URL=https://your-project-ref.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
    SUPABASE_STORAGE_BUCKET=your-storage-bucket-name
    API_KEY=your-secure-api-key-for-local-server
    
    # Optional Overrides (defaults are in src/config.js)
    # PORT=3000
    # POLL_INTERVAL=10000 # ms
    # MAP_REFRESH_INTERVAL=3600000 # ms
    # RATE_LIMIT=10000 # ms
    # HEARTBEAT_INTERVAL=60000 # ms
    ```

4.  **Generate HTTPS Certificates**: The agent requires `key.pem` and `cert.pem` files in the `certs/` directory to run the HTTPS server. For local development, you can generate self-signed certificates using OpenSSL:
    ```bash
    mkdir certs
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
      -keyout certs/key.pem -out certs/cert.pem -days 365 \
      -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
    ```
    *Note: Browsers will show warnings for self-signed certificates.*

5.  **Grant macOS Permissions**:
    *   Go to `System Settings > Privacy & Security > Full Disk Access`. Click `+`, navigate to `/Applications/Utilities/Terminal.app` (or your preferred terminal), and add it. If running as a service, you might need to add `node` or the specific application bundle.
    *   Go to `System Settings > Privacy & Security > Accessibility`. Add Terminal/Node if needed.
    *   Go to `System Settings > Privacy & Security > Automation`. Ensure Terminal/Node has permission to control `Messages.app`.
    *   *Permissions might need to be granted when the application first attempts to access these resources.* 

6.  **Configure Local JSON (Optional)**: The agent creates a configuration file at `~/.config/mac-agent/config.json`. You can manually edit this file to override default settings if you prefer not to use environment variables for non-sensitive options.

## Running the Agent

### Directly

You can run the agent directly from the terminal for testing or development:

```bash
npm start 
```

or

```bash
node src/agent.js
```

The agent will start, initialize the poller and queue, and listen for HTTPS requests on the configured port (default 3000).

### As a macOS Service (Recommended)

On a macOS machine where `node-mac` installed correctly, you can install the agent as a LaunchAgent service so it runs automatically in the background and restarts on login.

*   **Install Service**:
    ```bash
    sudo node src/agent.js --install
    ```
    *(Requires `sudo` to write the LaunchAgent plist file)*

*   **Uninstall Service**:
    ```bash
    sudo node src/agent.js --uninstall
    ```

*   **Service Logs**: When running as a service, standard output and errors might be redirected. Check the application log file (`~/Library/Logs/MacAgent.log`) for detailed information.

## Configuration Options

Configuration is loaded in the following order of precedence (higher overrides lower):

1.  **Environment Variables** (loaded from `.env` or system environment)
2.  **JSON Config File** (`~/.config/mac-agent/config.json`)
3.  **Default Values** (in `src/config.js`)

**Key Settings:**

*   `SUPABASE_URL` (.env): Your Supabase project URL.
*   `SUPABASE_SERVICE_ROLE_KEY` (.env): Your Supabase service role key (keep secure!).
*   `SUPABASE_STORAGE_BUCKET` (.env): The name of your Supabase storage bucket for attachments.
*   `API_KEY` (.env or config.json): Secret key to authenticate requests to the `/send-message` endpoint.
*   `port` (env `PORT` or config.json): Port for the local HTTPS server (default: 3000).
*   `pollInterval` (env `POLL_INTERVAL` or config.json): How often (in ms) to check `chat.db` for new messages (default: 10000).
*   `mapRefreshInterval` (env `MAP_REFRESH_INTERVAL` or config.json): How often (in ms) to refresh the fan-creator mapping from Supabase (default: 3600000 / 1 hour).
*   `rateLimit` (env `RATE_LIMIT` or config.json): Minimum time (in ms) between sending outbound messages (default: 10000).
*   `heartbeatInterval` (env `HEARTBEAT_INTERVAL` or config.json): How often (in ms) to send a heartbeat to Supabase (default: 60000).

## API Endpoint

### `POST /send-message`

Accepts a JSON body to enqueue an outbound message.

*   **Method**: `POST`
*   **URL**: `https://localhost:PORT/send-message` (replace `PORT` with configured port, e.g., 3000)
*   **Authentication**: Requires an API key passed either in the `x-api-key` header or as a `apiKey` query parameter.
*   **Body (JSON)**:
    ```json
    {
      "outbound_message_id": "unique_id_from_supabase_outbound_table",
      "fan_phone_number": "+1xxxxxxxxxx", // E.164 format recommended
      "message_text": "Hello from the agent!", // Optional if media_url is present
      "media_url": "https://example.com/image.png", // Optional URL for image/video
      "creator_id": "creator_uuid_or_id"
    }
    ```
*   **Success Response (202 Accepted)**:
    ```json
    {
      "status": "accepted",
      "messageId": "unique_id_from_supabase_outbound_table"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing or invalid fields in the request body.
    *   `401 Unauthorized`: Missing or incorrect API key.
    *   `500 Internal Server Error`: Error during processing or queueing.

## Supabase Setup

This agent assumes the following Supabase setup:

*   **Tables**:
    *   `outbound_messages`: Stores messages to be sent. Must have at least `id`, `status` (`pending`, `sent`, `error`), `error_message` columns. The agent receives the `id` in the POST request and updates `status` and `error_message`.
    *   `inbound_messages`: Stores received messages. The agent inserts records with fields like `fan_phone_number`, `creator_id`, `message_text`, `attachment_url`, `apple_id`, `created_at`, `conversation_id`.
    *   `fan_creator_mappings`: Maps fan phone numbers (`fan_phone_number`) to creator IDs (`creator_id`). Used to associate incoming messages with the correct creator.
    *   `agent_heartbeats`: (Optional but recommended) Used for monitoring. Should have `vm_id` (text, primary key), `last_seen` (timestampz), `agent_version` (text).
*   **Storage**: A bucket (name specified in `SUPABASE_STORAGE_BUCKET`) for storing media attachments from inbound messages.

## Logging

Logs are written to `~/Library/Logs/MacAgent.log`. This includes:
*   Server startup and shutdown.
*   Incoming/outgoing message processing.
*   Polling status.
*   Queue activity.
*   Supabase interactions.
*   Errors and warnings.

## Limitations

*   **macOS Only**: Cannot run on Windows or Linux due to reliance on AppleScript and Messages database format.
*   **Permissions**: Requires careful setup of macOS permissions.
*   **Messages App Must Be Running**: AppleScript interaction generally requires the Messages app to be open (though it doesn't need to be the frontmost application).
*   **Single User Context**: Runs within the logged-in user's context and interacts with their Messages app.
*   **`chat.db` Access**: Relies on the structure of the `chat.db` file, which could potentially change in future macOS updates. Access can also be temporarily blocked if the Messages app has the database locked.
*   **AppleScript Reliability**: AppleScript interactions can sometimes be fragile and depend on the state of the Messages app.

