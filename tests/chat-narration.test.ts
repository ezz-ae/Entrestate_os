import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { copilotSystemPrompt, copilotSystemPromptArabic } from "@/lib/copilot/tools"
import {
  STEP_FOR_TOOL,
  deeperAnalysisSuggestion,
  stepDetail,
  stepDoneLabel,
  stepResultCount,
  stepRunningLabel,
} from "@/lib/chat/steps"

/**
 * THE CHAT SPEAKS HUMAN, AND NARRATES ITS WORK — locked.
 *
 * The owner's verdict on the old chat, after watching real users: it went
 * silent, then dropped a row of numbers and enum codes; it greeted "dubai"
 * with "COMMANDS: SCREEN | PROJECT | AREA…"; it read like a puzzle site that
 * serves neither a wealthy investor whose tech ceiling is TikTok nor an agent
 * who sells every day. And it handed its internals to anyone who looked.
 *
 * The rebuild has four load-bearing pieces, each pinned here:
 *
 *   1. Every tool the route registers has a human step label in BOTH
 *      languages — a tool without one would narrate as nothing.
 *   2. The route streams the narration (x-chat-stream) and both transports
 *      finish through ONE payload builder.
 *   3. The welcome is a sentence, not a command syntax.
 *   4. The prompt demands: conclusion first, ONE recommendation, the closing
 *      deeper-analysis question, and no internal vocabulary — in EN and AR.
 */

const ROOT = process.cwd()
const routeSrc = fs.readFileSync(path.join(ROOT, "app/api/chat/route.ts"), "utf8")
const code = routeSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("every tool narrates as a human step", () => {
  const registered = [...code.matchAll(/^\s*([a-z_][a-z0-9_]*)\s*:\s*tool\(/gm)].map((m) => m[1])

  it("finds the toolset", () => {
    expect(registered.length).toBeGreaterThanOrEqual(10)
  })

  it("maps every registered tool to a step", () => {
    const unmapped = registered.filter((name) => !(name in STEP_FOR_TOOL))
    expect(unmapped, "add these to STEP_FOR_TOOL in lib/chat/steps.ts — an unmapped tool narrates as nothing").toEqual([])
  })

  it("gives every step both languages, and no internal words", () => {
    for (const tool of Object.keys(STEP_FOR_TOOL)) {
      for (const locale of ["en", "ar"] as const) {
        const running = stepRunningLabel(tool, locale)
        const done = stepDoneLabel(tool, 4, locale)
        expect(running.length, `${tool} ${locale} running`).toBeGreaterThan(5)
        expect(done.length, `${tool} ${locale} done`).toBeGreaterThan(5)
        for (const leak of ["API", "SQL", "_v1", "dld_", "mcp_", "tool"]) {
          expect(running, `${tool} ${locale} leaks "${leak}"`).not.toContain(leak)
        }
        if (locale === "ar") {
          expect(/[؀-ۿ]/.test(running), `${tool} arabic running is arabic`).toBe(true)
        }
      }
    }
  })

  it("counts rows safely and describes results without payloads", () => {
    expect(stepResultCount({ rows: [{}, {}, {}] })).toBe(3)
    expect(stepResultCount({ failed: true, rows: [{}] })).toBeNull()
    expect(stepResultCount("garbage")).toBeNull()
    const detail = stepDetail({ projects: [{ name: "Marina Vista" }, { name: "Golf Hills" }] }, "en")
    expect(detail).toContain("Marina Vista")
    expect(detail).not.toContain("{")
    expect(deeperAnalysisSuggestion("ar")).toContain("تحليل أعمق")
  })
})

describe("the route streams and converges", () => {
  it("offers the narrated transport", () => {
    expect(code).toContain('request.headers.get("x-chat-stream") === "1"')
    expect(code).toContain("x-ndjson")
    expect(code).toMatch(/for await \(const part of result\.fullStream\)/)
  })

  it("finishes both transports through one builder", () => {
    const calls = code.match(/buildFinalChatPayload\(\{/g) ?? []
    expect(calls.length, "the stream branch and the JSON branch must share the finisher").toBeGreaterThanOrEqual(2)
  })

  it("runs more than one step", () => {
    // maxSteps was v4 vocabulary hidden under an `as any`; the SDK ignored it
    // and the model got one tool call and no prose over it.
    expect(code).toContain("stopWhen: stepCountIs(6)")
    expect(code).not.toMatch(/maxSteps:/)
  })
})

describe("the welcome and the voice", () => {
  it("greets like a person, not a command terminal", () => {
    const guide = code.slice(code.indexOf("function buildTerminalCommandGuide"), code.indexOf("function extractProjectQuery"))
    expect(guide).not.toContain("COMMANDS:")
    expect(guide).not.toContain("SCREEN |")
    expect(guide).not.toContain("Awaiting command")
    expect(guide).toContain("مستشار")
  })

  it("demands the advisor shape in both prompts", () => {
    for (const [prompt, rec, closing] of [
      [copilotSystemPrompt, '"Recommendation:"', "Would you like a deeper analysis of these results?"],
      [copilotSystemPromptArabic, '"التوصية:"', "هل ترغب في تحليل أعمق للنتائج؟"],
    ] as const) {
      expect(prompt).toContain(rec)
      expect(prompt).toContain(closing)
    }
    expect(copilotSystemPrompt).toContain("NEVER show internal vocabulary")
    expect(copilotSystemPromptArabic).toContain("لا تُظهر المفردات الداخلية")
    // Natural conversation is allowed again — the old prompt forbade greeting.
    expect(copilotSystemPrompt).not.toContain("Never greet")
    expect(copilotSystemPrompt).toContain("natural, warm, short reply")
  })
})
