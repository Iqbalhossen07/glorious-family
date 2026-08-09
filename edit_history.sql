-- Add edit_history column to tables
ALTER TABLE bazar_expenses ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE daily_meals ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
