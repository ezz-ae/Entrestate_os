import { TIMING_SIGNAL_LABELS } from "@/lib/format/verdicts"

const ARABIC_LABELS: Record<string, string> = {
  STRONG_BUY: "شراء قوي",
  BUY: "شراء",
  HOLD: "احتفاظ",
  WAIT: "انتظار",
  AVOID: "تجنب",
  HIGH: "عالية",
  MEDIUM: "متوسطة",
  LOW: "منخفضة",
  UNKNOWN: "غير محدد",
  A: "ممتاز",
  B: "جيد",
  C: "متوسط",
  D: "ضعيف",
  E: "خطر",
  "INSTITUTIONAL SAFE": "آمن مؤسسيًا",
  "CAPITAL SAFE": "آمن رأسماليًا",
  OPPORTUNISTIC: "انتهازي",
  SPECULATIVE: "مضاربي",
  "SHORT (1-2YR)": "قصيرة (1-2 سنة)",
  "MEDIUM (2-4YR)": "متوسطة (2-4 سنوات)",
  "LONG (4YR+)": "طويلة (4+ سنوات)",
  COMPLETED: "مكتمل",
  READY: "جاهز",
  "OFF PLAN": "على الخارطة",
  "GOD METRIC": "المقياس المرجعي",
  AFFORDABILITY: "القدرة الشرائية",
  "STRESS TEST": "اختبار الضغط",
  "GOAL ALIGNMENT": "ملاءمة الهدف",
  "COMPARE AREA YIELDS": "مقارنة عوائد المناطق",
  "UNDERWRITE DEVELOPMENT SITE": "تحليل موقع تطوير",
  "DRAFT SPA CONTRACT": "صياغة عقد البيع المبدئي",
  "L1 CANONICAL": "L1 موثق",
  "L2 DERIVED": "L2 مشتق",
  "L3 DYNAMIC": "L3 ديناميكي",
  "L4 EXTERNAL": "L4 خارجي",
  "L5 RAW": "L5 خام",
  "L5 VERIFIED": "L5 موثق",
  "L4 VERIFIED": "L4 موثق",
  "L3 MEDIUM": "L3 متوسط",
  "L2 HIGH": "L2 عالٍ",
  "L1 LOW": "L1 منخفض",
}

const LAYER_SUFFIX_AR: Record<string, string> = {
  CANONICAL: "موثق",
  DERIVED: "مشتق",
  DYNAMIC: "ديناميكي",
  EXTERNAL: "خارجي",
  RAW: "خام",
  VERIFIED: "موثق",
  MEDIUM: "متوسط",
  HIGH: "عالٍ",
  LOW: "منخفض",
}

function normalizeLabelKey(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([0-9])\s+([0-9])/g, "$1-$2")
    .replace(/[()]/g, (match) => match)
    .toUpperCase()
}

/**
 * English labels never print the enum. "STRONG_BUY" used to survive this
 * function as "STRONG BUY" (ALL-CAPS tokens were preserved wholesale) and sat
 * on the Decision canvas as a code — the owner's rule, again: "الموقع فاضح
 * نفسه وبيعطي الكود لكل حاجة". Timing codes go through the shared verdict
 * vocabulary (lib/format/verdicts.ts); any other pure-alphabetic ALL-CAPS
 * word longer than three letters is sentence-cased (HIGH → High). Short
 * caps stay — JBR, JVC, DLD, L4 are names, not codes.
 */
function titleCaseLabel(value: string) {
  const code = value.trim().toUpperCase().replace(/[\s-]+/g, "_")
  const verdict = TIMING_SIGNAL_LABELS[code]
  if (verdict) return verdict.en
  return value
    .trim()
    .replace(/_/g, " ")
    .split(/\s+/)
    .map((part) => {
      if (/^[A-Z]{4,}$/.test(part)) return part.charAt(0) + part.slice(1).toLowerCase()
      if (/^[A-Z0-9()\-+/%]+$/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")
}

/** ARABIC_LABELS is keyed the way people wrote it (STRONG_BUY); lookups arrive normalized (STRONG BUY). */
const ARABIC_LABELS_NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.entries(ARABIC_LABELS).map(([key, label]) => [normalizeLabelKey(key), label]),
)

export function isArabicAnalyticsLocale(locale?: string | null) {
  return locale === "ar" || locale?.startsWith("ar-")
}

export function localizeAnalyticsLabel(
  value: unknown,
  locale?: string | null,
  fallback = "-",
) {
  if (typeof value !== "string" || value.trim().length === 0) return fallback

  const trimmed = value.trim()
  if (!isArabicAnalyticsLocale(locale)) {
    return titleCaseLabel(trimmed)
  }

  const normalized = normalizeLabelKey(trimmed)
  // Both spellings: the map's own keys (STRONG_BUY) and the normalized form
  // (STRONG BUY) — the second lookup is what the canvas actually sends, and
  // without it Arabic readers saw "STRONG BUY" while the map held "شراء قوي".
  const exact = ARABIC_LABELS[normalized] ?? ARABIC_LABELS_NORMALIZED[normalized]
  if (exact) return exact

  const layerMatch = normalized.match(/^L([1-5])\s+(.+)$/)
  if (layerMatch) {
    const translatedSuffix = LAYER_SUFFIX_AR[layerMatch[2]] ?? ARABIC_LABELS[layerMatch[2]]
    if (translatedSuffix) {
      return `L${layerMatch[1]} ${translatedSuffix}`
    }
  }

  return trimmed.replace(/_/g, " ")
}
