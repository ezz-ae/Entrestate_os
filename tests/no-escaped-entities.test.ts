import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * AN HTML ENTITY INSIDE A JAVASCRIPT STRING IS PRINTED, NOT DECODED.
 *
 * JSX decodes entities that sit in markup — <p>what&apos;s</p> renders an
 * apostrophe. A string literal is not markup, so {isArabic ? "…" : "Today&apos;s
 * inventory posture"} renders the six characters &apos; on the page. This is
 * exactly what shipped on terminal.entrestate.com/markets: the headline of the
 * live snapshot read "Today&apos;s inventory posture", and the ask box above it
 * read "Discover what&apos;s possible", on the product's most-linked screen.
 *
 * It is invisible in review because the two forms look identical in a diff and
 * a linter that rewrites bare apostrophes into &apos; (react/no-unescaped-
 * entities) will happily create this bug while fixing a different one. So the
 * rule is a test, not a habit: use a real ’ in a string, and reserve entities
 * for markup.
 */

// Escaping helpers build HTML by hand; the entities there are the output, not a
// mistake. Named, so the exemption is a decision rather than a silent hole.
const ESCAPERS = new Set(["lib/distribution/embed.ts"])

const ENTITY_IN_STRING =
  /(["'`])((?:[^"'`\\\n]|\\.)*?&(?:apos|quot|amp|nbsp|lt|gt|#39|#x27);(?:[^"'`\\\n]|\\.)*?)\1/

function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(e.name)) out.push(full)
    }
  }
  for (const d of ["app", "components", "lib", "i18n", "seq"]) walk(path.join(process.cwd(), d))
  return out
}

describe("copy that reaches a screen", () => {
  it("never hides an HTML entity inside a string literal", () => {
    const offenders: string[] = []
    for (const file of sourceFiles()) {
      const rel = path.relative(process.cwd(), file).replace(/\\/g, "/")
      if (ESCAPERS.has(rel)) continue
      const lines = fs.readFileSync(file, "utf8").split("\n")
      lines.forEach((line, i) => {
        const m = ENTITY_IN_STRING.exec(line)
        if (m) offenders.push(`${rel}:${i + 1}  ${m[0].trim().slice(0, 80)}`)
      })
    }
    expect(
      offenders,
      "these print the entity to the user — use a real character (’ ” & …) in a string literal",
    ).toEqual([])
  })
})
