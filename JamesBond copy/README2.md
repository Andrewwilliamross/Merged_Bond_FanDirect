# Mac Agent Product Description Report

## 1. System Overview

The Mac Agent is a sophisticated Node.js application that serves as a bridge between a web application, Supabase backend, and the macOS Messages app (iMessage). It enables bidirectional communication between creators and their fans through iMessage, with all message data being synchronized with Supabase.

## 2. Core Components

### 2.1 Message Flow Architecture

#### Outbound Message Flow:
1. Web Application → Mac Agent:
   - Web app sends POST request to `/send-message` endpoint
   - Request includes: outbound_message_id, fan_phone_number, message_text, media_url, creator_id
   - Request is authenticated using API key

2. Mac Agent → iMessage:
   - Messages are queued with rate limiting (default: 10 seconds between messages)
   - AppleScript is used to send messages through the Messages app
   - Media attachments are downloaded from URLs before sending

3. Mac Agent → Supabase:
   - Message status updates are sent to Supabase
   - Statuses include: pending, sent, error
   - Error messages are captured and stored

#### Inbound Message Flow:
1. iMessage → Mac Agent:
   - Agent polls the local `chat.db` SQLite database
   - Detects new incoming messages and media attachments
   - Maps fan phone numbers to creator IDs

2. Mac Agent → Supabase:
   - Messages are stored in `inbound_messages` table
   - Media attachments are uploaded to Supabase Storage
   - Fan-creator mappings are maintained and refreshed

### 2.2 Key Components

1. **Agent (agent.js)**
   - Main application entry point
   - Initializes all subsystems
   - Manages HTTPS server
   - Handles service installation/uninstallation

2. **Poller (poller.js)**
   - Monitors `chat.db` for new messages
   - Processes incoming messages
   - Updates Supabase with new messages

3. **Queue (queue.js)**
   - Manages outbound message queue
   - Implements rate limiting
   - Handles retry logic

4. **Sender (sender.js)**
   - Interfaces with Messages app via AppleScript
   - Sends text and media messages
   - Reports success/failure

5. **Supabase Integration (supabase.js)**
   - Manages all Supabase interactions
   - Handles message status updates
   - Manages media upload/download
   - Maintains fan-creator mappings

## 3. Data Models

### 3.1 Supabase Tables

1. **outbound_messages**
   ```sql
   - id (primary key)
   - status (pending, sent, error)
   - error_message
   - fan_phone_number
   - message_text
   - media_url
   - creator_id
   ```

2. **inbound_messages**
   ```sql
   - id (primary key)
   - fan_phone_number
   - creator_id
   - message_text
   - attachment_url
   - apple_id
   - created_at
   - conversation_id
   ```

3. **fan_creator_mappings**
   ```sql
   - fan_phone_number (primary key)
   - creator_id
   ```

4. **agent_heartbeats**
   ```sql
   - vm_id (primary key)
   - last_seen
   - agent_version
   ```

### 3.2 Storage
- Media attachments are stored in a configured Supabase storage bucket
- Files are organized by creator and message ID
- Public URLs are generated for web access

## 4. Message Format Specifications

### 4.1 Outbound Message Format
```json
{
  "outbound_message_id": "unique_id_from_supabase",
  "fan_phone_number": "+1xxxxxxxxxx",
  "message_text": "Message content",
  "media_url": "https://example.com/media.jpg",
  "creator_id": "creator_uuid"
}
```

### 4.2 Inbound Message Format
```json
{
  "fan_phone_number": "+1xxxxxxxxxx",
  "creator_id": "creator_uuid",
  "message_text": "Received message",
  "attachment_url": "https://storage.supabase.com/...",
  "apple_id": "user@icloud.com",
  "created_at": "2024-04-29T...",
  "conversation_id": "chat_id"
}
```

## 5. Integration Points

### 5.1 Web Application Integration
- HTTPS endpoint: `https://localhost:3000/send-message`
- Authentication: API key in header or query parameter
- Rate limiting: 10 seconds between messages
- Response format: JSON with status and message ID

### 5.2 Supabase Integration
- Real-time message status updates
- Media file management
- Fan-creator relationship management
- Heartbeat monitoring

### 5.3 macOS Integration
- Messages app interaction via AppleScript
- `chat.db` database access
- System permissions management
- LaunchAgent service integration

## 6. Security Considerations

1. **Authentication**
   - API key required for all web requests
   - Supabase service role key for backend operations
   - HTTPS for local API endpoint

2. **Permissions**
   - Full Disk Access for `chat.db`
   - Accessibility permissions for AppleScript
   - Automation permissions for Messages app

3. **Data Protection**
   - Secure storage of API keys
   - Encrypted HTTPS communication
   - Secure media file handling

## 7. Error Handling

1. **Message Sending**
   - Retry logic for failed sends
   - Error status updates in Supabase
   - Detailed error logging

2. **Media Handling**
   - Temporary file cleanup
   - Upload/download error recovery
   - Storage quota management

3. **Database Operations**
   - Connection error handling
   - Transaction management
   - Data validation

## 8. Monitoring and Maintenance

1. **Logging**
   - Application logs in `~/Library/Logs/MacAgent.log`
   - Error tracking and reporting
   - Performance monitoring

2. **Health Checks**
   - Heartbeat system
   - Service status monitoring
   - Resource usage tracking

3. **Updates**
   - Configuration refresh
   - Fan-creator mapping updates
   - Service restart capabilities

## 9. Development Guidelines

1. **Message Formatting**
   - Ensure proper phone number formatting (E.164)
   - Validate media URLs before sending
   - Handle message length limits

2. **Error Handling**
   - Implement proper error catching
   - Update message status appropriately
   - Log detailed error information

3. **Testing**
   - Test message delivery
   - Verify media handling
   - Check error scenarios
   - Validate Supabase integration 