import { resolveAppLocale } from "@/lib/format/locale"
import entityTranslations from "@/docs/arabic_entity_translations.json"

const developerTranslations = entityTranslations.developers as Record<string, string>
const areaTranslations = entityTranslations.areas as Record<string, string>
const extendedAreaTranslations = entityTranslations.areas_extended as Record<string, string>

function resolveArabicEntityLabel(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  return (
    developerTranslations[normalized]
    ?? areaTranslations[normalized]
    ?? extendedAreaTranslations[normalized]
    ?? extendedAreaTranslations[normalized.toUpperCase()]
    ?? null
  )
}

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
  if (normalizedLocale === "ar" && typeof defaultValue === "string") {
    const resolvedArabicLabel = resolveArabicEntityLabel(defaultValue)
    if (resolvedArabicLabel) return resolvedArabicLabel
  }
  if (typeof secondary === "string" && secondary.trim().length > 0) return secondary.trim()
  return fallback
}
