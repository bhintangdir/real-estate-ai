-- PHASE 5: OMNICHANNEL COMMUNICATION SCHEMA
-- Enabling Unified Inbox for WhatsApp & Telegram

-- 1. CONVERSATIONS TABLE (Group messages by customer)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'whatsapp' | 'telegram'
  last_message_preview text,
  unread_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. MESSAGES TABLE (Individual chat bubbles)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'customer' | 'staff'
  content text NOT NULL,
  status text DEFAULT 'sent', -- 'sent' | 'delivered' | 'read'
  metadata jsonb DEFAULT '{}'::jsonb, -- Store raw API data (TG user_id, WA status code, etc)
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Expandable based on roles)
CREATE POLICY "Allow authenticated users to manage conversations" ON conversations
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage messages" ON messages
FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at on conversation
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = now(), 
      last_message_preview = substring(NEW.content from 1 for 100),
      unread_count = CASE WHEN NEW.sender_type = 'customer' THEN unread_count + 1 ELSE unread_count END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
