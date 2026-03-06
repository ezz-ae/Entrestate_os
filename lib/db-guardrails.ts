import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const DEFAULT_STATEMENT_TIMEOUT_MS = 3000
const MIN_STATEMENT_TIMEOUT_MS = 100
const MAX_STATEMENT_TIMEOUT_MS = 30000

function usesTransactionPooler() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.NEON_DATABASE_URL,
    process.env.NEON_DATABASE_URL_UNPOOLED,
  ]

  return candidates.some((url) => {
    if (!url) return false
    return url.includes("-pooler.") || url.includes("pgbouncer=true")
  })
}

export async function withStatementTimeout<T>(
  runner: (tx: Prisma.TransactionClient) => Promise<T>,
  ms: number = DEFAULT_STATEMENT_TIMEOUT_MS,
) {
  const safeMs = Number.isFinite(ms) ? Math.round(ms) : DEFAULT_STATEMENT_TIMEOUT_MS
  const boundedMs = Math.min(MAX_STATEMENT_TIMEOUT_MS, Math.max(MIN_STATEMENT_TIMEOUT_MS, safeMs))

  if (usesTransactionPooler()) {
    return runner(prisma as unknown as Prisma.TransactionClient)
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${boundedMs}`)
      return runner(tx)
    })
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    if (code === "P2028") {
      return runner(prisma as unknown as Prisma.TransactionClient)
    }
    throw error
  }
}
