export function formatAed(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "AED —"
  return `AED ${Math.round(value).toLocaleString()}`
}

export function formatYield(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return `${value.toFixed(1)}%`
}

export function formatScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return value.toFixed(1)
}

