# The loop: making the notebook notice

**Status: SPECIFIED, not built.** Nothing in this document exists as working
code yet. It is written the way the rest of `docs/decision-infrastructure/` is
written — with the evidence for every claim about what is already here, so the
gap between "designed" and "running" stays visible.

Written 2026-09-03, the night the 26 missing tables were created. That matters:
until that night, every table this design depends on was absent from the
production database, so none of the pieces below could have been connected even
if the code had existed.

---

## The one-sentence idea

A Time Table already knows *what question was asked*. The notebook already knows
*how to write the answer up*. The automation table already has the columns to
join them. What is missing is the part that **notices the answer changed** — and
that is the whole difference between a product that answers and a product that
thinks.

---

## What is already here

This is the honest inventory. Every row was checked against the code on
2026-09-03.

| Piece | Where | State |
|---|---|---|
| **18 evidence executors** | `lib/copilot/executor.ts` | Working. Shared by the chat *and* the notebook generator — one engine, two surfaces. |
| **TableSpec, compiled and stored** | `timetables.tablespec` (JSONB), `timetables.hash` | Working. The question is kept in an inspectable form, not just its answer. |
| **`refreshPolicy`** | `manual` / `daily` / `realtime` on every Time Table | The enum exists and is stored. Nothing reads it. |
| **Notebook: books, pages, feeds** | `lib/notebook/queries.ts`, `lib/notebook/generator.ts` | Books and pages work. `generateBookPages()` calls the same executors the chat uses. |
| **`automations` table** | `automations.timetableId`, `automations.decisionObjectId` | Created 2026-09-03. **`prisma.automation` has zero callers.** The bridge is designed and unbuilt. |
| **`agent_definitions` + builder** | 20+ routes under `app/api/automation-builder/`, `lib/automation-runtime/` | Definitions save. **`prisma.agentRun` has zero callers** — a run is never recorded. |
| **`appendFeedItem()`** | `lib/notebook/queries.ts:201` | Exported. **Zero callers.** The feed has no producer, which is why a notebook has never told anyone anything. |
| **`executeMonitorMarketSegments`** | `lib/copilot/executor.ts:942` | Working, and already returns `alert_status: GREEN / AMBER / RED` per area against a yield threshold. A change detector exists; nothing runs it on a schedule. |

Two front doors are closed in `lib/surface.ts` and serve a real 404:
`/automations` ("a parallel build of the automation list") and
`/automation-runtime` ("an internal runtime view, not a customer page"). So the
studio has no customer entrance today, by decision, not by accident.

### The refresh route is a stub, and says so

`app/api/timetables/[id]/refresh/route.ts` carries this comment:

> `// In a real implementation, this might trigger a background job to re-materialize`
> `// or update a cache. For now, we just update the timestamp.`

It sets `lastRefreshAt` and returns. It does not re-execute the `tablespec`, does
not compare the new result to the old one, and does not emit anything. **This
route is where the loop has to start.**

---

## The loop

```
  TableSpec  ──re-execute──▶  new result
      ▲                            │
      │                       compare to last
      │                            │
      │                     changed?  ──no──▶  stamp lastRefreshAt, stop
      │                            │yes
      │                            ▼
      │                    write a TableRun  (what changed, and by how much)
      │                            │
      │                            ▼
      │                 automations WHERE timetableId = …
      │                            │
      │        ┌───────────────────┼───────────────────┐
      │        ▼                   ▼                   ▼
      │   type="notebook"     type="whatsapp"      type="agent"
      │        │                                       │
      │        ▼                                       ▼
      │   appendFeedItem()                        agent run
      │   + regenerate the                        (recorded in
      │     affected page                          agent_runs)
      │        │
      └────────┘   the notebook now contains why it changed,
                   not just what it currently says
```

The reason this reads as thinking rather than reporting: the notebook page is
**regenerated from the same evidence executors that produced the original
answer**, so the new page can say *"this changed because…"* and cite the same
sources. It is not a notification bolted onto a document. It is the document
re-deriving itself and keeping the diff.

---

## What has to be built

Five pieces. They are independent enough to land one at a time, and the order
below is the order in which each one becomes testable.

### 1. Re-execution — make refresh actually refresh

`POST /api/timetables/[id]/refresh` re-runs the stored `tablespec` through the
compiler and executors, exactly as if the question had just been asked again.

