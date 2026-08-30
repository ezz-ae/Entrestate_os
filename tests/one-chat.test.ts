import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * ONE CHAT — locked.
 *
 * The owner, comparing the /markets desk to the main chat: "مينفعش يكون
 * عندنا ميت شات — هو واحد بس ويكون ملم بكل شيء، اللي أعمله هنا ألاقيه هناك."
 * The audit that followed found exactly the split he suspected: /markets ran
 * its own client store against /api/chat while the sidebar and /chat ran
 * useChat against /api/copilot — which still greeted with "Mode: Awaiting
 * command", FORCED a tool call on every step (toolChoice: "required", so the
 * advisor could not answer a thank-you), and persisted un-humanized text.
 *
 * The contract now:
 *   · ONE conversation: every surface renders the copilot provider's chat.
 *     The parallel explorer store and panel are deleted, not hidden.
 *   · ONE brain: both routes register the same toolset, greet through
 *     lib/chat/welcome.ts, and finish through lib/chat/final-text.ts.
 *   · ONE narration: steps timeline + report popup live in
 *     components/chat/advisor-narration.tsx and every chat surface imports it.
 */

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8")
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const chatRoute = strip(read("app/api/chat/route.ts"))
const copilotRoute = strip(read("app/api/copilot/route.ts"))

describe("one brain", () => {
  it("registers the same tools at both doors", () => {
    const names = (src: string) =>
      [...src.matchAll(/^\s{6}([a-z_][a-z0-9_]*): tool\(\{/gm)].map((m) => m[1]).sort()
    const chatTools = names(chatRoute)
    const copilotTools = names(copilotRoute)
    expect(chatTools.length).toBeGreaterThanOrEqual(10)
    expect(copilotTools).toEqual(chatTools)
  })

  it("lets the copilot converse instead of forcing a tool call", () => {
    expect(copilotRoute).toContain('toolChoice: "auto"')
    expect(copilotRoute).not.toContain('toolChoice: "required"')
  })

  it("persists through the final-text door", () => {
    expect(copilotRoute).toContain("humanizeFinalText(text")
  })
})

describe("one conversation", () => {
  it("the parallel explorer chat is gone", () => {
    expect(fs.existsSync(path.join(ROOT, "lib/explorer-chat-store.ts"))).toBe(false)
    expect(fs.existsSync(path.join(ROOT, "components/explorer-chat.tsx"))).toBe(false)
  })

  it("nothing imports a second chat store", () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (!["node_modules", ".next", ".git"].includes(entry.name)) walk(rel)
        } else if (/\.(ts|tsx)$/.test(entry.name) && !rel.startsWith("tests")) {
          if (read(rel).includes("explorer-chat-store")) offenders.push(rel)
        }
      }
    }
    for (const dir of ["app", "components", "lib"]) walk(dir)
    expect(offenders).toEqual([])
  })

  it("/markets speaks through the copilot provider", () => {
    const markets = read("app/markets/page.tsx")
    expect(markets).toContain('from "@/components/copilot-provider"')
    expect(markets).toContain("openSidebar()")
    expect(markets).toContain("sendMessage({ text:")
  })
})

describe("one narration", () => {
  it("every chat surface renders the shared narration", () => {
    for (const file of ["components/llm-search/sidebar.tsx", "components/ChatInterface.tsx"]) {
      const src = read(file)
      expect(src, `${file} must import the shared narration`).toContain(
        '@/components/chat/advisor-narration',
      )
      expect(src).toContain("ToolStepsTimeline")
      expect(src).toContain("AdvisorAnswer")
    }
  })

  it("the narration reads human labels and the final-text door", () => {
    const src = read("components/chat/advisor-narration.tsx")
    expect(src).toContain('from "@/lib/chat/steps"')
    expect(src).toContain('from "@/lib/chat/final-text"')
    expect(strip(src)).not.toContain("JSON.stringify")
  })

  it("the plumbing footer is gone from the main chat", () => {
    const src = strip(read("components/ChatInterface.tsx"))
    expect(src).not.toContain("request_id={")
    expect(src).not.toMatch(/\[\{toolTrace\}\]/)
  })
})
