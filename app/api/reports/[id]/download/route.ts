import { getRequestId } from "@/lib/api-errors"
import { getReport } from "@/lib/runtime-store"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return new Response(JSON.stringify({ error: "Team tier required", requestId }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { id } = await context.params
  const report = getReport(id)
  if (!report) {
    return new Response(JSON.stringify({ error: "Report not found", requestId }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const content = `Entrestate Report\n\nTitle: ${report.title}\nGenerated: ${report.createdAt}\n\n${JSON.stringify(report.payload, null, 2)}`

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.id}.pdf"`,
      "x-request-id": requestId,
    },
  })
}