- The TableSpec is already deterministic and already stored. This is not new
  logic; it is calling the existing path with a stored input.
- Store the result so the *next* refresh has something to compare against.
- Keep `lastRefreshAt`, and add `lastRunId`.

**Testable on its own:** refresh twice with no market change, get the same
result twice.

### 2. A run record and a diff — `table_runs`

A new table. This is the only schema addition the design needs beyond §3:

```prisma
model TableRun {
  id           String    @id @default(cuid())
  timetableId  String
  rows         Json      // the materialised result
  rowHash      String    // for a cheap "did anything change" check
  diff         Json?     // null on the first run
  createdAt    DateTime  @default(now())

  timetable    TimeTable @relation(fields: [timetableId], references: [id])

  @@index([timetableId, createdAt])
  @@map("table_runs")
}
```

The diff is the product, not a byproduct. It should be shaped so a sentence can
be written from it without an LLM: *which rows entered, which left, which
metrics moved and by how much*. An LLM then writes the prose; it does not decide
what changed.

**Design note, unresolved:** how much history to keep. Every run for a
`realtime` table is a lot of JSON. Options are a retention window, or storing
only runs whose `rowHash` differs from the previous one. The second is probably
right — an unchanged run is not a run worth keeping — but it makes "when did we
last check" a separate field from "when did it last change". Both are worth
having, and they are not the same question.

### 3. `MarketBook` needs to know where it came from

This is the one gap in the existing schema. A notebook today has `subject` (a
string) and no reference to the Time Table that produced it:

```prisma
model MarketBook {
  // add:
  timetableId String?
  timetable   TimeTable? @relation(fields: [timetableId], references: [id])
}
```

Nullable, because notebooks that were written by hand must keep working. But a
notebook created *from* a Time Table carries the link, and that link is what
lets a change find the page it should update.

Without this, everything else still works and the notebook still cannot notice
anything. **This is the smallest change in the document and the one that makes
it a loop rather than a pipeline.**

### 4. Automations become real — give `prisma.automation` its first caller

The table exists. It needs:

- a writer: "notify me / feed my notebook / run this agent when this table
  changes", attached to a `timetableId`
- a reader in the refresh path: after a diff, load the enabled automations for
  that Time Table and dispatch them
- `type` starts as exactly two values — `"notebook"` and `"agent"`. WhatsApp and
  email are already named in the model's comment and can wait; they add delivery
  concerns (rate limits, opt-out, templates) that have nothing to do with proving
  the loop works.

**The `"notebook"` handler is four lines of existing API:** `appendFeedItem()`
with the diff as `detail`, then `generateBookPages()` for the affected page
types.

### 5. Agent runs get recorded

`prisma.agentRun` has no callers. When an automation of type `"agent"` fires, it
executes an `agent_definition` and writes `agent_runs` + `agent_messages`. That
is what makes the Automation Studio's history view have anything to show, and
what makes an automation auditable after the fact — which, for a product whose
whole claim is evidence, is not optional.

---

## What this does *not* solve

Stated plainly, so nobody reads this document as a finished plan.

- **Scheduling.** Something has to call refresh for `daily` and `realtime`
  tables. Vercel Cron is the obvious answer and the platform repo already uses
  it (`vercel.json → crons`), but nothing here specifies frequency, fan-out, or
  what happens when a refresh takes longer than the interval.
- **Cost.** Every refresh is database work, and every regenerated page is an LLM
  call. A hundred `realtime` tables is a bill nobody has estimated. The
  `refreshPolicy` enum is the throttle, but the numbers behind it are not set.
- **Noise.** A market moves a little every day. Without a materiality threshold,
  the feed becomes a stream nobody reads, which is worse than no feed. The
  threshold belongs in the automation's `config`, and its default matters more
  than most defaults.
- **The front door.** `/automations` and `/automation-runtime` are hidden
  deliberately. This design gives the studio a reason to be public again, but
  the customer-facing surface is not designed here.

---

## Why this is the right next thing

Not because it adds a feature — because it connects five things that are already
built and currently ignore each other. The executors, the TableSpec, the
notebook generator, the automations table and the agent runtime were each built
to a real standard, and each one stops at its own edge.

The measure of whether it worked: **a notebook page that changed while nobody
was looking at it, and can say why.**
