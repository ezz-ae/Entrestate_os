/**
 * THE VERDICT VOCABULARY, IN HUMAN WORDS — the only place it is spelled.
 *
 * The database speaks STRONG_BUY / BUY / HOLD / WAIT / AVOID. The owner's
 * rule for every screen: "الموقع فاضح نفسه وبيعطي الكود لكل حاجة" — a smart
 * site does not print its enum. The Arabic surfaces already translated
 * (SIGNAL_LABELS_AR in the badges), while ENGLISH fell through to the raw
 * token — so an English reader saw the internals an Arabic reader was
 * spared. Both languages read from this map now.
 *
 * The codes themselves stay in queries, sorts and comparisons — they are the
 * data contract. This module is for the moment a code becomes TEXT ON A
 * SCREEN, and tests/human-labels.test.ts pins the display files to it.
 */

export const TIMING_SIGNAL_LABELS: Record<string, { en: string; ar: string }> = {
  STRONG_BUY: { en: "Strong buy", ar: "شراء قوي" },
  BUY: { en: "Buy", ar: "شراء" },
  HOLD: { en: "Hold", ar: "احتفاظ" },
  WAIT: { en: "Wait", ar: "انتظار" },
  AVOID: { en: "Avoid", ar: "تجنب" },
  UNKNOWN: { en: "Unrated", ar: "غير محدد" },
}

export const CONFIDENCE_LABELS: Record<string, { en: string; ar: string }> = {
  HIGH: { en: "High confidence", ar: "ثقة عالية" },
  MEDIUM: { en: "Medium confidence", ar: "ثقة متوسطة" },
  LOW: { en: "Low confidence", ar: "ثقة منخفضة" },
  UNKNOWN: { en: "Unrated", ar: "غير محدد" },
}

function normalizeCode(value: string | null | undefined): string {
  if (value === null || value === undefined) return "UNKNOWN"
  const code = String(value).trim().toUpperCase().replace(/[\s-]+/g, "_")
  return code.length > 0 ? code : "UNKNOWN"
}

/**
 * "STRONG_BUY" → "Strong buy" / "شراء قوي". Unknown codes are not echoed
 * raw: they are de-snaked and title-cased, so a value this map has never
 * seen still reads as words, never as an enum.
 */
export function timingSignalLabel(value: string | null | undefined, locale: string): string {
  const code = normalizeCode(value)
  const entry = TIMING_SIGNAL_LABELS[code]
  if (entry) return locale === "ar" ? entry.ar : entry.en
  const words = code.toLowerCase().replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function confidenceLabel(value: string | null | undefined, locale: string): string {
  const code = normalizeCode(value)
  const entry = CONFIDENCE_LABELS[code] ?? CONFIDENCE_LABELS.UNKNOWN
  return locale === "ar" ? entry.ar : entry.en
}
