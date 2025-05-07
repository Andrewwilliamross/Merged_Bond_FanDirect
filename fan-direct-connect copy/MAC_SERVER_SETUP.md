
# Mac Server Setup for Message Handling

This guide explains how to set up your Mac server to receive messages from the Supabase webhook and send status updates back.

## Architecture Overview

The system works as follows:
1. When a new outbound message is created in Supabase, a database trigger fires
2. The trigger calls the `notify-mac-server` Edge Function via pg_net
3. The Edge Function looks up the appropriate Mac server for the creator
4. The Edge Function forwards the message to the selected Mac server
5. Your Mac server processes the message and sends iMessages
6. Your Mac server updates the message status via the `handle-inbound-message` Edge Function

## Mac Server Allocation

The system supports multiple Mac servers with the following allocation strategies:

1. **Creator-Specific Mapping**: Each creator can be assigned to a specific Mac server
2. **Default Server**: A fallback server can be designated for creators without specific mapping
3. **Environment Variable**: As a last resort, the `MAC_SERVER_URL` environment variable is used

The mapping is stored in the `mac_server_mappings` table in Supabase.

## Setting Up Your Mac Server

### 1. Configure Mac Server in Admin Settings

1. Log in to your app and navigate to `/dashboard/admin/mac-servers`
2. Add a new Mac server with the URL of your Mac's API endpoint
3. Optionally set an API key for authentication
4. Set the server as default if you want it to handle messages for all creators without specific mapping

### 2. Create a Simple Server

Here's a basic example using Node.js and Express:

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// Your API key for securing the endpoint - must match the one set in Supabase
const API_KEY = 'your-secret-api-key';

app.use(bodyParser.json());

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.split(' ')[1];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Endpoint to receive messages from Supabase Edge Function
app.post('/api/messages', checkApiKey, async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Received message:', message);
    
    // Process the message here (e.g., send SMS via your Mac)
    // ...
    
    // Update the message status back to Supabase
    await updateMessageStatus(message.id, 'sent');
    
    // Respond to the webhook
    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to update message status in Supabase
async function updateMessageStatus(messageId, status, errorMessage = null) {
  try {
    // Call the Supabase handle-inbound-message function
    const response = await fetch(
      'https://uaqnjttwmrosudmbpcct.supabase.co/functions/v1/handle-inbound-message',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'status_update',
          message: {
            id: messageId,
            status: status,
            error_message: errorMessage
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update message status: ${response.statusText}`);
    }
    
    console.log(`Updated message ${messageId} status to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating message status:', error);
    return false;
  }
}

// For sending inbound messages back to Supabase
async function sendInboundMessage(text, senderPhone, recipientId, attachmentUrl = null) {
  try {
    const response = await fetch(
      'https://uaqnjttwmrosudmbpcct.supabase.co/functions/v1/handle-inbound-message',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'inbound_message',
          message: {
            text,
            sender_phone: senderPhone,
            recipient_id: recipientId,
            attachment_url: attachmentUrl
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send inbound message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Inbound message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending inbound message:', error);
    return null;
  }
}

// Simple endpoint for testing the server
app.post('/ping', checkApiKey, (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Message server listening at http://localhost:${port}`);
});
```

### 3. Making Your Server Accessible

For the Supabase Edge Function to reach your Mac, it needs to be accessible from the internet:

1. **Use a tunneling service** like [ngrok](https://ngrok.com):
   ```
   ngrok http 3000
   ```
   This will give you a public URL that forwards to your local server.

2. **Configure your router** for port forwarding (less recommended for security reasons).

### 4. Testing

1. Create a new message in your application
2. Check your Mac server logs to confirm it received the message
3. Verify the message status is updated in Supabase
4. Test sending a reply from the Mac server back to Supabase

### Security Considerations

- Use HTTPS for all communications
- Implement API key validation in both directions
- Validate all incoming data before processing
- Consider implementing rate limiting on your server

