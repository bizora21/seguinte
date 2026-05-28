ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(chat_id, read_at) WHERE read_at IS NULL;
