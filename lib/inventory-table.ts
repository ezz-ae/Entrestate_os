import "server-only"
import { Prisma } from "@prisma/client"

const DEFAULT_INVENTORY_TABLE = "inventory_full"
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function normalizeInventoryTableName(rawValue: string | undefined) {
  const trimmed = rawValue?.trim()
  if (!trimmed) return DEFAULT_INVENTORY_TABLE

  const parts = trimmed.split(".").map((part) => part.trim())
  if (parts.length === 0 || parts.some((part) => !IDENTIFIER_RE.test(part))) {
    return DEFAULT_INVENTORY_TABLE
  }

  return parts.join(".")
}

export function getInventoryTableName() {
  return normalizeInventoryTableName(process.env.INVENTORY_TABLE)
}

export function getInventoryTableSql() {
  return Prisma.raw(getInventoryTableName())
}

