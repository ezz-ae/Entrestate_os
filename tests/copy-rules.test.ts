import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const FORBIDDEN_PHRASES = ["our algorithm", "100% accurate", "real-time", "ai says"]
const TARGET_DIRS = ["app", "components", "lib", "automation-builder"]
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx"])

function collectSourceFiles(dir: string): string[] {
  const fullDir = path.join(process.cwd(), dir)
  if (!fs.existsSync(fullDir)) return []

  const files: string[] = []
  const stack = [fullDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }
      if (!ALLOWED_EXTENSIONS.has(path.extname(entry.name))) continue
      files.push(fullPath)
    }
  }

  return files
}

function findForbiddenPhrases(text: string): string[] {
  const normalized = text.toLowerCase()
  return FORBIDDEN_PHRASES.filter((phrase) => normalized.includes(phrase))
}

describe("copy rules", () => {
  it("detects forbidden phrases in sample text", () => {
    const sample = "Our algorithm is 100% accurate and AI says you should buy now."
    expect(findForbiddenPhrases(sample)).toEqual(["our algorithm", "100% accurate", "ai says"])
  })

  it("has no forbidden phrases across app copy", () => {
    const files = TARGET_DIRS.flatMap((dir) => collectSourceFiles(dir))
    const violations: string[] = []

    for (const filePath of files) {
      const text = fs.readFileSync(filePath, "utf8")
      const found = findForbiddenPhrases(text)
      if (found.length === 0) continue
      const relPath = path.relative(process.cwd(), filePath)
      violations.push(`${relPath} -> ${found.join(", ")}`)
    }

    expect(violations).toEqual([])
  })
})
