
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
  media?: string;
  status?: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastActive: string;
  messages: Message[];
  phone?: string;
}

export interface DatabaseMessage {
  id: string;
  content: string | null;
  sender_id: string;
  created_at: string;
  attachment_url: string | null;
  conversation_id: string;
}

export interface OutboundMessage {
  id: string;
  creator_id: string;
  fan_phone_number: string;
  message_text: string;
  attachment_url: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  apple_id: string | null;
  vm_id: string | null;
  retry_count: number | null;
  error_message: string | null;
}
