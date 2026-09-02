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

## What is inside

- **Time Table** — the atomic unit: buildable, saveable, refreshable,
  exportable, embeddable, auditable.
- **TableSpec compiler** — user intent to a deterministic `TableSpec` JSON,
  with an optional LLM-backed path and a rules path that does not need one.
- **Decision Objects** — reports, presentations, memos, widgets, contracts and
  automations, each grounded on a Time Table.
- **Automation Studio** — a workflow builder with persistent state.
- **Profile Intelligence** — learns preferences and makes its suggestions
  explicit rather than silently reweighting.
- **Market scoring** — signal definitions and their governance are documented,
  and overrides are logged to `investor_override_audit`.

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

- **Tests as the rulebook** — 40 suites under `tests/`, run on every merge,
  covering the TableSpec compiler and its validation, scoring, governance,
  ingestion, profile inference, API error shapes, copy rules, and the
  cross-product account bridge.
- **Repository contract** — `scripts/guardian.py` checks structural rules
  before a build is allowed.
- **Documentation truth** — `tests/docs-truth.test.ts` fails the build if a
  page reintroduces a stack claim that has been retired.
- **Database contract** — `.github/workflows/db-contract-nightly.yml` runs
  nightly against a read-only branch, so schema drift surfaces on its own
  rather than during a demo.
- **Preview integrity** — `.github/workflows/preview-smoke-promote.yml` gates
  promotion behind a hardened smoke pass that protects production sign-in.

## Specifications

- [`docs/decision-infrastructure/README.md`](docs/decision-infrastructure/README.md) — the canonical map
- [`docs/decision-infrastructure/decision-tunnel.md`](docs/decision-infrastructure/decision-tunnel.md) — the four stages in depth
- [`docs/decision-infrastructure/market-scoring-signals.md`](docs/decision-infrastructure/market-scoring-signals.md) — signal definitions and governance
- [`docs/decision-infrastructure/core-data-objects.md`](docs/decision-infrastructure/core-data-objects.md) — Time Table, TableSpec, Decision Objects, Profile Intelligence
- [`docs/decision-infrastructure/broker-dashboard-features.md`](docs/decision-infrastructure/broker-dashboard-features.md) — broker-facing intelligence
- [`docs/neon-data-map.md`](docs/neon-data-map.md) — tables, functions and how they are used
- `site-map.md` — the full route catalog with implementation status

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Neon Postgres (raw SQL
via `prisma.$queryRaw`) · Neon Auth for the shared `.entrestate.com` session ·
Vercel. Price fields are `DOUBLE PRECISION` end to end.

## Ownership

Proprietary. See [`LICENSE.md`](LICENSE.md) and [`NOTICE.md`](NOTICE.md).
Public visibility of this repository is for review and verification; it grants
no licence to use, copy, deploy or derive from this software.
