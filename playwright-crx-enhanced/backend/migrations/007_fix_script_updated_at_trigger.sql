-- Migration: Fix Script table updatedAt trigger
-- Description: The Script table uses "updatedAt" (camelCase) but trigger was referencing updated_at (snake_case)
-- Date: 2025-01-24

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_script_updated_at ON "Script";

-- Recreate trigger with correct column name
CREATE OR REPLACE FUNCTION update_script_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to Script table
CREATE TRIGGER update_script_updated_at 
BEFORE UPDATE ON "Script" 
FOR EACH ROW 
EXECUTE FUNCTION update_script_updated_at_column();

-- Verify the column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Script' 
        AND column_name = 'updatedAt'
    ) THEN
        RAISE NOTICE 'Warning: updatedAt column does not exist in Script table';
    END IF;
END $$;
