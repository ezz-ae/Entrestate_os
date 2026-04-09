# ENTRESTATE — Unified Enterprise Decision Infrastructure
## One System. One API. One Acquisition Target.

**Version:** Production | **Date:** April 2026
**Data:** 2,813 projects + 7,217 leasing folders + 36,841 DLD transactions
**Coverage:** 167 areas, 75 developers, 7 UAE cities

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTRESTATE DECISION PLATFORM                     │
│                                                                     │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  INTELLIGENCE  │  │    LEASING        │  │    MCP BRIDGE        │ │
│  │  OS            │→→│    INFRASTRUCTURE │→→│    (AI Layer)        │ │
│  │                │  │                    │  │                      │ │
│  │  /api/intel/*  │  │  /api/tx/*         │  │  /api/mcp/*          │ │
│  │  12 endpoints  │  │  15 endpoints      │  │  7 tools             │ │
│  └───────────────┘  └──────────────────┘  └──────────────────────┘ │
│           │                   │                      │              │
│  ┌────────┴───────────────────┴──────────────────────┴────────┐    │
│  │                    NEON POSTGRES                             │    │
│  │  raw → canonical → api → entrestate                               │    │
│  │  13t + 11t + 33t + 40t = unified schema             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Architecture — 3 Modules, 34 Endpoints

### Module 1: Intelligence API (`/api/intel/`)

The brain. Computes signals from math, not opinions.

| Endpoint | Method | What It Returns | Formula Object |
|---|---|---|---|
| `/api/intel/screen` | POST | Filtered projects by criteria | V1 Signal Engine |
| `/api/intel/project/:id` | GET | Full project with all scores | 21 sub-scores + composite |
| `/api/intel/project/:id/evidence` | GET | Evidence drawer: why this score | Source attribution per signal |
| `/api/intel/compare` | POST | Side-by-side project comparison | Delta analysis across all dimensions |
| `/api/intel/area/:slug` | GET | Area profile with benchmarks | DLD + benchmark cross-reference |
| `/api/intel/area/:slug/projects` | GET | All projects in area | Sorted by investment score |
| `/api/intel/developer/:slug` | GET | Developer profile + trust signals | Reliability score + portfolio analysis |
| `/api/intel/developer/:slug/projects` | GET | Developer portfolio | With completion track record |
| `/api/intel/market/pulse` | GET | Market overview: stress, timing, velocity | DLD transaction analysis |
| `/api/intel/market/top-data` | GET | Homepage sections: buy signals, yields, GV | Curated from V1 scores |
| `/api/intel/search` | POST | Natural language → structured query | Query parser + vector search |
| `/api/intel/memo` | POST | Investment memo for project set | Auto-generated from evidence |

**Data sources:** `canonical.inventory_clean` (2,813 projects), `api.dld_transactions_v1` (36,841), `canonical.dld_area_benchmarks_live` (183 areas)

**Signal Engine V1 — 4 Score Dimensions:**
- **Timing Score** (0-100): Launch window × handover reliability × market cycle position
- **Stress Score** (0-100): Supply pressure × price drift × absorption rate → Grade A-F
- **Yield Score** (0-100): Gross yield × vacancy adjustment × spread vs area median
- **Evidence Score** (0-100): Source count × recency × cross-consistency → confidence level

**Composite:** `investment_score` = weighted(timing, stress, yield, evidence) → BUY / HOLD / WAIT

---

### Module 2: Leasing API (`/api/tx/`)

The hands. Executes transactions deterministically.

| Endpoint | Method | What It Does | Rule Engine |
|---|---|---|---|
| `/api/tx/ingest/url` | POST | Parse external URL → structured workspace | Authority-before-import |
| `/api/tx/ingest/portfolio` | POST | Bulk ingest from mega-landlord | Wholesale Portfolio API |
| `/api/tx/spine/match` | POST | Match listing against property spine | Canonical identity resolution |
| `/api/tx/trust/collision` | POST | Genetic collision detection | Vector distance < 0.01 = block |
| `/api/tx/trust/sybil` | POST | Network hash + address check | Invisible to user |
| `/api/tx/consent/overlap` | GET | Channel intersection computation | Zero-knowledge reveal |
| `/api/tx/hold/request` | POST | Lock unit or queue tenant | 48h hold, milestone-gated |
| `/api/tx/hold/extend` | POST | Extend hold if milestone exists | Max 2, qualifying event required |
| `/api/tx/queue/promote` | POST | Promote next queue candidate | Verified priority, cooldown-aware |
| `/api/tx/recovery/bounce` | POST | Find 95% genetic match | Vector similarity in <50ms |
| `/api/tx/workspace/:id` | GET | Full transaction workspace | All computed fields |
| `/api/tx/workspace/:id/transition` | POST | State machine transition | 22 valid paths enforced |
| `/api/tx/contract/generate` | POST | Template merge → agreement draft | Negotiated terms + template |
| `/api/tx/contract/sign` | POST | Record signature | Dual-party tracking |
| `/api/tx/messaging/classify` | POST | WhatsApp intent → safe buttons | 8 intents, never mutates from text |

**Data sources:** `entrestate.folders` (7,217), `entrestate.listing_imports` (5,358), 40 tables, 9 PL/pgSQL functions

**State Machine — 22 Transitions:**
```
draft → review_needed → ready → published → held_primary →
  in_negotiation → in_contact_consent → in_contract →
  signed → deposit_pending → rented → archived
```
Every invalid transition rejected with reason. No edge cases.

---

### Module 3: MCP Bridge (`/api/mcp/`)

The nervous system. Connects any AI model to both layers.

| Tool | Intelligence API | Leasing API | What It Does |
|---|---|---|---|
| `search_mapped_city` | ✅ Vector search | ✅ Published folders | Find matching properties |
| `request_primary_hold` | | ✅ Hold/queue | Lock unit for tenant |
| `attempt_publish` | | ✅ Sybil Firewall | Fraud-check before publish |
| `get_folder_detail` | ✅ Scores | ✅ Workspace | Full property intelligence |
| `check_consent_overlap` | | ✅ Contact protocol | Channel intersection |
| `get_queue_status` | | ✅ Queue state | Priority positions |
| `classify_whatsapp_intent` | | ✅ Intent routing | Classify → buttons |

**Invisible Instruction Pattern:**
When a tool returns `{"instruction": "..."}`, the AI silently follows it.
The user never sees the internal logic. Examples:
- Sybil block → "Upload your Title Deed" (never reveals duplicate)
- Cooldown → "Try similar units" (never reveals restriction)
- No consent overlap → "Choose a common method" (never reveals other party's choices)

**Model-agnostic:** Works with Gemini, Claude, GPT, or any future LLM via MCP standard.

---

## Database Architecture — Separated Data Platform

| Schema | Purpose | Tables | Key Assets |
|---|---|---|---|
| `raw` | Unprocessed source data | 13 | `inventory_full` (7,015), `dld_transactions_arvo` (36,841) |
| `canonical` | Cleaned, scored truth layer | 11 | `inventory_clean` (2,813), `dld_area_benchmarks_live` (183) |
| `api` | Read-optimized views | 33 | `entrestate_inventory`, `entrestate_developers_api`, `entrestate_areas_api` |
| `entrestate` | Leasing infrastructure | 40 | 9 functions, 9 API views, 22 state transitions |

**Data flow:** Raw sources → Canonical cleaning + scoring → API views → Leasing workspace

---

## What Makes This One System (Not Pieces)

### 1. Shared Property Spine
Intelligence OS and Leasing Infrastructure share the same `canonical.inventory_clean` truth layer.
When a listing is ingested via `/api/tx/ingest/url`, it's matched against the same spine that powers `/api/intel/project/:id`.

### 2. Cross-Module Signals
The leasing system uses intelligence scores to:
- **Priority queue**: Higher investment_score → higher queue priority
- **Soft-bounce matching**: Vector similarity uses the same genome that powers screening
- **Publish gating**: Anomaly detection draws from the same spine

### 3. Unified Audit Trail
`entrestate.audit_log` captures events across all modules:
- Intelligence: score computations, evidence changes
- Leasing: hold grants, queue promotions, contact reveals, state transitions
- MCP: tool calls, instruction dispatches

### 4. Single MCP Bridge
One MCP server exposes tools from both layers. An AI agent can:
1. Search intelligence data ("Show me A-grade projects in Marina")
2. Execute a transaction ("Hold that one for me")
3. Monitor status ("What's my queue position?")
...all in one conversation, one protocol, one connection.

---

## Enterprise Integration — White-Label Ready

### For a Legacy Portal (enterprise portal)

```
THEIR FRONTEND (unchanged)
      ↓
  ENTRESTATE API (invisible layer)
      ↓
  THEIR DATABASE (enriched by Entrestate)
```

**Zero frontend changes required.** Pure API layer. White-labeled under their brand.

### Integration Steps
1. **Day 1:** Connect `/api/tx/ingest/url` to their listing creation flow
2. **Day 2:** Enable `/api/tx/trust/collision` at point of publish
3. **Week 1:** Roll out `/api/tx/hold/request` for inventory management
4. **Week 2:** Activate `/api/intel/screen` for tenant-facing search
5. **Month 1:** Full leasing workflow: holds, queue, consent, contracts

### ROI (Quantified)

| Pain Point | Current Cost | With Entrestate | Savings |
|---|---|---|---|
| Fake listing moderation | 20-50 FTE × AED 180K | Genetic Collision Engine | AED 3.6-9M/yr |
| Leaked intent (bounced leads) | 40% sessions bounce | Demand Redistribution | AED 25-50M recovered |
| Agent data entry | 45 min/listing × 10K/mo | Delta-only onboarding | 90% reduction |
| Inventory freeze | 30% listings frozen | Milestone-gated holds | 40% reduction |
| Privacy violations | AED 500K-5M per incident | Double-blind protocol | Risk elimination |

---

## Delivery Timeline (if building from scratch)

| Phase | Focus | Days | Key Deliverable |
|---|---|---|---|
| 0 | Base Platform | 22 | Auth, folders, spine, vault |
| 1 | Correctness | 25 | Authority engine, anomaly detection, publish gating |
| 2 | Liquidity | 23 | Holds, queue, milestone extensions, cooldowns |
| 3 | Trust & Close | 26 | Consent overlap, deal rooms, contract assembly |
| 4 | Leverage | 18 | Verification vault, yield nudges, priority boost |
| 5 | External Rails | 23 | WhatsApp routing, payments, enterprise API |
| **Total** | | **137 days** | **~26 weeks with 1 engineer** |

**But it's already built and running against real data.**

---

## Tracer Bullet Demo — 35 Seconds, Real Data

| # | Step | Time | Proves |
|---|---|---|---|
| 1 | Paste URL → Workspace | <0.1s | Zero manual entry, authority-before-import |
| 2 | Sybil Firewall | <0.05s | Automated fraud detection, invisible to user |
| 3 | Tenant Discovery | <0.02s | Deterministic SQL, not a chatbot wrapper |
| 4 | Hold + Queue | <0.07s | Liquidity management, no inventory freeze |
| 5 | Soft-Bounce Recovery | <0.02s | Zero leaked intent, $50M/yr value prop |
| 6 | Contact Protocol | <0.05s | Privacy by architecture, not policy |
| 7 | WhatsApp Intent | <0.05s | Controlled communication, full audit trail |
| 8 | State Machine | <0.05s | 22 transitions, invalid rejected with reason |

All steps execute against **7,217 real leasing folders** from live intake.

---

## The One-Line Pitch

> **Entrestate is a decision infrastructure platform that turns chaotic real estate data into structured, fraud-checked, transaction-ready deal rooms — powered by math, not chat.**

---

## Files in This Package

| File | Content | Audience |
|---|---|---|
| `FULL_WORK.md` | Complete system documentation | Technical due diligence |
| `LEASING_INFRASTRUCTURE.md` | Deep dive: execution layer | CTO / VP Engineering |
| `DEMO_PAGE.md` | 8-step demo build guide | Frontend team |
| `FINALIZATION.md` | **This file.** Unified architecture | Everyone |

All artifacts stored in Neon (`entrestate.generated_artifacts`) and as local files.
