import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE REPOSITORY IS PUBLIC, SO ITS FILE TREE IS PART OF THE ARGUMENT.
 *
 * The 2026-09-02 sweep found what five months of "download it again" had left
 * behind, and two of the findings are the reason this suite exists rather than
 * a tidier commit:
 *
 *  1. Two Hex exports named `Enterprise Decision Infrastructure Finalization
 *     (2).yaml` and `(4).yaml` held a live PostgreSQL URL for the production
 *     database — user, host and password — in a public repository, from
 *     2026-03-18 until they were removed. `.gitignore` had listed
 *     `Enterprise Decision Infrastructure Finalization.yaml` under
 *     "# private specs" the whole time. The rule was right; the browser's
 *     " (2)" suffix simply walked past it. A pattern that a filename can
 *     sidestep is not a control, so the control is here, where a name is
 *     checked rather than matched.
 *
 *  2. 102 MB of non-source sat inside source directories — a 64 MB screen
 *     recording in `components/`, two PDFs totalling 33 MB in `lib/`. Every
 *     clone paid for them. Nothing imported them, which is exactly why nobody
 *     noticed.
 *
 * These assertions read the git index, not the working tree, because the
 * question is what this repository publishes, not what happens to be on a
 * developer's disk.
 */

const ROOT = process.cwd()

const tracked = (): string[] =>
  execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)

/** Source directories: code, and the assets code imports. Nothing else. */
const CODE_DIRS = ["app", "lib", "components", "hooks", "pages", "api"]

/** What may legitimately live beside code. */
const CODE_EXTENSIONS =
  /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|json|svg|png|jpg|jpeg|webp|ico|gif|woff2?|ttf|sql|prisma|unused)$/i

/** A stub README explaining a directory is not a document dump. */
const ALLOWED_CODE_DIR_DOCS = new Set([
  "api/README.md",
  "pages/api/README.md",
  "pages/app/README.md",
])

describe("no browser-download duplicates are published", () => {
  it("no tracked filename carries a ' (N)' suffix", () => {
    // A file called "spec (1).yaml" is never one anyone meant to commit: it is
    // the browser's second copy of a file that already exists. That suffix is
    // how a production connection string got past a .gitignore rule written to
    // stop exactly that file.
    const offenders = tracked().filter((f) => / \(\d+\)(\.[A-Za-z0-9]+)?$/.test(path.basename(f, path.extname(f)) + path.extname(f)))
    expect(offenders).toEqual([])
  })
})

describe("source directories contain source", () => {
  it("no documents, archives or media are tracked under a code directory", () => {
    const offenders = tracked().filter((f) => {
      if (!CODE_DIRS.some((d) => f === d || f.startsWith(`${d}/`))) return false
      if (ALLOWED_CODE_DIR_DOCS.has(f)) return false
      return !CODE_EXTENSIONS.test(f)
    })
    // Documents belong in docs/ (see docs/archive/README.md), never beside the
    // modules that a reader is trying to follow.
    expect(offenders).toEqual([])
  })

  it("no tracked file under a code directory exceeds 1 MB", () => {
    // The 64 MB recording and the two PDFs were each individually larger than
    // every real source file in this repository combined.
    const LIMIT = 1024 * 1024
    const offenders = tracked()
      .filter((f) => CODE_DIRS.some((d) => f.startsWith(`${d}/`)))
      .map((f) => ({ f, bytes: fs.existsSync(path.join(ROOT, f)) ? fs.statSync(path.join(ROOT, f)).size : 0 }))
      .filter((x) => x.bytes > LIMIT)
      .map((x) => `${x.f} (${(x.bytes / 1024 / 1024).toFixed(1)} MB)`)
    expect(offenders).toEqual([])
  })
})

describe("no connection string is published", () => {
  it("no tracked file contains a postgres URL carrying a password", () => {
    // Matches scheme://user:secret@host — the shape that leaked. A URL with no
    // credentials in it (a docs example, or one reading from an env var) is
    // left alone deliberately: banning the word "postgresql" would only teach
    // people to spell it differently.
    const WITH_CREDENTIALS = /postgres(?:ql)?:\/\/[^\s:"'/@]+:[^\s:"'/@]+@/i
    const PLACEHOLDER = /:(?:\*+|x+|<[^>]*>|\.{2,}|password|your[_-]?password|changeme|placeholder|secret)@/i
    const offenders: string[] = []
    for (const f of tracked()) {
      const abs = path.join(ROOT, f)
      if (!fs.existsSync(abs)) continue
      const stat = fs.statSync(abs)
      if (!stat.isFile() || stat.size > 32 * 1024 * 1024) continue
      let text: string
      try {
        text = fs.readFileSync(abs, "utf8")
      } catch {
        continue
      }
      if (!text.includes("postgres")) continue
      for (const line of text.split("\n")) {
        if (WITH_CREDENTIALS.test(line) && !PLACEHOLDER.test(line)) {
          offenders.push(f)
          break
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe("the repository root stays readable", () => {
  it("the root holds only the entry documents and configuration", () => {
    // A visitor's first screen of this repository is its root listing. It used
    // to open on "CODEX_FRONTEND (2).md" and "Entrestate_Data_Agent_Task_List
    // (1) (1).docx"; the planning documents now live in docs/archive/.
    const ALLOWED_ROOT_DOCS = new Set(["README.md", "LICENSE.md", "NOTICE.md", "site-map.md"])
    // pnpm's own two files are configuration, not documents: the lockfile,
    // and pnpm-workspace.yaml, where pnpm 10+ keeps onlyBuiltDependencies.
    const PNPM_CONFIG = new Set(["pnpm-lock.yaml", "pnpm-workspace.yaml"])
    const offenders = tracked()
      .filter((f) => !f.includes("/") && /\.(md|html|docx|pdf|yaml|yml)$/i.test(f))
      .filter((f) => !ALLOWED_ROOT_DOCS.has(f) && !PNPM_CONFIG.has(f))
    expect(offenders).toEqual([])
  })
})
