/**
 * INVESTOR PROFILES — six named filters over the curated inventory, each one
 * a rule a person can read and check.
 *
 * Until 2026-09-05 the Decision Terminal's "Investor Profiles" panel showed
 * six counts that were HARDCODED in app/overview/page.tsx as fallbacks
 * (first_time_buyer: 3887, …) — copied once from a 7,015-row ingest table and
 * printed against a 1,946-project total, so the top card read "3,887 · 200%".
 * The link under each card, /properties?intent=…, was a no-op on the curated
 * view: it listed every project regardless.
 *
 * A profile is now a DEFINITION, stated here once in words and applied once
 * in SQL (lib/decision-infrastructure.ts: curatedProfileClause), so the count
 * on the card and the list behind the link are the same query. The rule is
 * printed under the label — a reader who disagrees with "6% or more" can see
 * exactly what was counted. No profile is inferred, weighted or estimated.
 */

export type InvestorProfileKey =
  | "first_time_buyer"
  | "golden_visa"
  | "yield_seeking"
  | "conservative"
  | "capital_growth"
  | "trophy_asset"

export type InvestorProfile = {
  key: InvestorProfileKey
  label: string
  labelAr: string
  /** The rule, in words a person can check against a project page. */
  rule: string
  ruleAr: string
}

export const FIRST_TIME_BUYER_MAX_AED = 1_500_000
export const GOLDEN_VISA_MIN_AED = 2_000_000
export const YIELD_SEEKING_MIN_PCT = 6
export const TROPHY_MIN_AED = 10_000_000

export const INVESTOR_PROFILES: readonly InvestorProfile[] = [
  {
    key: "first_time_buyer",
    label: "First-Time Buyer",
    labelAr: "المشتري الأول",
    rule: "Entry price under AED 1.5M",
    ruleAr: "سعر الدخول أقل من 1.5 مليون درهم",
  },
  {
    key: "golden_visa",
    label: "Golden Visa",
    labelAr: "الإقامة الذهبية",
    rule: "Entry price AED 2M or more, or flagged eligible",
    ruleAr: "سعر الدخول 2 مليون درهم أو أكثر، أو مؤهّل صراحةً",
  },
  {
    key: "yield_seeking",
    label: "Yield Seeking",
    labelAr: "الباحث عن العائد",
    rule: "Advertised gross yield 6% or more",
    ruleAr: "عائد إجمالي معلن 6% أو أكثر",
  },
  {
    key: "conservative",
    label: "Conservative",
    labelAr: "المتحفّظ",
    rule: "Stress grade A or B",
    ruleAr: "درجة الضغط A أو B",
  },
  {
    key: "capital_growth",
    label: "Capital Growth",
    labelAr: "نمو رأس المال",
    rule: "Timing signal BUY or STRONG_BUY",
    ruleAr: "إشارة التوقيت BUY أو STRONG_BUY",
  },
  {
    key: "trophy_asset",
    label: "Trophy Asset",
    labelAr: "الأصل المميّز",
    rule: "Entry price AED 10M or more",
    ruleAr: "سعر الدخول 10 ملايين درهم أو أكثر",
  },
] as const

export const INVESTOR_PROFILE_KEYS = INVESTOR_PROFILES.map((profile) => profile.key) as readonly InvestorProfileKey[]

export function isInvestorProfileKey(value: unknown): value is InvestorProfileKey {
  return typeof value === "string" && (INVESTOR_PROFILE_KEYS as readonly string[]).includes(value)
}

/** "first-time-buyer", "First Time Buyer" and "first_time_buyer" are one key. */
export function normalizeInvestorProfileKey(value: string): InvestorProfileKey | null {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_")
  return isInvestorProfileKey(key) ? key : null
}
