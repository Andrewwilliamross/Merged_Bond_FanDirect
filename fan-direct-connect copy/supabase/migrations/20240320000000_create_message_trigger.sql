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

-- Create an enum for message status
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

-- Alter the outbound_messages table to use the enum
ALTER TABLE public.outbound_messages
  ALTER COLUMN status TYPE message_status USING status::message_status; 