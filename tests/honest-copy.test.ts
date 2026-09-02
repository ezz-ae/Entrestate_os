import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * NO INVENTED PERSON SPEAKS FOR THIS PRODUCT.
 *
 * The sign-in screen of the live product carried a pull quote attributed to
 * "Ahmed Al-Rashid — Investment Director, Gulf Capital Partners". No such
 * person and no such firm. Beside it stood "8 Markets · 200+ Areas tracked ·
 * 7,000+ Projects scored", while the footer of /markets, reading the same
 * database through /api/platform-metrics, said 1,946 scored projects. The page
 * asking a customer for a password was the least truthful page in the product.
 *
 * A second file, components/testimonials-section.tsx, held nine more invented
 * customers with quotes, handles and avatars. Nothing imported it — one import
 * away from shipping. It now sits in quarantine/ with an .unused extension.
 *
 * Two rules, because the codebase already says numbers shown to users are
 * evidence-gated and this is the same rule applied to words:
 *
 *   1. NO ATTRIBUTED ENDORSEMENT. A quote with a person's name and a job title
 *      beside it is a claim about a real customer. If a real one exists, add
 *      them here with their permission recorded.
 *   2. A COUNT COMES FROM THE METRICS SOURCE. A hardcoded magnitude next to
 *      "projects scored" or "areas tracked" is a second, drifting answer to a
 *      question the database already answers.
 */

const ROOT = process.cwd()

function shippedFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "_to_delete" || e.name.startsWith(".")) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(e.name)) out.push(full)
    }
  }
  for (const d of ["app", "components"]) walk(path.join(ROOT, d))
  return out
}

/**
 * Real, permissioned endorsements go here — name, role, and where the consent
 * is recorded. Empty is the honest state until one exists.
 */
const PERMISSIONED_ENDORSERS: string[] = []

/**
 * A testimonial has a shape: a person's NAME, a job ROLE, and words attributed
 * to them, close together. Any one of the three alone is innocent — "title" is
 * page metadata, "Investor Match Desk" is a product — so all three are required
 * inside a small window, which is what an author block actually looks like.
 */
const NAME_KEY = /\b(?:name|person|author|by)\s*:\s*["'`]\s*[A-Z\u0600-\u06FF]/
const ROLE_KEY =
  /\b(?:role|jobTitle|position)\s*:\s*["'`][^"'`]*\b(?:Director|Partner|Manager|Lead|Head|Founder|CEO|CTO|COO|Investor|Analyst|Broker|Agent|مدير|شريك|مؤسس)\b/
const QUOTE_KEY = /\b(?:quote|body|testimonial|says|words)\s*:\s*["'`]/
const WINDOW = 8

describe("copy that speaks for a customer", () => {
  it("attributes no quote to a person the product cannot name", () => {
    const offenders: string[] = []
    for (const file of shippedFiles()) {
      const src = fs.readFileSync(file, "utf8")
      const rel = path.relative(ROOT, file).replace(/\\/g, "/")
      const lines = src.split("\n")
      lines.forEach((line, i) => {
        if (!ROLE_KEY.test(line)) return
        const near = lines.slice(Math.max(0, i - WINDOW), i + WINDOW).join("\n")
        if (!NAME_KEY.test(near) || !QUOTE_KEY.test(near)) return
        if (PERMISSIONED_ENDORSERS.some((n) => near.includes(n))) return
        offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 80)}`)
      })
    }
    expect(
      offenders,
      "a name with a job title beside a quote is a claim about a real customer — add them to PERMISSIONED_ENDORSERS with consent recorded, or say it in our own name",
    ).toEqual([])
  })

  it("keeps the sign-in counts on the same source as the rest of the site", () => {
    const src = fs.readFileSync(path.join(ROOT, "components/auth/login-page-client.tsx"), "utf8")
    expect(src).toContain("usePlatformMetrics")
    expect(src).toMatch(/formatCount\(metrics\.totalProjects\)/)
    expect(src).toMatch(/formatCount\(metrics\.totalAreas\)/)
    // The invented magnitudes that used to sit here.
    for (const invented of ['"7,000+"', ">7,000+<", ">200+<"]) {
      expect(src, `${invented} is a hardcoded count`).not.toContain(invented)
    }
  })

  it("does not ship the nine invented customers", () => {
    expect(fs.existsSync(path.join(ROOT, "components/testimonials-section.tsx"))).toBe(false)
  })
})
