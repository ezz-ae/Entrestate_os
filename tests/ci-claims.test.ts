import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A GATE THAT NEVER RUNS CANNOT REPORT THAT IT IS BROKEN.
 *
 * `preview-smoke-promote.yml` is described in the README as the promotion
 * gate. Its preflight requires VERCEL_TOKEN and VERCEL_ORG_ID; neither secret
 * is set, so deploy/smoke/promote have skipped on every push since the
 * workflow was written. Under that cover, `scripts/smoke.sh` — which both
 * smoke workflows invoke — carried three defects that no run could surface:
 *
 *   1. It read the target from "$1" only, while both workflows pass BASE_URL
 *      as an environment variable and call it with no argument. Every CI run
 *      would have tested http://localhost:3000 on a bare GitHub runner.
 *   2. It hardcoded `x-smoke-test: true`, a header no route, proxy rule or
 *      Vercel setting in this repository reads, and ignored the
 *      BYPASS_HEADER/BYPASS_TOKEN pair both workflows set from a secret.
 *   3. manual-smoke.yml defaulted to https://entrestate.com — the business
 *      platform — while the suite exercises /api/chat and
 *      /api/market-score/summary, which are Terminal routes and 404 there.
 *
 * These assertions are cheap and run on every merge, which is the point: they
 * hold whether or not the secrets are ever set.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

const smoke = read("scripts/smoke.sh")

/**
 * The header comment in smoke.sh names the retired header in order to explain
 * why it went. Scanning the whole file would therefore match the explanation
 * and fail on a correct file, so the executable-line checks below read only
 * the lines that run.
 */
const smokeCode = smoke
  .split("\n")
  .filter((line) => !/^\s*#/.test(line))
  .join("\n")
const workflowDir = path.join(ROOT, ".github/workflows")
const workflows = fs
  .readdirSync(workflowDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ name: f, text: fs.readFileSync(path.join(workflowDir, f), "utf8") }))

describe("scripts/smoke.sh can actually be aimed by its callers", () => {
  it("takes BASE_URL from the environment, not only from $1", () => {
    // Both workflows set BASE_URL as env and pass no argument.
    expect(smokeCode).toMatch(/BASE_URL="\$\{1:-\$\{BASE_URL:-/)
  })

  it("does not send the fictional x-smoke-test header", () => {
    expect(smokeCode).not.toMatch(/x-smoke-test/i)
  })

  it("sends the bypass header the workflows configure, and only when a token exists", () => {
    expect(smokeCode).toContain("BYPASS_TOKEN")
    expect(smokeCode).toMatch(/if \[ -n "\$BYPASS_TOKEN" \]/)
  })
})

describe("the workflows aim the Terminal's smoke suite at the Terminal", () => {
  it("no workflow that runs smoke.sh points at the business platform host", () => {
    const offenders = workflows
      .filter((w) => w.text.includes("scripts/smoke.sh"))
      .filter((w) => /BASE_URL[^\n]*https:\/\/entrestate\.com/.test(w.text) || /default:\s*"https:\/\/entrestate\.com"/.test(w.text))
      .map((w) => w.name)
    expect(offenders).toEqual([])
  })
})

describe("the README does not claim a dormant gate is enforcing", () => {
  const readme = read("README.md")
  const promoteWorkflow = workflows.find((w) => w.name === "preview-smoke-promote.yml")!

  it("the promote gate still guards on the two secrets it names", () => {
    // If this ever changes, the README paragraph below must be re-graded.
    expect(promoteWorkflow.text).toContain("VERCEL_TOKEN")
    expect(promoteWorkflow.text).toContain("VERCEL_ORG_ID")
    expect(promoteWorkflow.text).toMatch(/can_deploy=false/)
  })

  it("the README says the gate is dormant and names what would switch it on", () => {
    const para = readme.slice(readme.indexOf("**Preview integrity**"))
    expect(para).toMatch(/dormant, not\s+enforcing/)
    expect(para).toContain("VERCEL_TOKEN")
    expect(para).toContain("VERCEL_ORG_ID")
  })
})
