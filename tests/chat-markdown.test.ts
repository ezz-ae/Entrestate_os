import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * ONE RENDERER FOR AN ASSISTANT ANSWER — locked.
 *
 * Four surfaces show an answer from the same model, and three of them printed
 * it with <p>{msg.content}</p>. The system prompt asks for COMPARE answers as a
 * markdown table, so /markets answered "Compare Emaar vs Damac" with a correct
 * eight-column table flattened into one grey paragraph of pipe characters. The
 * fourth surface had its own markdown renderer — headings, lists, emphasis, and
 * no table branch, the one construct the prompt actually asks for.
 *
 * Two rules:
 *
 *   1. NO SURFACE PRINTS AN ANSWER RAW. A new chat panel that renders content
 *      in a bare <p> fails here, because that is precisely how the last three
 *      were written and nobody noticed until a customer-facing answer was
 *      unreadable.
 *   2. THE RENDERER HANDLES WHAT THE PROMPT PRODUCES. Tables, headings, lists,
 *      emphasis and code — asserted against the shapes the model emits, so a
 *      "cleanup" that drops the table branch fails instead of shipping.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

function componentFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith(".tsx")) out.push(full)
    }
  }
  for (const d of ["app", "components"]) walk(path.join(ROOT, d))
  return out
}

/** <p …>{msg.content}</p> — an assistant answer printed as one paragraph. */
const RAW_ANSWER = /<p[^>]*>\s*\{\s*(?:msg|message|m)\.content\s*\}\s*<\/p>/

describe("every surface that shows an answer", () => {
  it("renders it through the shared renderer, never as a bare paragraph", () => {
    const offenders: string[] = []
    for (const file of componentFiles()) {
      const src = fs.readFileSync(file, "utf8")
      const rel = path.relative(ROOT, file).replace(/\\/g, "/")
      const lines = src.split("\n")
      lines.forEach((line, i) => {
        if (!RAW_ANSWER.test(line)) return
        // A user's own message is text they typed — no markdown to render.
        const around = lines.slice(Math.max(0, i - 6), i + 1).join("\n")
        if (/role\s*===\s*"user"/.test(around)) return
        offenders.push(`${rel}:${i + 1}`)
      })
    }
    expect(
      offenders,
      'render assistant text with <ChatMarkdown text={…} /> — a bare <p> flattens a markdown table into pipes',
    ).toEqual([])
  })

  it("imports it rather than growing a second copy", () => {
    for (const rel of [
      "components/ChatInterface.tsx",
      "components/ground-plays.tsx",
      "components/lead-agent-chat.tsx",
    ]) {
      const src = read(rel)
      expect(src, `${rel} must use the shared renderer`).toContain('from "@/components/chat-markdown"')
      expect(
        src.includes("function ChatMarkdown("),
        `${rel} defines its own ChatMarkdown — there is one, in components/chat-markdown.tsx`,
      ).toBe(false)
    }
  })
})

describe("the renderer covers what the prompt asks the model to produce", () => {
  const src = read("components/chat-markdown.tsx")

  it("builds a real table from a pipe table", () => {
    // The COMPARE / SCREEN answers arrive exactly like this.
    expect(src).toMatch(/isTableRow/)
    expect(src).toMatch(/isTableDivider/)
    expect(src).toMatch(/<thead>/)
    expect(src).toMatch(/<tbody>/)
  })

  it("requires the |---| divider, so prose containing a pipe stays prose", () => {
    expect(src).toMatch(/isTableRow\(line\)[\s\S]{0,120}isTableDivider\(lines\[i \+ 1\]\)/)
  })

  it("scrolls a wide table inside its own box", () => {
    // A COMPARE answer is eight columns inside a ~340px chat column; without
    // this the page scrolls sideways instead of the table.
    expect(src).toMatch(/overflow-x-auto[\s\S]{0,200}<table/)
  })

  it("still handles headings, both list kinds, emphasis and code", () => {
    for (const shape of ['"### "', '"## "', '"- "', '/^\\d+\\. /', "<strong", "<em", "<code"]) {
      expect(src, `missing ${shape}`).toContain(shape)
    }
  })

  it("never renders model output as HTML", () => {
    // Nothing the model emits may become markup.
    expect(src).not.toMatch(/dangerouslySetInnerHTML/)
  })
})
