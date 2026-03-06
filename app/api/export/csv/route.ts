import { hasTierAccess } from "@/lib/tier-access"
import { getRequestId } from "@/lib/api-errors"
import { listProperties } from "@/lib/decision-infrastructure"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function asCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  const raw = String(value)
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return new Response(JSON.stringify({ error: "Team tier required", requestId }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const result = await listProperties({ page: 1, pageSize: 500 })

  const headers = ["name", "area", "developer", "price", "yield", "stress_grade", "timing", "god_metric", "confidence"]
  const lines = [headers.join(",")]

  for (const project of result.projects) {
    lines.push(
      [
        project.name,
        project.final_area ?? project.area,
        project.developer,
        project.l1_canonical_price,
        project.l1_canonical_yield,
        project.l2_stress_test_grade,
        project.l3_timing_signal,
        project.engine_god_metric,
        project.l1_confidence,
      ]
        .map(asCsvValue)
        .join(","),
    )
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=deal-screen.csv",
      "x-request-id": requestId,
    },
  })
}

