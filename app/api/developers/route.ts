import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { listDevelopers } from "@/lib/decision-infrastructure"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const data = await listDevelopers()
    return NextResponse.json({ ...data, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load developer profiles."), requestId },
      { status: 500 },
    )
  }
}

