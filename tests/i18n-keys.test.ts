import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * EVERY LITERAL t("key") RESOLVES TO A STRING, IN BOTH LANGUAGES.
 *
 * The Terminal never had this guard, and the same disease struck twice:
 *
 *   1. The sidebar called t("workspace") where "workspace" was an OBJECT in
 *      the catalog — INSUFFICIENT_PATH on every render, multiplied by the
 *      copilot provider's per-delta re-renders into 7,230 console errors per
 *      answer, which starved the main thread (PR #10).
 *   2. The /chat canvas called THIRTY-ONE keys that had never existed in any
 *      catalog since March — t("decisionCanvas"), t("latestOutput"),
 *      t("performanceCurves")… — so the panel printed raw key paths as its
 *      labels ("chat.latestOutput" reads exactly like a data code to the
 *      person looking at it), logged MISSING_MESSAGE 31 times per render,
 *      and, during a streamed answer, froze the tab outright.
 *
 * next-intl reports both cases as console errors and renders the key path.
 * Neither is visible in tests, typecheck or build. So: every file that
 * declares `const X = useTranslations("ns")` is scanned for `X("literal")`
 * calls, and each must resolve to a STRING (not an object, not missing) in
 * BOTH messages/en.json and messages/ar.json. Computed keys (t(`a.${b}`))
 * are outside this guard's reach by design — keep keys literal.
 */

const ROOT = process.cwd()
const SKIP_DIRS = new Set(["node_modules", ".next", "tests", ".git", "public"])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full)
  }
  return out
}

type Catalog = Record<string, unknown>

function resolves(catalog: Catalog, ns: string, key: string): boolean {
  let cur: unknown = catalog[ns]
  for (const part of key.split(".")) {
    if (!cur || typeof cur !== "object" || !(part in (cur as Record<string, unknown>))) return false
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === "string"
}

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("every literal translation key resolves", () => {
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, "messages/en.json"), "utf8")) as Catalog
  const ar = JSON.parse(fs.readFileSync(path.join(ROOT, "messages/ar.json"), "utf8")) as Catalog

  it("to a string in both catalogs, for every useTranslations() consumer", () => {
    const failures: string[] = []
    let checked = 0
    for (const file of walk(ROOT)) {
      const src = stripComments(fs.readFileSync(file, "utf8"))
      const decls = [...src.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*"([A-Za-z0-9_.]+)"\s*\)/g)]
      for (const [, variable, ns] of decls) {
        const calls = new Set(
          [...src.matchAll(new RegExp(`(?<![A-Za-z0-9_])${variable}\\("([A-Za-z0-9_.]+)"\\)`, "g"))].map((m) => m[1]),
        )
        for (const key of calls) {
          checked++
          const rel = path.relative(ROOT, file)
          if (!resolves(en, ns, key)) failures.push(`${rel}: ${ns}.${key} missing or not a string in messages/en.json`)
          if (!resolves(ar, ns, key)) failures.push(`${rel}: ${ns}.${key} missing or not a string in messages/ar.json`)
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
    expect(failures, failures.join("\n")).toEqual([])
  })
})
