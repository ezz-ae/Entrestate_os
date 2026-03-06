import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { listAreas } from "@/lib/decision-infrastructure"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const data = await listAreas()
    return NextResponse.json({ ...data, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load area intelligence."), requestId },
      { status: 500 },
    )
  }
}

