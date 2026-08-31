/**
 * WHAT A DATA SOURCE IS CALLED WHEN A PERSON READS IT.
 *
 * The evidence drawer lists where an answer came from, and it listed the
 * internal names — "deal_screener", "dld_transactions_arvo",
 * "inventory_clean", "copilot_tool_stream". The owner, reading his own
 * product: "في الأدلة هو لسه بيعطي جوه الأدلة الكود بتاع الداتا — الأفضل
 * نسميها جوه الأدلة بأسمائها". The rule that already governs verdicts
 * (lib/format/verdicts.ts) governs sources too: the identifier stays the
 * data contract; the moment it becomes TEXT ON A SCREEN it is a name.
 *
 * Unknown identifiers are not echoed raw either — they are de-snaked into
 * words, so a source this map has never seen still reads as language.
 */

const SOURCE_LABELS: Record<string, { en: string; ar: string }> = {
  deal_screener: { en: "The scored-inventory screen", ar: "فرز المخزون المقيّم" },
  price_reality_check: { en: "The price reality check", ar: "فحص واقعية السعر" },
  area_risk_brief: { en: "The area risk brief", ar: "موجز مخاطر المنطقة" },
  developer_due_diligence: { en: "Developer track records", ar: "سجلات المطورين" },
  generate_investor_memo: { en: "The investor memo builder", ar: "مولّد مذكرة المستثمر" },
  compare_projects: { en: "The project comparison", ar: "مقارنة المشاريع" },
  stress_test: { en: "The stress test", ar: "اختبار التحمّل" },
  generate_decision_object: { en: "The decision engine", ar: "محرك القرار" },
  apply_decision_lens: { en: "The decision lens", ar: "عدسة القرار" },
  generate_strategic_report: { en: "The strategic report", ar: "التقرير الاستراتيجي" },
  generate_investment_roadmap: { en: "The investment roadmap", ar: "خارطة طريق الاستثمار" },
  monitor_market_segments: { en: "Market segment monitoring", ar: "مراقبة شرائح السوق" },
  list_market_entities: { en: "The market directory", ar: "دليل السوق" },
  entrestate_top_data: { en: "The live market tables", ar: "جداول السوق المباشرة" },
  dld_transaction_feed: { en: "DLD transaction records", ar: "سجلات صفقات دائرة الأراضي" },
  dld_transactions_arvo: { en: "DLD transaction records", ar: "سجلات صفقات دائرة الأراضي" },
  dld_area_benchmarks_live: { en: "Live area benchmarks", ar: "معايير المناطق المباشرة" },
  dld_market_pulse: { en: "The market pulse", ar: "نبض السوق" },
  dld_notable_deals: { en: "Notable deals", ar: "الصفقات البارزة" },
  dld_area_benchmark: { en: "Live area benchmarks", ar: "معايير المناطق المباشرة" },
  dld_transaction_search: { en: "DLD transaction records", ar: "سجلات صفقات دائرة الأراضي" },
  inventory_clean: { en: "The quality-checked inventory", ar: "المخزون المُدقَّق" },
  inventory_full: { en: "The full inventory", ar: "المخزون الكامل" },
  copilot_tool_stream: { en: "The advisor's own analysis", ar: "تحليل المستشار" },
  deterministic_fallback: { en: "The rule-based fallback", ar: "الاحتياطي القائم على القواعد" },
  fallback: { en: "The rule-based fallback", ar: "الاحتياطي القائم على القواعد" },
  default: { en: "The market data layer", ar: "طبقة بيانات السوق" },
  "arvo.co": { en: "DLD records via Arvo", ar: "سجلات دائرة الأراضي عبر Arvo" },
  mcp_query: { en: "A direct data query", ar: "استعلام مباشر على البيانات" },
  mcp_describe_table: { en: "The data dictionary", ar: "قاموس البيانات" },
  mcp_cross_reference: { en: "A cross-reference of the data", ar: "مطابقة بين البيانات" },
}

const dehumanized = /^[a-z0-9_.+\s-]+$/i

/**
 * "dld_transactions_arvo + dld_area_benchmarks_live" → "DLD transaction
 * records + Live area benchmarks". Anything that already reads as a sentence
 * (spaces, capitals, punctuation) is returned untouched.
 */
export function sourceLabel(value: string, locale: string): string {
  const raw = value.trim()
  if (!raw) return raw
  const ar = locale === "ar"
  if (raw.includes(" + ")) {
    return raw.split(" + ").map((part) => sourceLabel(part, locale)).join(" + ")
  }
  const entry = SOURCE_LABELS[raw] ?? SOURCE_LABELS[raw.toLowerCase()]
  if (entry) return ar ? entry.ar : entry.en
  if (!dehumanized.test(raw) || raw.includes(" ")) return raw
  const words = raw.replace(/[._]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
