# The database and the Prisma schema are two different designs

Read this before running any Prisma migration command against this project.

`prisma/schema.prisma` declares 31 tables. On the production database
(Neon project `bold-fire-28339702`), **three of them exist**: `connectors`,
`user_profiles`, and the `latest_provenance` view. The other 28 have never been
created, and there is no `prisma/migrations` directory — the schema has never
been applied here.

That is not an accident waiting to be tidied up. This database was built by
hand: snake_case columns, and real work living in the `canonical`, `api`,
`roomdood` and `signals` schemas. The application uses both halves — raw SQL
through `prisma.$queryRaw` against the hand-built tables, which works, and
Prisma model calls (`prisma.user`, `prisma.timeTable`) against tables that do
not exist, which do not.

## Do not run `prisma db push` or `prisma migrate dev`

Both reconcile the database to the schema, and the two overlapping tables would
lose columns that hold data:

| Table | What a push would do |
|---|---|
| `user_profiles` | add 7 camelCase columns, **drop 17** — `email`, `display_name`, `investor_archetype`, `budget_min`, `budget_max`, `preferred_cities`, `preferred_property_types`, `golden_visa_required`, `role`, `created_at` and the snake_case originals — and move the primary key from `id` to `user_id` |
| `connectors` | **drop** `tenant_id`, `config`, `created_at`; convert `type` from `text` to a `ConnectorType` enum |

`"userId"` and `user_id` are different columns in Postgres. That is the whole
mechanism: the models were written without `@map` directives, so Prisma
addressed columns that were never there.

## What has been done instead

`UserProfile` now carries `@map` on every field, so it reads and writes the
columns the live table actually has. `2026-09-02-terminal-auth-tables.sql`
creates `users` and adds the single missing `inferred_signals` column — additive
only, verified on a copy-on-write Neon branch before being proposed.

## What is still missing

26 tables, and with them the features that need them — Time Table
(`timetables`), Decision Objects (`decision_objects`), chat session persistence,
API keys, teams, agents and market books. They are absent from the database, so
those capabilities do not work in production regardless of what the test suite
says: the tests use mocks. The README's status table is graded accordingly.

Creating them is a deliberate, table-by-table job, not one command.
