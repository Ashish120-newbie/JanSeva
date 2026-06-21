-- Create complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT UNIQUE NOT NULL DEFAULT 'CMP' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  citizen_name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  ai_summary TEXT,
  location TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_complaints_complaint_id ON complaints(complaint_id);
CREATE INDEX idx_complaints_email ON complaints(email);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public for complaint submission, authenticated for other operations)
CREATE POLICY "insert_complaints_public" ON complaints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_complaints_by_email" ON complaints FOR SELECT
  USING (email = current_setting('request.jwt.claims->email', true) OR auth.role() = 'authenticated');

CREATE POLICY "update_complaints_authenticated" ON complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();