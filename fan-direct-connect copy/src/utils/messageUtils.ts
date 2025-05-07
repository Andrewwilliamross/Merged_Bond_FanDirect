
// This is now just a re-export file to maintain backward compatibility
// so that existing imports don't break
import { getOrCreateConversation, sendMessage } from './conversations';
import { sendOutboundMessage } from './outboundMessages';
import { updateMessageStatus, MAC_SERVER_API_REFERENCE, MAC_SERVER_ARCHITECTURE } from './messageStatus';

export {
  getOrCreateConversation,
  sendMessage,
  sendOutboundMessage,
  updateMessageStatus,
  MAC_SERVER_API_REFERENCE,
  MAC_SERVER_ARCHITECTURE
};
