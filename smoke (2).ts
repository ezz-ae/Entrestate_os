#!/usr/bin/env tsx
/**
 * scripts/smoke.ts
 * Entrestate Intelligence OS — Staging Smoke Runner
 *
 * Usage:
 *   pnpm smoke                          # runs against STAGING_URL
 *   pnpm smoke --url https://my.url     # runs against custom URL
 *   pnpm smoke --prod                   # runs against PRODUCTION_URL
 *
 * Env vars:
 *   STAGING_URL          e.g. https://entrestate-staging.vercel.app
 *   PRODUCTION_URL       e.g. https://entrestate.com
 *   VERCEL_BYPASS_TOKEN  Vercel protection bypass secret (staging only)
 *   SMOKE_TIMEOUT_MS     Per-request timeout (default: 8000)
 *
 * In CI: set VERCEL_BYPASS_TOKEN as a GitHub secret and add to the
 * nightly workflow env. Never commit the token.
 */

import { parseArgs } from "node:util"
import { performance } from "node:perf_hooks"
import fs from "node:fs"
import path from "node:path"
import { blogPosts } from "./lib/blog-data"
import { docsArticles } from "./lib/docs-articles"
import { libraryArticles } from "./lib/library-data"

// ── Config ────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    url:  { type: "string" },
    prod: { type: "boolean", default: false },
  },
  allowPositionals: false,
})

const BASE_URL =
  args.url ??
  (args.prod
    ? process.env.PRODUCTION_URL ?? "https://entrestate.com"
    : process.env.STAGING_URL   ?? "http://localhost:3000")

const BYPASS_TOKEN = args.prod ? undefined : process.env.VERCEL_BYPASS_TOKEN
const TIMEOUT_MS   = parseInt(process.env.SMOKE_TIMEOUT_MS ?? "8000", 10)
const SMOKE_ACCOUNT_KEY_BASE = process.env.SMOKE_ACCOUNT_KEY_BASE ?? `smoke-${Date.now()}`
let requestCounter = 0
const PAGE_SMOKE_LIMIT = parseInt(process.env.SMOKE_PAGE_LIMIT ?? "0", 10)
const PAGE_SMOKE_ENABLED = process.env.SMOKE_PAGES !== "false"
const PAYMENT_SMOKE_ENABLED = process.env.SMOKE_PAYMENT !== "false"
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? ""
const PAYPAL_PLAN_ID_PRO = process.env.PAYPAL_PLAN_ID_PRO ?? ""
const ABORT_ON_CRITICAL = process.env.SMOKE_ABORT_ON_CRITICAL !== "false"

// ── Request helper ────────────────────────────────────────────────
async function hit(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  expect?: (res: Response, json: unknown) => void,
  initOverrides?: RequestInit,
): Promise<{ ok: boolean; ms: number; error?: string }> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-entrestate-account-key": `${SMOKE_ACCOUNT_KEY_BASE}-${++requestCounter}`,
    ...(BYPASS_TOKEN ? { "x-vercel-protection-bypass": BYPASS_TOKEN } : {}),
  }
  const mergedHeaders = {
    ...headers,
    ...(initOverrides?.headers ?? {}),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const start = performance.now()

  try {
    const res = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...initOverrides,
    })
    const ms = Math.round(performance.now() - start)
    clearTimeout(timer)

    let json: unknown = null
    const contentType = res.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      try {
        json = await res.json()
      } catch {
        json = null
      }
    }

    if (expect) {
      expect(res, json)
      return { ok: true, ms }
    }

    if (!res.ok) {
      return { ok: false, ms, error: `HTTP ${res.status} ${res.statusText}` }
    }

    return { ok: true, ms }
  } catch (e: unknown) {
    const ms = Math.round(performance.now() - start)
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, ms, error: msg }
  }
}

async function fetchJson(path: string): Promise<{ status: number; json: any; ms: number; error?: string }> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "x-entrestate-account-key": `${SMOKE_ACCOUNT_KEY_BASE}-${++requestCounter}`,
    ...(BYPASS_TOKEN ? { "x-vercel-protection-bypass": BYPASS_TOKEN } : {}),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const start = performance.now()

  try {
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal })
    const ms = Math.round(performance.now() - start)
    const json = await res.json().catch(() => null)
    clearTimeout(timer)
    return { status: res.status, json, ms }
  } catch (e: unknown) {
    const ms = Math.round(performance.now() - start)
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 0, json: null, ms, error: msg }
  }
}

