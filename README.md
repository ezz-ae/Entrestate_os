# Entrestate Terminal — decision infrastructure for real estate

Public market intelligence for Dubai real estate: search the market, score a
project, build a Time Table, and turn it into something you can defend in a
meeting.

**This is not open-source software and it is not installable.** There are no
setup instructions here by design. The Terminal is a commercial product,
running at [terminal.entrestate.com](https://terminal.entrestate.com); this
repository is public so that its claims can be checked against the code that
implements them. Read it as a specification with its evidence attached.

---

## What it is for

Most real-estate tooling answers *what happened*. An operator deciding where to
put money needs something harder: a defensible answer to *what should I do, and
why should anyone believe it*. The Terminal is built around that second
question — it hides data complexity and exposes only the outcomes that matter:
reports, memos, contracts and deployable content, each carrying the evidence
that produced it.

It is the front door of one account. The business half — CRM, advertising,
landing pages, wallet — is the sibling product
([`ezz-ae/entrestate-platform`](https://github.com/ezz-ae/entrestate-platform),
entrestate.com). One sign-in on the shared `.entrestate.com` session spans
both; they exchange served APIs, never copied code.

## The Decision Tunnel

Every path through the product passes four stages.

| Stage | What happens | Why it matters |
|---|---|---|
| **Intent** | A natural-language goal is compiled into a structured `TableSpec` — scope, time grain, signals — that defines exactly what will be pulled. Budget, location, asset type, status and priority are extracted rather than guessed. | The question becomes inspectable before any data moves. |
| **Evidence** | Records are collected from the canonical graph of transactions, pipelines and pricing, then filtered by an explicit exclusion policy: distressed sales, internal transfers, duplicates, incomplete projects. | The model never sees inputs a human analyst would have thrown out. |
| **Judgment** | Candidates are ranked under the user's decision lens: 65 % market score (the asset's objective quality) and 35 % match score (fit to risk appetite and time horizon). | The ranking is a stated formula, not a black box. |
| **Action** | The result becomes a Decision Object — report, memo, deck, widget — each shipped with an evidence drawer listing sources, filters and assumptions. | The output can be defended in front of the person who has to sign. |

## What is inside, and what state each part is in

**BUILT** — code in this repository, exercised by a test ·
**PARTIAL** — part of the claim exists, a named part does not ·
**PLANNED** — specified, no code yet. The rows that are not BUILT are the
reason the rest can be believed.

A test passing is not the same as a feature working. The suites here use mocks,
so a row can be green in CI and still be unavailable in production if its table
was never created — which is exactly the case for two rows below. Where that is
true the row says so, and [`db/README.md`](db/README.md) records why 28 of the
31 tables `prisma/schema.prisma` declares do not exist.

| Capability | Status | Notes |
|---|---|---|
| **Time Table** — the atomic unit: buildable, saveable, refreshable, exportable, embeddable, auditable | PARTIAL | the code and its tests are here (`/api/timetables`, `/t/:id`), but the `timetables` table does not exist in the production database, so nothing can be saved there today — see [`db/README.md`](db/README.md) |
| **TableSpec compiler** — intent to a deterministic `TableSpec` JSON | BUILT | rules path always available; the LLM-backed path is opt-in and off by default. `tests/tablespec-compiler.test.ts`, `tests/tablespec-validation.test.ts`, `tests/tablespec-llm.test.ts` |
| **Decision Objects** — reports, decks, memos, widgets, underwriting | PARTIAL | same: `/api/time-table/artifacts` and `/api/time-table/underwrite` are implemented, the `decision_objects` table is not created in production |
| **Market scoring** — signal definitions with documented governance; overrides logged | BUILT | `tests/scoring-engine.test.ts`, `tests/governance.test.ts`; audit table `investor_override_audit` |
| **Profile Intelligence** — learns preferences and states its suggestions explicitly | BUILT | `tests/profile-inference.test.ts` |
| **Ingestion and data coverage** | BUILT | `tests/ingestion.test.ts`, `tests/data-coverage.test.ts` |
| **Cross-product account** — the business account rendered here, never kept here | BUILT | `lib/business-account.ts`, `tests/business-account.test.ts` |
| **Automation Studio** — workflow builder with persistent state | PARTIAL | the builder and runtime exist; audio, embedding and structured-output nodes run in **preview** |
| **Evidence drawer on every Decision Object** | PARTIAL | sources and filters are carried through the pipeline; a uniform drawer on every object type is not finished |

Programmatic surfaces: `/api/timetables`, `/api/artifacts`, `/api/profile`,
`/api/automations`, and the Time Table pipeline under `/api/time-table/*`
(compile, preview, summary, artifacts, underwrite).

## The public surface is deliberately narrow

145 page routes exist in this codebase; roughly a third were parallel builds of
the same screen, reachable only by typing the address. A visitor who found one
saw a half-built product nobody maintained.

`lib/surface.ts` names every route that is hidden and the reason, and
`proxy.ts` serves each as a real 404 — a hidden page must look missing, not
blank, and must never answer 200 to a crawler. So `/os`, `/artifacts` and
`/automations` returning 404 in production is the system working, not a
deployment fault. What is public is what is finished.

The live entry points: `/` (chat, search and map), `/markets`, `/chat`,
`/search`, `/map`, `/top-data`, `/library`, `/workspace`, `/apps`, `/me`,
`/t/:id` for an individual Time Table, `/pricing`, and `/status`.

## How correctness is enforced

- **Tests as the rulebook** — 41 suites under `tests/`, run on every merge,
  covering the TableSpec compiler and its validation, scoring, governance,
  ingestion, profile inference, API error shapes, copy rules, and the
  cross-product account bridge.
- **Repository hygiene** — `tests/repo-hygiene.test.ts` fails the build if a
  document, an archive or a file over 1 MB is committed under a source
  directory, if a filename carries a browser's ` (N)` duplicate suffix, or if
  any tracked file contains a database URL with a password in it.
- **Repository contract** — `scripts/guardian.py` checks structural rules
  before a build is allowed.
- **Documentation truth** — `tests/docs-truth.test.ts` fails the build if a
  page reintroduces a stack claim that has been retired.
- **Database contract** — `.github/workflows/db-contract-nightly.yml` runs
  nightly against a read-only branch, so schema drift surfaces on its own
  rather than during a demo.
- **Preview integrity** — `.github/workflows/preview-smoke-promote.yml` is
  written to gate promotion behind a smoke pass, but it is **dormant, not
  enforcing**: its preflight requires the `VERCEL_TOKEN` and `VERCEL_ORG_ID`
  secrets, neither is set on this repository, so the deploy, smoke and promote
  jobs skip on every push and always have. It is listed here as wiring that
  exists, not as a gate that has stopped anything. Setting those two secrets
  turns it on; `tests/ci-claims.test.ts` pins the three defects in
  `scripts/smoke.sh` that the dormancy had been hiding.

## Specifications

- [`docs/decision-infrastructure/README.md`](docs/decision-infrastructure/README.md) — the canonical map
- [`docs/decision-infrastructure/decision-tunnel.md`](docs/decision-infrastructure/decision-tunnel.md) — the four stages in depth
- [`docs/decision-infrastructure/market-scoring-signals.md`](docs/decision-infrastructure/market-scoring-signals.md) — signal definitions and governance
- [`docs/decision-infrastructure/core-data-objects.md`](docs/decision-infrastructure/core-data-objects.md) — Time Table, TableSpec, Decision Objects, Profile Intelligence
- [`docs/decision-infrastructure/broker-dashboard-features.md`](docs/decision-infrastructure/broker-dashboard-features.md) — broker-facing intelligence
- [`docs/neon-data-map.md`](docs/neon-data-map.md) — tables, functions and how they are used
- `site-map.md` — the full route catalog with implementation status
- [`docs/archive/`](docs/archive/) — dated planning drafts, kept for the record
  and explicitly **not** authoritative; its README says which numbers to trust
  instead and why two of the drafts contradict each other

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Neon Postgres (raw SQL
via `prisma.$queryRaw`) · Neon Auth for the shared `.entrestate.com` session ·
Vercel. Price fields are `DOUBLE PRECISION` end to end.

## Ownership

Proprietary. See [`LICENSE.md`](LICENSE.md) and [`NOTICE.md`](NOTICE.md).
Public visibility of this repository is for review and verification; it grants
no licence to use, copy, deploy or derive from this software.
