import "server-only"
import { Prisma } from "@prisma/client"

const DEFAULT_INVENTORY_TABLE = "inventory_full"
const DEFAULT_AREAS_TABLE = "inventory_full"
const DEFAULT_DEVELOPERS_TABLE = "inventory_full"
const DEFAULT_DETAIL_TABLE = "inventory_full"
const DEFAULT_STATUS_TABLE = "entrestate_data_freshness"
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

function getConfiguredTableName(envKey: string, fallback: string) {
  return normalizeInventoryTableName(process.env[envKey] ?? fallback)
}

export function getAreasTableName() {
  return getConfiguredTableName("AREAS_TABLE", DEFAULT_AREAS_TABLE)
}

export function getAreasTableSql() {
  return Prisma.raw(getAreasTableName())
}

export function getDevelopersTableName() {
  return getConfiguredTableName("DEVELOPERS_TABLE", DEFAULT_DEVELOPERS_TABLE)
}

export function getDevelopersTableSql() {
  return Prisma.raw(getDevelopersTableName())
}

export function getDetailTableName() {
  return getConfiguredTableName("DETAIL_TABLE", DEFAULT_DETAIL_TABLE)
}

export function getDetailTableSql() {
  return Prisma.raw(getDetailTableName())
}

export function getStatusTableName() {
  return getConfiguredTableName("STATUS_TABLE", DEFAULT_STATUS_TABLE)
}

export function getStatusTableSql() {
  return Prisma.raw(getStatusTableName())
}
