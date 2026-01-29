-- Assessor–Assessee mapping overrides (admin-controlled, conflict-of-interest)
-- Base rules enforced in app: no self-assessment, no direct/indirect reportees.
-- This table allows admin to allow or block specific assessor ↔ assessee pairs.

CREATE TABLE IF NOT EXISTS assessor_assessee_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('allow', 'block')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(assessor_id, assessee_id),
  CONSTRAINT no_self_override CHECK (assessor_id != assessee_id)
);

CREATE INDEX IF NOT EXISTS idx_assessor_assessee_overrides_assessor ON assessor_assessee_overrides(assessor_id);
CREATE INDEX IF NOT EXISTS idx_assessor_assessee_overrides_assessee ON assessor_assessee_overrides(assessee_id);

COMMENT ON TABLE assessor_assessee_overrides IS 'Admin-controlled allow/block of specific assessor-assessee pairs. Base rules (no self, no reportees) applied in app.';

-- RLS: managers and admins can read; only admins can insert/update/delete
ALTER TABLE assessor_assessee_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers and admins can read overrides" ON assessor_assessee_overrides;
CREATE POLICY "Managers and admins can read overrides"
  ON assessor_assessee_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can insert overrides" ON assessor_assessee_overrides;
CREATE POLICY "Admins can insert overrides"
  ON assessor_assessee_overrides FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update overrides" ON assessor_assessee_overrides;
CREATE POLICY "Admins can update overrides"
  ON assessor_assessee_overrides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete overrides" ON assessor_assessee_overrides;
CREATE POLICY "Admins can delete overrides"
  ON assessor_assessee_overrides FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
