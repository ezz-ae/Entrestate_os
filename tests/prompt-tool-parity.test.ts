import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { copilotSystemPrompt, copilotToolDescriptions } from "@/lib/copilot/tools"

/**
 * A COMMAND THE PROMPT PROMISES MUST HAVE A TOOL ON EVERY ENDPOINT THAT SERVES IT.
 *
 * Two endpoints answer chat with the same system prompt: /api/copilot (the
 * Decision Terminal) and /api/chat (the Explorer Desk on /markets, and the one
 * customers actually reach first). They built their toolsets separately, and
 * /api/chat was missing compare_projects.
 *
 * Nothing failed. The prompt still told the model to convert every question
 * into one of seven commands, COMPARE among them, so "Compare Emaar vs Damac
 * reliability" reached a model instructed to produce a comparison matrix with
 * no tool to build one from. It picked deal_screener and returned eight
 * Jumeirah Village Circle listings by Imtiaz, Danube, Azizi and Binghatti:
 * correct rows, correct SQL, a different question. That is worse than an error,
 * because it looks like an answer.
 *
 * Two lists that must agree, and nothing forcing them to — the same defect as
 * the vendor allowlist, the orphan modules and the schema-qualified tables. So
 * it is a test:
 *
 *   1. Every tool the prompt NAMES exists in copilotToolDescriptions.
 *   2. Every tool in copilotToolDescriptions that either endpoint registers is
 *      registered by BOTH — one endpoint may not quietly answer more than the
 *      other while both advertise the same commands.
 */

const ROOT = process.cwd()
const ENDPOINTS = ["app/api/chat/route.ts", "app/api/copilot/route.ts"]

/** The tools an endpoint hands the model: `<name>: tool({` inside its toolset. */
function registeredTools(rel: string): Set<string> {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
  // Comments explain; they do not register a tool. Strip them before scanning,
  // or a guard trips on the paragraph explaining the guard — which this
  // codebase has now done three times.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  return new Set([...code.matchAll(/^\s*([a-z_][a-z0-9_]*)\s*:\s*tool\(/gm)].map((m) => m[1]))
}

const perEndpoint = new Map(ENDPOINTS.map((e) => [e, registeredTools(e)] as const))

describe("the prompt and the toolsets", () => {
  it("names only tools that exist", () => {
    const named = [...copilotSystemPrompt.matchAll(/\b([a-z][a-z0-9_]*_[a-z0-9_]+)\b/g)].map((m) => m[1])
    const known = new Set(Object.keys(copilotToolDescriptions))
    // Column and label names also carry underscores; only check words the
    // prompt presents as a tool, i.e. ones that are a known tool or look like
    // one that was renamed away.
    const suspicious = named.filter((n) => n.endsWith("_projects") || n.endsWith("_screener") || n.endsWith("_check")
      || n.endsWith("_brief") || n.endsWith("_diligence") || n.endsWith("_benchmark") || n.endsWith("_memo"))
    const missing = [...new Set(suspicious)].filter((n) => !known.has(n))
    expect(missing, "the prompt tells the model to call a tool that does not exist").toEqual([])
  })

  it("registers the same tools on every endpoint that serves the prompt", () => {
    const [a, b] = ENDPOINTS
    const only = (x: string, y: string) => [...perEndpoint.get(x)!].filter((t) => !perEndpoint.get(y)!.has(t)).sort()
    expect(
      only(a, b),
      `${a} answers commands ${b} cannot — both serve the same system prompt`,
    ).toEqual([])
    expect(
      only(b, a),
      `${b} answers commands ${a} cannot — both serve the same system prompt`,
    ).toEqual([])
  })

  it("backs every command in the prompt with at least one registered tool", () => {
    // The seven commands, and a tool on each endpoint that can answer it.
    const backing: Record<string, string[]> = {
      SCREEN: ["deal_screener"],
      PROJECT: ["price_reality_check"],
      AREA: ["area_risk_brief", "dld_area_benchmark"],
      COMPARE: ["compare_projects", "developer_due_diligence", "dld_area_benchmark"],
      RISK: ["price_reality_check", "developer_due_diligence"],
      MEMO: ["generate_investor_memo"],
      PULSE: ["dld_market_pulse"],
    }
    for (const [command, tools] of Object.entries(backing)) {
      expect(copilotSystemPrompt, `${command} is not in the prompt`).toContain(command)
      for (const endpoint of ENDPOINTS) {
        const have = perEndpoint.get(endpoint)!
        expect(
          tools.some((t) => have.has(t)),
          `${endpoint} advertises ${command} with none of ${tools.join(", ")}`,
        ).toBe(true)
      }
    }
  })

  it("tells the model which tool answers which kind of comparison", () => {
    // "Compare Emaar vs Damac" has no project in it; without this the model
    // reaches for the screener and answers about other developers entirely.
    expect(copilotSystemPrompt).toMatch(/developers\s*→\s*developer_due_diligence/)
    expect(copilotSystemPrompt).toMatch(/projects\s*→\s*compare_projects/)
    expect(copilotSystemPrompt).toMatch(/areas\s*→\s*dld_area_benchmark/)
  })
})
