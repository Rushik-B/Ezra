-- This is an empty migration.

-- Create ActionHistoryType enum for categorizing different types of user actions
-- This tracks email actions (sent, rejected, edited, snoozed) and system changes
CREATE TYPE "ActionHistoryType" AS ENUM (
  'EMAIL_SENT',
  'EMAIL_REJECTED', 
  'EMAIL_EDITED',
  'EMAIL_SNOOZED',
  'EMAIL_ARCHIVED',
  'MASTER_PROMPT_UPDATED',
  'AUTONOMY_RULE_ADDED',
  'SETTINGS_CHANGED'
);

-- Create ActionHistory table to track all user actions and AI decisions
-- This replaces the mock data in HistoryPage.tsx with real action tracking
CREATE TABLE "ActionHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actionType" "ActionHistoryType" NOT NULL,
  "actionSummary" TEXT NOT NULL,               -- Brief description shown in UI
  "actionDetails" JSONB,                       -- Full context (email content, etc.)
  "emailReference" TEXT,                       -- Link to related email if applicable
  "confidence" DOUBLE PRECISION,               -- AI confidence for email actions
  "undoable" BOOLEAN NOT NULL DEFAULT false,   -- Whether action can be undone
  "promptState" TEXT,                          -- Master prompt version at time of action
  "metadata" JSONB,                            -- Additional data (sender, subject, etc.)
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("id")
);

-- Create index for efficient querying by user and date
-- This enables fast loading of user's action history in chronological order
CREATE INDEX "ActionHistory_userId_createdAt_idx" ON "ActionHistory"("userId", "createdAt");

-- Add foreign key constraint to User table
-- Ensures data integrity and enables cascade deletion
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;