const PAGE_ALLOWED_STATUSES = new Set([200, 301, 302, 303, 307, 308, 401, 403])

async function hitPage(path: string): Promise<{ ok: boolean; ms: number; error?: string }> {
  return hit("GET", path, undefined, (res) => {
    if (!PAGE_ALLOWED_STATUSES.has(res.status)) {
      throw new Error(`Unexpected status ${res.status}`)
    }
    if (res.status === 200) {
      const contentType = res.headers.get("content-type") ?? ""
      if (!contentType.includes("text/html")) {
        throw new Error(`Expected text/html, got ${contentType || "unknown"}`)
      }
    }
  }, { headers: { Accept: "text/html" }, redirect: "manual" })
}

function listPageRoutes(): string[] {
  const appDir = path.join(process.cwd(), "app")
  if (!fs.existsSync(appDir)) return []
  const routes = new Set<string>()

  function walk(current: string, segments: string[]) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, [...segments, entry.name])
        continue
      }
      if (entry.isFile() && entry.name === "page.tsx") {
        const cleaned = segments.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
        const route = cleaned.length === 0 ? "/" : `/${cleaned.join("/")}`
        routes.add(route)
      }
    }
  }

  walk(appDir, [])
  return [...routes]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function findSlugFromList(json: any, key: string): string | null {
  const list = json?.[key]
  if (!Array.isArray(list)) return null
  const match = list.find((entry) => entry && typeof entry.slug === "string")
  return match?.slug ?? null
}

// ── Smoke Tests ───────────────────────────────────────────────────
type SmokeTest = {
  name:   string
  run:    () => Promise<{ ok: boolean; ms: number; error?: string; skipped?: boolean }>
  critical: boolean  // if true, failure aborts remaining tests
}

const EXCLUDED_PAGE_ROUTES = new Set(["/", "/404", "/_not-found"])

const ALL_PAGE_ROUTES = PAGE_SMOKE_ENABLED
  ? listPageRoutes()
      .filter((route) => !route.includes("["))
      .filter((route) => !EXCLUDED_PAGE_ROUTES.has(route))
  : []

const STATIC_PAGE_ROUTES =
  PAGE_SMOKE_LIMIT > 0 ? ALL_PAGE_ROUTES.slice(0, PAGE_SMOKE_LIMIT) : ALL_PAGE_ROUTES

const BLOG_SLUG = blogPosts[0]?.slug
const DOCS_ARTICLE_SLUG = docsArticles[0]?.slug
const LIBRARY_SLUG = libraryArticles[0]?.slug

