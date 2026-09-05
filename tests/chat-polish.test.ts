import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { sourceLabel } from "@/lib/format/sources"
import { followUpOnResult } from "@/lib/chat/final-text"
import { stepDoneLabel } from "@/lib/chat/steps"

/**
 * THE OWNER'S FIVE CHAT NOTES, PINNED — from one screenshot of a live answer:
 *
 *   1. "البوب أب جوه المربع بتاع الرسالة مربوط بحجمه … الأفضل يكون جوه الرد"
 *      — the report opens INSIDE the bubble, never as a modal over the chat.
 *   2. "قدام كل نتيجة زرار تخليه يكمل على النتيجة دي" — every result row
 *      offers a follow-up, and both surfaces send the identical one.
 *   3. "في الأدلة هو لسه بيعطي الكود بتاع الداتا" — sources are named.
 *   4. Three identical "Analysis complete" lines — steps narrate a count.
 *   5. "مربع في الشات فوق فيه كذا أوبشن مش بيشتغلوا" — the pills continue
 *      THIS conversation in human words, and are never silently disabled.
 *
 * Plus the one that froze the tab: 31 keys the canvas asked for that no
 * catalog had — guarded for good in tests/i18n-keys.test.ts.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("1 — the report lives inside the answer", () => {
  const narration = stripComments(read("components/chat/advisor-narration.tsx"))
  it("has no modal, no fixed overlay, and toggles in place", () => {
    expect(narration).not.toContain("ReportModal")
    expect(narration).not.toContain("fixed inset-0")
    expect(narration).toContain('aria-expanded={reportOpen}')
    expect(narration).toContain("إخفاء التقرير")
    expect(narration).toContain("Hide the report")
  })
})

describe("2 — every result row can continue the conversation", () => {
  it("the one renderer grows the button only when a surface hands in onPickRow", () => {
    const md = stripComments(read("components/chat-markdown.tsx"))
    expect(md).toContain("onPickRow?: (label: string) => void")
    expect(md).toContain("كمّل على ده")
    expect(md).toContain("Continue with this")
    expect(md).toContain("looksLikeName(row[0]")
  })

  it("both surfaces wire it through the same follow-up builder", () => {
    for (const rel of ["components/ChatInterface.tsx", "components/llm-search/sidebar.tsx"]) {
      const src = stripComments(read(rel))
      expect(src, rel).toContain("onPickRow=")
      expect(src, rel).toContain("followUpOnResult(")
    }
  })

  it("the follow-up speaks the answer's language and asks for a complete brief", () => {
    expect(followUpOnResult("The Palm Crown", "ar")).toBe("كمّل على The Palm Crown: التفاصيل الكاملة، المخاطر، والقرار.")
    expect(followUpOnResult("The Palm Crown", "en")).toContain("Continue on The Palm Crown")
    expect(followUpOnResult("  Bulgari Ocean Mansions ", "en")).toContain("Bulgari Ocean Mansions:")
  })
})

describe("3 — sources are named, never printed as identifiers", () => {
  it("maps the identifiers the tools emit", () => {
    expect(sourceLabel("deal_screener", "en")).toBe("The scored-inventory screen")
    expect(sourceLabel("dld_transactions_arvo", "ar")).toBe("سجلات صفقات دائرة الأراضي")
    expect(sourceLabel("dld_transactions_arvo + dld_area_benchmarks_live", "en")).toBe(
      "DLD transaction records + Live area benchmarks",
    )
  })
  it("de-snakes an identifier it has never seen and leaves sentences alone", () => {
    expect(sourceLabel("some_new_feed", "en")).toBe("Some new feed")
    expect(sourceLabel("Already a sentence.", "en")).toBe("Already a sentence.")
  })
  it("the evidence drawer builds its source lines through it", () => {
    const src = stripComments(read("components/ChatInterface.tsx"))
    expect(src).toContain('from "@/lib/format/sources"')
    expect(src).toContain("buildEvidenceDrawerData(message, locale)")
    expect(src).not.toContain('"TOOL FAILED')
  })
})

describe("4 — a direct query narrates what it checked", () => {
  it("counts instead of repeating a generic line", () => {
    expect(stepDoneLabel("mcp_query", 12, "en")).toBe("Checked 12 records")
    expect(stepDoneLabel("mcp_query", 12, "ar")).toBe("تم فحص 12 سجل")
    expect(stepDoneLabel("mcp_query", null, "en")).toBe("Checked the data")
  })
})

describe("5 — the pills continue this conversation and are never silently dead", () => {
  const src = stripComments(read("components/ChatInterface.tsx"))
  it("no prompt is about a project nobody asked for, and none speaks in column codes", () => {
    const prompts = [...src.matchAll(/prompt: ["'`]([^"'`]+)["'`]/g)].map((m) => m[1])
    expect(prompts.length).toBeGreaterThan(6)
    for (const prompt of prompts) {
      expect(prompt, prompt).not.toMatch(/_v1\b|stress_score|timing_label|investor_score_v1/)
    }
    // "Marina Vista" remains only where a person typed it as an EXAMPLE on the
    // landing cards — never as the silent default of a conversation pill.
    expect(src).not.toContain('?? "Marina Vista"')
  })
  it("the pill row is not disabled — sendPrompt explains instead", () => {
    const row = src.slice(src.indexOf("{commandPrompts.map((command) => {"), src.indexOf("{dynamicSuggestions.slice(0, 2)"))
    expect(row).not.toContain("disabled=")
  })
  it("the cheap word is off the chat surface", () => {
    expect(src).not.toMatch(/"Free usage/)
  })
})
