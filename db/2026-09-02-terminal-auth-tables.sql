-- Terminal sign-in: the two additive changes that unblock it.
--
-- Why this file exists rather than `prisma db push`: this database was built by
-- hand and `prisma/schema.prisma` was written separately and never applied. Of
-- the 31 tables the schema declares, 28 do not exist; of the 3 that do, two
-- (user_profiles, connectors) have completely different columns from the models
-- that claim them. A push would have added camelCase columns and dropped the
-- live snake_case ones — 17 on user_profiles alone, including email,
-- budget_min, budget_max, preferred_cities, golden_visa_required and role.
--
-- So this is hand-written, additive only, and does the minimum that makes
-- sign-in work: nothing here drops or alters an existing column.
--
-- Verified on 2026-09-02 against a copy-on-write Neon branch taken from the
-- production branch (br-proud-lake-aiaux4a2): both statements applied, and the
-- exact insert + join that lib/auth/sync.ts performs returned the expected row.
--
-- Apply with a snapshot taken first. This does not create the other 26 missing
-- tables — Time Table, Decision Objects, chat sessions and the rest stay
-- unavailable until that is done deliberately, table by table.

-- 1. The table whose absence caused the login redirect loop.
--    Columns are quoted camelCase because the Prisma User model has no @map
--    directives and this table is new, so there is no existing shape to honour.
CREATE TABLE IF NOT EXISTS "users" (
    "id"        TEXT NOT NULL,
    "email"     TEXT,
    "name"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 2. The one column UserProfile names that the live table did not have.
--    Nullable, so every existing row stays valid and nothing is rewritten.
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "inferred_signals" JSONB;