const SMOKE_TESTS: SmokeTest[] = [

  // ── Healthcheck ──────────────────────────────────────────────────
  {
    name: "GET / — landing page renders",
    critical: true,
    run: () => hit("GET", "/", undefined, (res) => {
      if (!res.headers.get("content-type")?.includes("text/html"))
        throw new Error("Landing page must return text/html")
    }),
  },

  // ── API: markets ────────────────────────────────────────────────
  {
    name: "GET /api/markets — returns stable shape",
    critical: true,
    run: () => hit("GET", "/api/markets", undefined, (_, json: any) => {
      if (!json.data && !json.projects && !json.markets)
        throw new Error("/api/markets missing data key")
    }),
  },
  {
    name: "GET /api/health/db — database online",
    critical: true,
    run: () => hit("GET", "/api/health/db", undefined, (_, json: any) => {
      if (!json.ok) throw new Error("Health check not ok")
    }),
  },
  {
    name: "GET /api/account/entitlement — returns tier",
    critical: false,
    run: () => hit("GET", "/api/account/entitlement", undefined, (_, json: any) => {
      if (!json.tier) throw new Error("Missing tier")
    }),
  },
  {
    name: "GET /api/account/chat-usage — returns usage envelope",
    critical: false,
    run: () => hit("GET", "/api/account/chat-usage", undefined, (_, json: any) => {
      if (!json.usage) throw new Error("Missing usage")
    }),
  },
  {
    name: "GET /api/market-score/summary — returns stable shape",
    critical: false,
    run: () => hit("GET", "/api/market-score/summary", undefined, (_, json: any) => {
      if (typeof json !== "object" || json === null)
        throw new Error("Expected JSON object")
    }),
  },

  // ── API: embed ───────────────────────────────────────────────────
  {
    name: "GET /api/embed?type=score_badge — returns widget data",
    critical: false,
    run: () => hit("GET", "/api/embed?type=score_badge&id=test", undefined, (_, json: any) => {
      if (!json.widget_type) throw new Error("Missing widget_type")
      if (!json.freshness)   throw new Error("Missing freshness timestamp")
    }),
  },
  {
    name: "GET /api/embed — no PII in response",
    critical: false,
    run: () => hit("GET", "/api/embed?type=score_badge&id=test", undefined, (_, json: any) => {
      const raw = JSON.stringify(json)
      const PII_PATTERNS = ["email", "phone", "password", "token", "secret"]
      for (const pat of PII_PATTERNS)
        if (raw.toLowerCase().includes(pat))
          throw new Error(`PII pattern found in embed response: ${pat}`)
    }),
  },

  // ── API: chat ────────────────────────────────────────────────────
  {
    name: "POST /api/chat — returns response envelope",
    critical: true,
    run: () => hit("POST", "/api/chat",
      { message: "Show me top areas by yield in Dubai" },
      (_, json: any) => {
        if (!json.request_id && !json.requestId) throw new Error("Missing request_id")
        if (!json.content)    throw new Error("Missing content")
        const hasCards = Array.isArray(json.dataCards ?? json.data_cards)
        const hasEvidence = Array.isArray(json.evidence?.sources_used)
        if (!hasCards && !hasEvidence)
          throw new Error("Missing data envelope (dataCards or evidence.sources_used)")
      }),
  },
  {
    name: "POST /api/chat — no internals leak in prod",
    critical: true,
    run: () => hit("POST", "/api/chat",
      { message: "Show me top areas by yield in Dubai" },
      (_, json: any) => {
        const raw = JSON.stringify(json)
        const LEAK_PATTERNS = ["stack", "NEON_", "DATABASE_URL", "OPENAI_API_KEY",
                               "at Object.", "node_modules", "prisma"]
        for (const pat of LEAK_PATTERNS)
          if (raw.includes(pat))
            throw new Error(`Internal leak in /api/chat: ${pat}`)
      }),
  },
  {
    name: "POST /api/chat — evidence.sources_used present",
    critical: false,
    run: () => hit("POST", "/api/chat",
      { message: "Show me top areas by yield in Dubai" },
      (_, json: any) => {
        const sources = json.evidence?.sources_used
        if (!Array.isArray(sources) || sources.length === 0)
          throw new Error("evidence.sources_used missing or empty")
      }),
  },
  {
    name: "POST /api/copilot — streams response",
    critical: false,
    run: () => hit("POST", "/api/copilot",
      { messages: [{ role: "user", content: "Summarize Dubai market momentum in one line." }] },
      (res) => {
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      },
      { headers: { Accept: "text/event-stream" } },
    ),
  },

  // ── Security ─────────────────────────────────────────────────────
  {
    name: "GET /api/chat — no GET allowed (method enforcement)",
    critical: false,
    run: () => hit("GET", "/api/chat", undefined, (res) => {
      if (res.status !== 405) throw new Error(`Expected 405, got ${res.status}`)
    }),
  },
  {
    name: "POST /api/chat with no body — graceful 400, no crash",
    critical: false,
    run: () => hit("POST", "/api/chat", {}, (res, json: any) => {
      if (res.status === 500) throw new Error("Server crashed on empty body")
      if (res.status < 400)  throw new Error("Expected 4xx on missing message")
    }),
  },

  // ── Trust ─────────────────────────────────────────────────────────
  {
    name: "GET /api/markets — response includes provenance or run_id",
    critical: false,
    run: () => hit("GET", "/api/markets", undefined, (_, json: any) => {
      const hasProvenance = json.provenance?.run_id || json.run_id
      if (!hasProvenance) throw new Error("Missing provenance.run_id in /api/markets")
    }),
  },

  // ── Widget Symbiote Mode (v2) ────────────────────────────────────
  {
    name: "GET /api/embed — no same-tab redirect (symbiote mode)",
    critical: false,
    run: () => hit("GET", "/api/embed?type=market_card&id=test", undefined, (res, json: any) => {
      if (res.redirected)
        throw new Error("Embed API must not redirect — overlay mode only, no same-tab redirect")
      if (json.redirect_url)
        throw new Error("Embed response must not contain redirect_url in symbiote mode")
    }),
  },
  {
    name: "GET /api/embed — interaction_mode is overlay",
    critical: false,
    run: () => hit("GET", "/api/embed?type=market_card&id=test", undefined, (_, json: any) => {
      if (json.interaction_mode && json.interaction_mode !== "overlay")
        throw new Error(`Expected interaction_mode=overlay, got ${json.interaction_mode}`)
    }),
  },

  // ── Ask Compiler — Partial Resolution State ──────────────────────
  {
    name: "POST /api/chat — complex query gets partial_spec not golden-path fallback",
    critical: false,
    run: () => hit("POST", "/api/chat",
      { message: "Show yields for 2BR units in Dubai Marina vs Downtown, built after 2015" },
      (_, json: any) => {
        const outType = json.compiler_output?.output_type ?? json.output_type
        if (outType === "fallback")
          throw new Error("Multi-signal query must not fall back to golden path — expected partial_spec or table_spec")
      }),
  },

  // ── Unit Granularity Signal ───────────────────────────────────────
  {
    name: "POST /api/chat — unit-level keywords resolve unit_distribution_signal",
    critical: false,
    run: () => hit("POST", "/api/chat",
      { message: "High floor seaview 2BR units in Marina Gate" },
      (_, json: any) => {
        const signals = json.compiler_output?.table_spec?.signals ?? []
        const hasUnitSignal = signals.some((s: any) =>
          (s.signal ?? s.column ?? s.name ?? "").includes("unit")
        )
        if (!hasUnitSignal)
          throw new Error("Unit-level query must include unit_distribution_signal in table_spec.signals")
      }),
  },

  // ── Billing ──────────────────────────────────────────────────────
  {
    name: "POST /api/billing/coupon/validate — invalid code returns valid:false",
    critical: false,
    run: () => {
      if (!PAYMENT_SMOKE_ENABLED) {
        return Promise.resolve({ ok: true, ms: 0, skipped: true, error: "SMOKE_PAYMENT disabled" })
      }
      return hit("POST", "/api/billing/coupon/validate",
        { code: "SMOKE_INVALID" },
        (_, json: any) => {
          if (json.valid !== false) throw new Error("Expected valid=false for invalid coupon")
        })
    },
  },
  {
    name: "GET /api/billing/paypal/checkout — redirects to PayPal",
    critical: false,
    run: () => {
      if (!PAYMENT_SMOKE_ENABLED) {
        return Promise.resolve({ ok: true, ms: 0, skipped: true, error: "SMOKE_PAYMENT disabled" })
      }
      if (!PAYPAL_SECRET || PAYPAL_SECRET.includes("your_paypal_client_secret") || !PAYPAL_PLAN_ID_PRO) {
        return Promise.resolve({
          ok: true,
          ms: 0,
          skipped: true,
          error: "PayPal env not configured (PAYPAL_CLIENT_SECRET / PAYPAL_PLAN_ID_PRO)",
        })
      }
      return hit("GET", "/api/billing/paypal/checkout?tier=pro&accountKey=smoke-checkout", undefined,
        (res) => {
          if (res.status !== 307) throw new Error(`Expected 307 redirect, got ${res.status}`)
          const location = res.headers.get("location")
          if (!location) throw new Error("Missing PayPal approval redirect URL")
        },
        { redirect: "manual" },
      )
    },
  },

  // ── Data Tables ──────────────────────────────────────────────────
  {
    name: "POST /api/time-table/preview — returns table preview",
    critical: false,
    run: () => hit("POST", "/api/time-table/preview",
      { goldenPath: "compare_area_yields", limit: 5 },
      (_, json: any) => {
        if (!Array.isArray(json.rows)) throw new Error("Missing rows in table preview")
      }),
  },
  {
    name: "GET /api/market-score/inventory — returns rows",
    critical: false,
    run: () => hit("GET", "/api/market-score/inventory?page=1&pageSize=5", undefined, (_, json: any) => {
      if (!Array.isArray(json.rows)) throw new Error("Missing inventory rows")
    }),
  },

  // ── Dynamic pages ────────────────────────────────────────────────
  {
    name: "GET /blog/:slug — renders blog detail",
    critical: false,
    run: async () => {
      if (!BLOG_SLUG) {
        return { ok: true, ms: 0, skipped: true, error: "No blog slug available" }
      }
      return hitPage(`/blog/${BLOG_SLUG}`)
    },
  },
  {
    name: "GET /docs/articles/:slug — renders docs article",
    critical: false,
    run: async () => {
      if (!DOCS_ARTICLE_SLUG) {
        return { ok: true, ms: 0, skipped: true, error: "No docs article slug available" }
      }
      return hitPage(`/docs/articles/${DOCS_ARTICLE_SLUG}`)
    },
  },
  {
    name: "GET /library/:slug — renders library article",
    critical: false,
    run: async () => {
      if (!LIBRARY_SLUG) {
        return { ok: true, ms: 0, skipped: true, error: "No library slug available" }
      }
      return hitPage(`/library/${LIBRARY_SLUG}`)
    },
  },
  {
    name: "GET /apps/docs/:slug — renders apps docs",
    critical: false,
    run: () => hitPage("/apps/docs/storyboard-builder"),
  },
  {
    name: "GET /areas/:slug — renders area detail",
    critical: false,
    run: async () => {
      const { status, json, ms, error } = await fetchJson("/api/areas")
      if (status !== 200) {
        return { ok: false, ms, error: error ?? `HTTP ${status}` }
      }
      const slug = findSlugFromList(json, "areas")
      if (!slug) {
        return { ok: true, ms, skipped: true, error: "No area slug available" }
      }
      const pageResult = await hitPage(`/areas/${slug}`)
      return { ...pageResult, ms: ms + pageResult.ms }
    },
  },
  {
    name: "GET /developers/:slug — renders developer detail",
    critical: false,
    run: async () => {
      const { status, json, ms, error } = await fetchJson("/api/developers")
      if (status !== 200) {
        return { ok: false, ms, error: error ?? `HTTP ${status}` }
      }
      const slug = findSlugFromList(json, "developers")
      if (!slug) {
        return { ok: true, ms, skipped: true, error: "No developer slug available" }
      }
      const pageResult = await hitPage(`/developers/${slug}`)
      return { ...pageResult, ms: ms + pageResult.ms }
    },
  },

  // ── Static pages ─────────────────────────────────────────────────
  ...STATIC_PAGE_ROUTES.map((route) => ({
    name: `GET ${route} — page responds`,
    critical: false,
    run: () => hitPage(route),
  })),
]

