-- Gamification System Database Schema
-- Run this in Supabase SQL Editor

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'rising_star', 'consistency_king', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon name
  category TEXT, -- 'milestone', 'achievement', 'streak', etc.
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User badges (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'overall_rating', 'parameter', 'assessment_count'
  target_value NUMERIC,
  target_parameter TEXT, -- For parameter-specific goals
  deadline DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id), -- Who created (self or manager)
  description TEXT
);

-- XP and levels
CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_xp INTEGER DEFAULT 0, -- XP in current level
  level_up_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XP history (for tracking)
CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'assessment', 'improvement', 'streak', 'badge'
  source_id UUID, -- ID of assessment, badge, etc.
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'improvement', 'assessment_received', 'consistency'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Leaderboard preferences (opt-in/opt-out)
CREATE TABLE IF NOT EXISTS leaderboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opt_in BOOLEAN DEFAULT false,
  show_name BOOLEAN DEFAULT true, -- Show name or anonymous
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard widget preferences
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL, -- 'stats', 'chart', 'insights', 'badges', etc.
  position INTEGER NOT NULL, -- Order on dashboard
  visible BOOLEAN DEFAULT true,
  config JSONB, -- Widget-specific configuration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, widget_type)
);

-- Kudos/appreciation
CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'appreciation', -- 'appreciation', 'tip', 'celebration'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_kudos_to_user ON kudos(to_user_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user badges"
  ON user_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for XP
CREATE POLICY "Users can view their own XP"
  ON user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for streaks
CREATE POLICY "Users can view their own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboard preferences
CREATE POLICY "Users can manage their own preferences"
  ON leaderboard_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for dashboard widgets
CREATE POLICY "Users can manage their own widgets"
  ON dashboard_widgets FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for kudos
CREATE POLICY "Users can view kudos they received"
  ON kudos FOR SELECT
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can send kudos"
  ON kudos FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Function to calculate XP from assessment
CREATE OR REPLACE FUNCTION calculate_assessment_xp(assessment_avg NUMERIC)
RETURNS INTEGER AS $$
BEGIN
  -- Base XP: 50 points per assessment
  -- Bonus XP based on rating
  IF assessment_avg >= 4.5 THEN
    RETURN 150; -- Excellent
  ELSIF assessment_avg >= 4.0 THEN
    RETURN 100; -- Very Good
  ELSIF assessment_avg >= 3.5 THEN
    RETURN 75; -- Good
  ELSIF assessment_avg >= 3.0 THEN
    RETURN 50; -- Average
  ELSE
    RETURN 25; -- Below Average (still get XP for participation)
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF total_xp >= 8000 THEN RETURN 6; -- Master
  ELSIF total_xp >= 4000 THEN RETURN 5; -- Expert
  ELSIF total_xp >= 2000 THEN RETURN 4; -- Proficient
  ELSIF total_xp >= 1000 THEN RETURN 3; -- Competent
  ELSIF total_xp >= 500 THEN RETURN 2; -- Learner
  ELSE RETURN 1; -- Novice
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get XP needed for next level
CREATE OR REPLACE FUNCTION xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE current_level
    WHEN 1 THEN RETURN 500;
    WHEN 2 THEN RETURN 1000;
    WHEN 3 THEN RETURN 2000;
    WHEN 4 THEN RETURN 4000;
    WHEN 5 THEN RETURN 8000;
    ELSE RETURN 8000; -- Max level
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award XP when assessment is created
CREATE OR REPLACE FUNCTION award_assessment_xp()
RETURNS TRIGGER AS $$
DECLARE
  avg_score NUMERIC;
  xp_earned INTEGER;
  current_total_xp INTEGER;
  new_level INTEGER;
  old_level INTEGER;
BEGIN
  -- Calculate average score
  avg_score := (
    NEW.trainers_readiness +
    NEW.communication_skills +
    NEW.domain_expertise +
    NEW.knowledge_displayed +
    NEW.people_management +
    NEW.technical_skills
  ) / 6.0;

  -- Calculate XP
  xp_earned := calculate_assessment_xp(avg_score);

  -- Get current XP
  SELECT COALESCE(total_xp, 0), COALESCE(current_level, 1)
  INTO current_total_xp, old_level
  FROM user_xp
  WHERE user_id = NEW.trainer_id;

  -- Insert or update XP
  INSERT INTO user_xp (user_id, total_xp, current_level, level_xp, updated_at)
  VALUES (
    NEW.trainer_id,
    current_total_xp + xp_earned,
    calculate_level(current_total_xp + xp_earned),
    (current_total_xp + xp_earned) - (SELECT COALESCE(SUM(xp_for_next_level(level)), 0) FROM (
      SELECT generate_series(1, calculate_level(current_total_xp + xp_earned) - 1) AS level
    ) levels),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_xp = user_xp.total_xp + xp_earned,
    current_level = calculate_level(user_xp.total_xp + xp_earned),
    level_xp = (user_xp.total_xp + xp_earned) - (SELECT COALESCE(SUM(xp_for_next_level(level)), 0) FROM (
      SELECT generate_series(1, calculate_level(user_xp.total_xp + xp_earned) - 1) AS level
    ) levels),
    updated_at = NOW();

  -- Log XP history
  INSERT INTO xp_history (user_id, xp_amount, source, source_id, description)
  VALUES (
    NEW.trainer_id,
    xp_earned,
    'assessment',
    NEW.id,
    'Assessment received: ' || avg_score::TEXT || '/5.0'
  );

  -- Check for level up
  new_level := calculate_level(current_total_xp + xp_earned);
  IF new_level > old_level THEN
    UPDATE user_xp
    SET level_up_at = NOW()
    WHERE user_id = NEW.trainer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_assessment_xp ON assessments;
CREATE TRIGGER trigger_award_assessment_xp
  AFTER INSERT ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION award_assessment_xp();

-- Insert default badges
INSERT INTO badges (code, name, description, icon, category, rarity) VALUES
('rising_star', 'Rising Star', 'Received your first 4+ rating', '🌟', 'milestone', 'common'),
('consistency_king', 'Consistency King', '5 consecutive 4+ ratings', '🏆', 'achievement', 'rare'),
('improver', 'Improver', 'Improved by 0.5 points in any parameter', '📈', 'improvement', 'common'),
('all_rounder', 'All-Rounder', 'All parameters above 4.0', '🎯', 'achievement', 'rare'),
('excellence', 'Excellence', '3 months of 4.5+ average', '💎', 'achievement', 'epic'),
('mvp', 'MVP', 'Highest rated trainer of the month', '🚀', 'achievement', 'legendary'),
('hot_streak', 'Hot Streak', '10 consecutive improving assessments', '🔥', 'streak', 'epic'),
('first_assessment', 'First Steps', 'Received your first assessment', '👶', 'milestone', 'common'),
('century_club', 'Century Club', 'Received 100 assessments', '💯', 'milestone', 'rare'),
('perfect_score', 'Perfect Score', 'Received a perfect 5.0 rating', '⭐', 'achievement', 'epic')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT SELECT ON badges TO authenticated;
GRANT SELECT, INSERT ON user_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON goals TO authenticated;
GRANT SELECT ON user_xp TO authenticated;
GRANT SELECT ON xp_history TO authenticated;
GRANT SELECT ON streaks TO authenticated;
GRANT ALL ON leaderboard_preferences TO authenticated;
GRANT ALL ON dashboard_widgets TO authenticated;
GRANT SELECT, INSERT ON kudos TO authenticated;
