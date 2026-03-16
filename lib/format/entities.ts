import { resolveAppLocale } from "@/lib/format/locale"

export function pickLocalizedText(
  locale: string | null | undefined,
  arabicValue: unknown,
  defaultValue: unknown,
  fallback = "—",
) {
  const normalizedLocale = resolveAppLocale(locale)
  const primary = normalizedLocale === "ar" ? arabicValue : defaultValue
  const secondary = normalizedLocale === "ar" ? defaultValue : arabicValue

  if (typeof primary === "string" && primary.trim().length > 0) return primary.trim()
  if (typeof secondary === "string" && secondary.trim().length > 0) return secondary.trim()
  return fallback
}