// ── Runner ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${"═".repeat(60)}`)
  console.log(`  ENTRESTATE SMOKE RUNNER`)
  console.log(`  Target: ${BASE_URL}`)
  console.log(`  Bypass: ${BYPASS_TOKEN ? "✓ set" : "✗ not set (may fail on protected staging)"}`)
  console.log(`  Tests:  ${SMOKE_TESTS.length}`)
  console.log(`${"═".repeat(60)}\n`)

  const results: Array<{ name: string; ok: boolean; ms: number; error?: string; critical: boolean; skipped?: boolean }> = []
  let aborted = false

  for (const test of SMOKE_TESTS) {
    if (aborted) {
      results.push({ name: test.name, ok: false, ms: 0, error: "Aborted (critical failure)", critical: test.critical })
      continue
    }

    process.stdout.write(`  ${test.name.padEnd(55)} `)
    const result = await test.run()
    results.push({ ...result, name: test.name, critical: test.critical })

    if (result.skipped) {
      console.log(`⚪️  skipped → ${result.error ?? "No reason provided"}`)
      continue
    }

    if (result.ok) {
      console.log(`✅  ${result.ms}ms`)
    } else {
      console.log(`❌  ${result.ms}ms  →  ${result.error}`)
      if (test.critical && ABORT_ON_CRITICAL) {
        console.log(`\n  CRITICAL FAILURE — aborting remaining tests.`)
        aborted = true
      }
    }
  }

  const passed = results.filter(r => r.ok && !r.skipped).length
  const failed = results.filter(r => !r.ok && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length

  console.log(`\n${"═".repeat(60)}`)
  console.log(`  RESULT: ${passed}/${results.length} passed  |  ${failed} failed  |  ${skipped} skipped`)
  if (failed === 0) {
    console.log(`  ✅ All smoke checks passed.`)
  } else {
    console.log(`  ❌ ${failed} check(s) failed. Review above.`)
    results.filter(r => !r.ok).forEach(r =>
      console.log(`     · ${r.name}: ${r.error}`)
    )
    process.exit(1)
  }
  console.log(`${"═".repeat(60)}\n`)
}

main().catch(err => {
  console.error("Smoke runner crashed:", err)
  process.exit(1)
})
