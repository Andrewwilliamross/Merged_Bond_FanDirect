-- Create message status enum
CREATE TYPE message_status AS ENUM (
  'pending',      -- Initial state when message is created
  'queued',       -- Message has been queued by the Mac agent
  'processing',   -- Mac agent is processing the message
  'downloading_media', -- Mac agent is downloading media attachments
  'sending',      -- Mac agent is sending the message via AppleScript
  'sent',         -- Message has been sent successfully
  'delivered',    -- Message has been delivered (future feature)
  'error',        -- Message failed to send
  'retrying',     -- Message is being retried
  'waiting_retry' -- Message is waiting for retry delay
);

-- Create outbound_messages table
CREATE TABLE IF NOT EXISTS public.outbound_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    creator_id uuid NOT NULL REFERENCES public.profiles(id),
    fan_phone_number text NOT NULL,
    message_text text,
    attachment_url text,
    status message_status DEFAULT 'pending'::message_status,
    sent_at timestamp with time zone,
    apple_id text,
    vm_id text,
    retry_count integer DEFAULT 0,
    error_message text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS outbound_messages_creator_id_idx ON public.outbound_messages(creator_id);
CREATE INDEX IF NOT EXISTS outbound_messages_fan_phone_number_idx ON public.outbound_messages(fan_phone_number);
CREATE INDEX IF NOT EXISTS outbound_messages_status_idx ON public.outbound_messages(status);

-- Enable RLS
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own outbound messages"
    ON public.outbound_messages FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can create outbound messages"
    ON public.outbound_messages FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own outbound messages"
    ON public.outbound_messages FOR UPDATE
    USING (auth.uid() = creator_id);

-- Create a function to handle new outbound messages
CREATE OR REPLACE FUNCTION public.handle_new_outbound_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only handle new messages in 'pending' status
  IF NEW.status = 'pending' THEN
    -- Call the edge function to notify the Mac server
    PERFORM net.http_post(
      url := CONCAT(current_setting('app.settings.edge_function_base_url'), '/notify-mac-server'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key'))
      ),
      body := jsonb_build_object(
        'id', NEW.id,
        'fan_phone_number', NEW.fan_phone_number,
        'message_text', NEW.message_text,
        'attachment_url', NEW.attachment_url,
        'creator_id', NEW.creator_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_notify_mac_server ON public.outbound_messages;
CREATE TRIGGER tr_notify_mac_server
  AFTER INSERT ON public.outbound_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_outbound_message();

-- Add updated_at trigger
CREATE TRIGGER update_outbound_messages_updated_at
    BEFORE UPDATE ON public.outbound_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 