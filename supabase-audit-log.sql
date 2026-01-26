-- Audit Log System
-- Run this in Supabase SQL Editor

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT, -- 'assessment', 'user', 'export', 'login', etc.
  target_id UUID, -- ID of the affected record
  details JSONB, -- Additional information about the action
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs (via service role)
-- This is handled by service role key, no policy needed for INSERT

-- Function to log actions
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action_type,
    target_type,
    target_id,
    details,
    ip_address
  ) VALUES (
    p_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-log assessment submissions
CREATE OR REPLACE FUNCTION audit_assessment_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_action(
    NEW.assessor_id,
    'assessment_submitted',
    'assessment',
    NEW.id,
    jsonb_build_object(
      'trainer_id', NEW.trainer_id,
      'assessment_date', NEW.assessment_date,
      'average_score', (
        (NEW.trainers_readiness +
         NEW.communication_skills +
         NEW.domain_expertise +
         NEW.knowledge_displayed +
         NEW.people_management +
         NEW.technical_skills) / 6.0
      )
    ),
    NULL -- IP address would need to be passed from application
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessment submissions
DROP TRIGGER IF EXISTS trigger_audit_assessment_submission ON assessments;
CREATE TRIGGER trigger_audit_assessment_submission
  AFTER INSERT ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION audit_assessment_submission();

-- Trigger function to auto-log user changes
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_by UUID;
BEGIN
  -- Get the user making the change (from application context or NEW.updated_by)
  -- For now, we'll use the user_id from the session
  -- In production, you'd pass this from the application
  
  -- Log the change
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_action(
      NEW.id, -- User being created
      'user_created',
      'user',
      NEW.id,
      jsonb_build_object(
        'full_name', NEW.full_name,
        'role', NEW.role,
        'team_id', NEW.team_id
      ),
      NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log significant changes
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM log_audit_action(
        auth.uid(), -- Current user making the change
        'user_role_changed',
        'user',
        NEW.id,
        jsonb_build_object(
          'old_role', OLD.role,
          'new_role', NEW.role,
          'full_name', NEW.full_name
        ),
        NULL
      );
    END IF;
    
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      PERFORM log_audit_action(
        auth.uid(),
        'user_team_changed',
        'user',
        NEW.id,
        jsonb_build_object(
          'old_team_id', OLD.team_id,
          'new_team_id', NEW.team_id,
          'full_name', NEW.full_name
        ),
        NULL
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_action(
      auth.uid(),
      'user_deleted',
      'user',
      OLD.id,
      jsonb_build_object(
        'full_name', OLD.full_name,
        'role', OLD.role
      ),
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: User change triggers would be added if needed
-- For now, we'll log these from the application layer

-- Function to clean old audit logs (retention policy: 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_action TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;
