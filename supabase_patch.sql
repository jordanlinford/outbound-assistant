CREATE EXTENSION IF NOT EXISTS "vector";

-- Add the new call-to-action column for campaigns (noop if it already exists)
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "callToAction" TEXT;

-- User-provided company profile used to generate more relevant content
CREATE TABLE IF NOT EXISTS "BusinessProfile" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT NOT NULL UNIQUE,
    "about"        TEXT,
    "uniqueValue"  TEXT,
    "targetCustomers" TEXT,
    "mainPainPoints"  TEXT,
    "tonePreference"  TEXT,
    "callToActions"   TEXT,
    "createdAt"    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Fine-grained knowledge snippets + embedding (OpenAI 1536-dim)
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
    "id"        TEXT PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "tags"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    -- Using BYTEA because Prisma maps Vector -> bytea in preview as of 5.x
    "embedding" BYTEA NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ──────────────────────────────────────────────────────────────
-- Safety patch: make sure KnowledgeChunk has userId + FK + idx
-- (will do nothing if they were already created)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Add FK only if it's missing (works on PG < 15)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'KnowledgeChunk_userId_fkey'
    ) THEN
        ALTER TABLE "KnowledgeChunk"
            ADD CONSTRAINT "KnowledgeChunk_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_userId_idx"
  ON "KnowledgeChunk" ("userId"); 