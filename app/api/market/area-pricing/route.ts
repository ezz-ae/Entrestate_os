import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getAreaPricing } from "@/lib/dld/area-pricing.server"
import { MIN_SAMPLE } from "@/lib/dld/area-pricing"

/**
 * Median AED per square metre by area, off-plan against ready.
 *
 * Read-only, no session, no PII — the same posture as /api/platform-metrics.
 * Everything that qualifies the numbers ships inside the payload: `basis` names
 * what was counted, `minSample` names the gate a cell must clear before its
 * median is stated, and `coverage` says whether the span has holes in it. A
 * caller cannot render this honestly without them, so they are not optional.
 *
 * `minSample` is clamped rather than trusted: it is the evidence gate, and a
 * query string that could set it to 1 would turn a withheld median into a
 * published one from four sales.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIN_ALLOWED = 5
const MAX_ALLOWED = 500

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const raw = Number(new URL(request.url).searchParams.get("minSample"))
    const minSample = Number.isFinite(raw)
      ? Math.min(MAX_ALLOWED, Math.max(MIN_ALLOWED, Math.floor(raw)))
      : MIN_SAMPLE

    const result = await getAreaPricing(minSample)
    return NextResponse.json(
      { ...result, requestId, request_id: requestId },
      {
        headers: {
          "x-request-id": requestId,
          // The underlying table is loaded in batches, not continuously; a
          // short cache costs nothing in freshness and spares the database a
          // percentile scan on every page view.
          "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Failed to load area pricing."),
        requestId,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }
}
