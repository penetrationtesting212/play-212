-- Migration: Add workflow status to scripts table
-- Description: Adds workflowStatus field to track script pipeline state
-- Date: 2025-01-21

-- Add workflowStatus column with default value 'draft'
ALTER TABLE "Script" 
ADD COLUMN IF NOT EXISTS "workflowStatus" TEXT NOT NULL DEFAULT 'draft';

-- Create index for workflow status queries
CREATE INDEX IF NOT EXISTS "Script_workflowStatus_idx" ON "Script"("workflowStatus");

-- Update any existing scripts to have draft status
UPDATE "Script" 
SET "workflowStatus" = 'draft' 
WHERE "workflowStatus" IS NULL OR "workflowStatus" = '';

-- Add comment explaining allowed values
COMMENT ON COLUMN "Script"."workflowStatus" IS 'Workflow status: draft, ai_enhanced, testdata_ready, human_review, finalized, archived';
