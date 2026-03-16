import { formatDecimal, formatInteger } from "@/lib/format/number"

type AedOptions = {
  compact?: boolean
  fallback?: string
}

export function formatAed(value: unknown, locale?: string | null, options: AedOptions = {}) {
  const fallback = options.fallback ?? "AED —"
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback

  if (options.compact) {
    if (value >= 1_000_000_000) {
      return `AED ${formatDecimal(value / 1_000_000_000, locale, 1, 1, fallback)}B`
    }
    if (value >= 1_000_000) {
      return `AED ${formatDecimal(value / 1_000_000, locale, 1, 1, fallback)}M`
    }
    if (value >= 1_000) {
      return `AED ${formatDecimal(value / 1_000, locale, 0, 0, fallback)}K`
    }
  }

  return `AED ${formatInteger(Math.round(value), locale, fallback)}`
}

