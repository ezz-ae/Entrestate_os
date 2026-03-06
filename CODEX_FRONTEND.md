
# CODEX PROMPT #1 — Frontend Content Transformation
# entrestate.com → AI-native Decision Infrastructure

You are building the frontend for entrestate.com, a UAE Real Estate Decision Copilot.
The site is Next.js 14+ with App Router, deployed on Vercel, backed by Neon PostgreSQL.

## DATABASE CONNECTION
The Neon connection string is in env var DATABASE_URL.
All content comes from these 3 NEW tables (already populated in Neon):

### 1. entrestate_top_data (10 rows) → /top-data page
```sql
SELECT id, section, title, subtitle, data_json, display_order, confidence, last_updated
FROM entrestate_top_data WHERE is_live = true ORDER BY display_order;
```
Sections: market-pulse, timing-signals, stress-grades, affordability,
outcome-intents, top-projects, area-intelligence, developer-reliability,
golden-visa, trust-bar

### 2. entrestate_homepage (6 rows) → / homepage
```sql
SELECT id, section, content_json, display_order
FROM entrestate_homepage WHERE is_live = true ORDER BY display_order;
```
Sections: hero, three-surfaces, golden-paths, intent-routing, trust-section, pricing

### 3. entrestate_api_content (10 rows) → API route documentation
```sql
SELECT endpoint, method, description, tier_required
FROM entrestate_api_content WHERE is_live = true ORDER BY endpoint;
```

## HOMEPAGE TRANSFORMATION

Replace the current homepage with these 6 sections (read from entrestate_homepage):

### Section 1: Hero
- Headline: "UAE Real Estate Decision Copilot"
- Subheadline: "Not a listing portal. A decision infrastructure."
- Stats bar: 7,015 projects | 180 data points | 593 HIGH confidence | 2,667 BUY signals
- CTA: "Start Decision Tunnel" (primary) | "Explore Market Data" (secondary)

### Section 2: Three Surfaces
Three equal cards side by side:
1. Decision Tunnel (chat icon) — "Tell us your goal. We collapse the ambiguity."
2. Time Table Builder (table icon) — "Build, save, and compare market data tables."
3. Spatial Trust Map (map icon) — "Supply pressure heatmaps. Cluster archetypes."

### Section 3: Golden Path Shortcuts
Horizontal row of 5 buttons:
[Underwrite Development Site] [Compare Area Yields] [Draft SPA Contract]
[Golden Visa Qualifier] [Stress Test Portfolio]

### Section 4: Intent Routing
"What's Your Outcome?" — 6 intent cards with project counts:
- Yield Seeking (1,510) | Golden Visa (1,055) | Capital Growth (1,177)
- First Time Buyer (3,887) | Trophy Asset (483) | Conservative (1,806)

### Section 5: Trust Section
"Verify the Math" — Trust bar showing verified rows, confidence level, refresh timestamp
Methodology: "5-Layer Truth Hierarchy: L1 Canonical → L2 Derived → L3 Dynamic → L4 External → L5 Raw"

### Section 6: Pricing
4 tiers: Starter (Free) | Pro ($299/mo) | Team ($999/mo) | Institutional ($4,000/mo)

## /top-data PAGE TRANSFORMATION

Build a full-page dashboard reading from entrestate_top_data.
Each section renders based on its data_json structure:

1. market-pulse → Hero stats (big numbers)
2. timing-signals → 3-column BUY/HOLD/WAIT with counts + avg prices
3. stress-grades → Bar chart A through F with project counts
4. affordability → Tier cards (ultra-affordable → ultra-luxury) with yield + buy signals
5. outcome-intents → Intent cards with project counts (same as homepage but expanded)
6. top-projects → Table: name, area, developer, price, yield, stress grade, timing, god metric
7. area-intelligence → Map or grid: area, projects, avg price, efficiency, supply pressure
8. developer-reliability → Leaderboard: developer, reliability score, projects, safe count
9. golden-visa → Feature card: eligible count, avg price, safe count, buy signals
10. trust-bar → Methodology panel: confidence distribution, 5-layer hierarchy, 4 engines

Every section must show:
- Confidence badge (HIGH/MEDIUM/LOW) from the confidence column
- Last updated timestamp from last_updated column

## DESIGN SYSTEM
- Dark theme (dark navy/charcoal background, white text, accent blue/green for signals)
- BUY = green, HOLD = amber, WAIT = red
- Grade A = dark green, B = green, C = amber, D = orange, F = red
- HIGH confidence = green badge, MEDIUM = amber, LOW = gray
- All numbers formatted: AED 1,234,567 | 6.5% yield | Score 82.3
- Responsive: desktop 3-column grid, mobile single column

## API ROUTES (app/api/)
Create these Next.js API routes that query inventory_full directly:

### /api/top-data (GET) — starter tier
```sql
SELECT * FROM entrestate_top_data WHERE is_live = true ORDER BY display_order;
```

### /api/market-pulse (GET) — starter tier
```sql
SELECT COUNT(*) as total,
       ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) as avg_price,
       ROUND(AVG(l1_canonical_yield::numeric) FILTER (WHERE l1_canonical_yield > 0), 1) as avg_yield,
       COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END) as buy_signals,
       COUNT(CASE WHEN l1_confidence = 'HIGH' THEN 1 END) as high_confidence
FROM inventory_full;
```

### /api/deal-screener (POST) — pro tier
Accept filters: area, budget_max, beds, handover_months, golden_visa, timing_signal
Query inventory_full with L1-L3 columns, return ranked by engine_god_metric

### /api/evidence-drawer/:projectName (GET) — pro tier
```sql
SELECT name, evidence_sources, evidence_exclusions, evidence_assumptions,
       l1_confidence, l1_source_coverage, engine_god_metric
FROM inventory_full WHERE name = $1;
```

## IMPLEMENTATION ORDER
1. Create lib/db.ts (Neon connection pool)
2. Create app/api/top-data/route.ts
3. Create app/api/market-pulse/route.ts
4. Create app/page.tsx (homepage from entrestate_homepage)
5. Create app/top-data/page.tsx (dashboard from entrestate_top_data)
6. Create app/api/deal-screener/route.ts
7. Create app/api/evidence-drawer/[name]/route.ts
8. Create components/ for each section type
9. Add Stripe billing integration
10. Add auth middleware for tier gating
