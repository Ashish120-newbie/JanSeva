-- Expand status constraint to support the officer resolution workflow.
-- Keep existing values valid (pending/in_progress/resolved/rejected) so
-- historical rows and previously-submitted complaints still work.
ALTER TABLE complaints
  DROP CONSTRAINT complaints_status_check;

ALTER TABLE complaints
  ADD CONSTRAINT complaints_status_check
  CHECK (status IN (
    'pending', 'in_progress', 'resolved', 'rejected', -- legacy
    'submitted', 'assigned'                            -- new workflow values
  ));

-- Add columns to support the officer resolution panel.
-- officer_notes: free-text context added when status is updated.
-- officer_name: who performed the last status update.
-- resolved_at: set when a complaint transitions to 'resolved'.
-- These are nullable so existing rows are unaffected.
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS officer_notes TEXT,
  ADD COLUMN IF NOT EXISTS officer_name TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill any legacy 'pending' rows to 'submitted' for display consistency
-- in the new workflow. Old values remain valid if previously inserted.
UPDATE complaints SET status = 'submitted' WHERE status = 'pending';
UPDATE complaints SET status = 'assigned' WHERE status = 'in_progress';

-- Index for filtering non-resolved complaints in the officer panel.
CREATE INDEX IF NOT EXISTS idx_complaints_status_open
  ON complaints(status) WHERE status NOT IN ('resolved');

-- Keep resolved_at in sync when status flips to resolved.
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status <> 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_resolved_at ON complaints;
CREATE TRIGGER trigger_set_resolved_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_at();

-- Ensure insert policy allows officers (public anon in this template) to read
-- all complaints so the resolution panel can list them. The select policy is
-- already public; update must also remain public for the officer panel.
DROP POLICY IF EXISTS "select_complaints_public" ON complaints;
CREATE POLICY "select_complaints_public" ON complaints FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "update_complaints_authenticated" ON complaints;
CREATE POLICY "update_complaints_public" ON complaints FOR UPDATE
  USING (true) WITH CHECK (true);
