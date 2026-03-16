"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Target, Gauge, Brain, Save, Loader2, Check } from "lucide-react"
import { type AppLocale } from "@/i18n/locale"

function getHorizonOptions(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { value: "ready", label: "جاهز الآن" },
      { value: "6-12mo", label: "خلال 6-12 شهر" },
      { value: "1-2yr", label: "خلال 1-2 سنة" },
      { value: "2-4yr", label: "خلال 2-4 سنوات" },
      { value: "4yr+", label: "أكثر من 4 سنوات" },
    ]
  }

  return [
    { value: "ready", label: "Ready now" },
    { value: "6-12mo", label: "6-12 months" },
    { value: "1-2yr", label: "1-2 years" },
    { value: "2-4yr", label: "2-4 years" },
    { value: "4yr+", label: "4+ years" },
  ]
}

function yieldDescription(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر — يميل إلى الأمان وحماية رأس المال"
    if (value < 65) return "متوازن — يوازن بين العائد والانضباط"
    return "نمائي — يطارد العائد والفرص الأسرع"
  }

  if (value < 35) return "Conservative: prioritize safety and capital preservation."
  if (value < 65) return "Balanced: optimize for risk-adjusted returns."
  return "Growth: prioritize yield and upside potential."
}

function archetypeLabel(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر"
    if (value < 65) return "متوازن"
    if (value < 85) return "نمائي"
    return "انتهازي"
  }

  if (value < 35) return "Conservative"
  if (value < 65) return "Balanced"
  if (value < 85) return "Growth"
  return "Opportunistic"
}

const COPY = {
  en: {
    eyebrow: "Settings - Profile",
    title: "Decision profile",
    subtitle: "Profile settings drive how match scores and narratives are weighted across the platform.",
    riskTitle: "Risk + Horizon",
    riskLabel: (value: number) => `Market weight bias (${value}%)`,
    riskBody: "Higher means more weight on verified market data than on personal preference.",
    personal: "Personal match",
    market: "Market data",
    horizon: "Investment horizon",
    styleTitle: "Investment style",
    styleLabel: (value: number) => `Yield vs Safety (${value}%)`,
    stylePrefix: "Current archetype:",
    safety: "Capital safety",
    yield: "Yield growth",
    preferencesTitle: "Preferences",
    preferencesLabel: "Preferred markets",
    preferencesBody: "Comma-separated areas or cities to prioritize.",
    preferencesPlaceholder: "Dubai Marina, JVC, Downtown",
    preferencesFootnote: "Preferences shape default filters and match-score weighting across chat, search, and reports.",
    saving: "Saving...",
    saved: "Saved",
    save: "Save profile",
  },
  ar: {
    eyebrow: "الإعدادات — الملف",
    title: "ملف القرار",
    subtitle: "من هنا نضبط كيف تُوزن المطابقة وكيف تُقرأ الفرص عبر المنصة.",
    riskTitle: "وزن السوق والإطار الزمني",
    riskLabel: (value: number) => `وزن قراءة السوق (${value}%)`,
    riskBody: "كلما ارتفع هذا المؤشر زاد اعتماد المنصة على بيانات السوق الموثقة أكثر من التفضيل الشخصي.",
    personal: "التفضيل الشخصي",
    market: "قراءة السوق",
    horizon: "الإطار الزمني",
    styleTitle: "أسلوب الاستثمار",
    styleLabel: (value: number) => `العائد مقابل الأمان (${value}%)`,
    stylePrefix: "الطابع الحالي:",
    safety: "الأمان",
    yield: "العائد",
    preferencesTitle: "التفضيلات",
    preferencesLabel: "الأسواق المفضلة",
    preferencesBody: "اكتب المناطق أو المدن التي تريد أن تبدأ منها القراءة، وافصل بينها بفواصل.",
    preferencesPlaceholder: "دبي مارينا، وسط دبي، JVC",
    preferencesFootnote: "هذه التفضيلات تضبط الفلاتر الأولى وتؤثر في وزن المطابقة عبر الشات والبحث والتقارير.",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    save: "حفظ الملف",
  },
} as const

export default function ProfileSettingsPage() {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const horizonOptions = getHorizonOptions(locale)
  const [riskBias, setRiskBias] = useState(65)
  const [yieldVsSafety, setYieldVsSafety] = useState(50)
  const [horizon, setHorizon] = useState("ready")
  const [preferredMarkets, setPreferredMarkets] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setRiskBias(Math.round((data.riskBias ?? 0.65) * 100))
          setYieldVsSafety(Math.round((data.yieldVsSafety ?? 0.5) * 100))
          setHorizon(data.horizon ?? "ready")
          setPreferredMarkets((data.preferredMarkets ?? []).join(", "))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskBias: riskBias / 100,
          yieldVsSafety: yieldVsSafety / 100,
          horizon,
          preferredMarkets: preferredMarkets
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">{copy.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{copy.subtitle}</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.riskTitle}</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.riskLabel(riskBias)}</label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">{copy.riskBody}</p>
                    <input type="range" min={30} max={90} value={riskBias} onChange={(e) => setRiskBias(Number(e.target.value))} className="w-full accent-foreground" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{copy.personal}</span>
                      <span>{copy.market}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.horizon}</label>
                    <select
                      value={horizon}
                      onChange={(e) => setHorizon(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    >
                      {horizonOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.styleTitle}</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.styleLabel(yieldVsSafety)}</label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">{yieldDescription(yieldVsSafety, locale)}</p>
                    <input type="range" min={0} max={100} value={yieldVsSafety} onChange={(e) => setYieldVsSafety(Number(e.target.value))} className="w-full accent-foreground" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{copy.safety}</span>
                      <span>{copy.yield}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{copy.stylePrefix} </span>
                      {archetypeLabel(yieldVsSafety, locale)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.preferencesTitle}</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.preferencesLabel}</label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">{copy.preferencesBody}</p>
                    <input
                      type="text"
                      value={preferredMarkets}
                      onChange={(e) => setPreferredMarkets(e.target.value)}
                      placeholder={copy.preferencesPlaceholder}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs text-muted-foreground">{copy.preferencesFootnote}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition hover:bg-foreground/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {copy.saving}
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" /> {copy.saved}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> {copy.save}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
