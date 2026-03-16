"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Building2, TrendingUp, Briefcase, Shield, Rocket, BarChart3, ArrowRight, SkipForward } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type Role = "broker" | "investor" | "developer" | "analyst"

function getRoles(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "broker" as const, label: "وسيط", description: "أطابق المشترين مع الفرص المناسبة", icon: Building2 },
      { key: "investor" as const, label: "مستثمر", description: "أفحص الأصول من زاوية العائد والمخاطر", icon: TrendingUp },
      { key: "developer" as const, label: "مطور", description: "أدير المشاريع والتسعير والإطلاق", icon: Briefcase },
      { key: "analyst" as const, label: "باحث", description: "أقرأ السوق وأبني تقارير واستنتاجات", icon: BarChart3 },
    ]
  }

  return [
    { key: "broker" as const, label: "Broker", description: "I find and match buyers with the right properties", icon: Building2 },
    { key: "investor" as const, label: "Investor", description: "I evaluate assets for capital growth or yield", icon: TrendingUp },
    { key: "developer" as const, label: "Developer", description: "I build and sell residential or commercial projects", icon: Briefcase },
    { key: "analyst" as const, label: "Analyst", description: "I research markets and produce reports", icon: BarChart3 },
  ]
}

function getHorizons(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "ready", label: "جاهز الآن", description: "مكتمل أو قريب من التسليم" },
      { key: "6-12mo", label: "خلال 6-12 شهر", description: "قيد التنفيذ وقريب" },
      { key: "1-2yr", label: "خلال 1-2 سنة", description: "مسار متوسط المدى" },
      { key: "2-4yr", label: "خلال 2-4 سنوات", description: "قراءة طويلة المدى" },
      { key: "4yr+", label: "أكثر من 4 سنوات", description: "رأسمال صبور واستراتيجي" },
    ]
  }

  return [
    { key: "ready", label: "Ready now", description: "Completed or near handover" },
    { key: "6-12mo", label: "6-12 months", description: "Under construction, soon" },
    { key: "1-2yr", label: "1-2 years", description: "Medium-term pipeline" },
    { key: "2-4yr", label: "2-4 years", description: "Long-term plays" },
    { key: "4yr+", label: "4+ years", description: "Strategic, patient capital" },
  ]
}

function getBudgetRanges(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "under1m", label: "أقل من 1M AED", min: 0, max: 1_000_000 },
      { key: "1m-3m", label: "1M - 3M AED", min: 1_000_000, max: 3_000_000 },
      { key: "3m-10m", label: "3M - 10M AED", min: 3_000_000, max: 10_000_000 },
      { key: "10m+", label: "أكثر من 10M AED", min: 10_000_000, max: undefined },
    ]
  }

  return [
    { key: "under1m", label: "Under 1M AED", min: 0, max: 1_000_000 },
    { key: "1m-3m", label: "1M - 3M AED", min: 1_000_000, max: 3_000_000 },
    { key: "3m-10m", label: "3M - 10M AED", min: 3_000_000, max: 10_000_000 },
    { key: "10m+", label: "10M+ AED", min: 10_000_000, max: undefined },
  ]
}

function yieldDescription(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر — يميل إلى الأمان واستقرار القرار"
    if (value < 65) return "متوازن — يوازن بين العائد والانضباط"
    return "نمائي — يطارد العائد والفرص الأسرع"
  }

  if (value < 35) return "Conservative — prioritize safety and capital preservation"
  if (value < 65) return "Balanced — optimize for risk-adjusted returns"
  return "Growth — prioritize yield and upside potential"
}

const COPY = {
  en: {
    step: (current: number) => `Step ${current} of 3`,
    titleOne: "What best describes you?",
    bodyOne: "This helps tailor market signals and report formats to your workflow.",
    titleTwo: "Budget and timeline",
    bodyTwo: "Optional. This helps shape the first view and default filters.",
    budget: "Budget range",
    horizon: "Investment horizon",
    skip: "Skip",
    continue: "Continue",
    titleThree: "Investment style",
    bodyThree: "Optional. This tells the scoring engine how to weigh opportunities for you.",
    safety: "Capital preservation",
    yield: "Yield maximization",
    finish: "Start exploring",
    finishing: "Setting up...",
  },
  ar: {
    step: (current: number) => `الخطوة ${current} من 3`,
    titleOne: "ما الدور الأقرب لطريقتك في العمل؟",
    bodyOne: "نضبط القراءة الأولى للسوق وطريقة عرض الفرص بما يناسب دورك.",
    titleTwo: "الميزانية والإطار الزمني",
    bodyTwo: "اختياري. يساعدنا في فتح الشاشة الأولى على قراءة أقرب لما تبحث عنه.",
    budget: "الميزانية",
    horizon: "الإطار الزمني",
    skip: "تخطي",
    continue: "التالي",
    titleThree: "أسلوب القرار",
    bodyThree: "اختياري. يساعدنا في وزن الفرص بين الأمان والعائد.",
    safety: "حماية رأس المال",
    yield: "تعظيم العائد",
    finish: "ابدأ الآن",
    finishing: "جارٍ التجهيز...",
  },
} as const

export default function OnboardingPage() {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const roles = getRoles(locale)
  const horizons = getHorizons(locale)
  const budgetRanges = getBudgetRanges(locale)
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [horizon, setHorizon] = useState("")
  const [budget, setBudget] = useState("")
  const [yieldBias, setYieldBias] = useState(50)
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      const profileUpdate: Record<string, unknown> = {}
      if (role) {
        profileUpdate.inferredSignals = { onboardingRole: role }
      }
      if (horizon) profileUpdate.horizon = horizon
      if (budget) {
        const match = budgetRanges.find((item) => item.key === budget)
        if (match) profileUpdate.preferredMarkets = [`budget:${match.min}-${match.max ?? "max"}`]
      }
      profileUpdate.yieldVsSafety = yieldBias / 100
      profileUpdate.riskBias = yieldBias > 60 ? 0.5 : 0.65

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileUpdate),
      })
    } catch {
      // non-blocking
    } finally {
      setSaving(false)
      const query =
        role === "broker"
          ? locale === "ar"
            ? "اعرض لي المشاريع الجاهزة بإشارة BUY"
            : "Show me ready BUY-signal projects"
          : locale === "ar"
            ? "ما المناطق التي تقدم أفضل عائد؟"
            : "What areas have the best yield?"
      router.push(prefixLocalePath(`/chat?q=${encodeURIComponent(query)}`, locale))
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`h-1 flex-1 rounded-full transition-colors ${item <= step ? "bg-foreground" : "bg-border"}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.step(1)}</p>
            <h1 className="mt-3 text-2xl md:text-3xl font-serif text-foreground">{copy.titleOne}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.bodyOne}</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setRole(item.key)
                    setStep(2)
                  }}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    role === item.key ? "border-primary/60 bg-primary/10" : "border-border/60 bg-card/70 hover:border-primary/30"
                  }`}
                >
                  <item.icon className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.step(2)}</p>
            <h1 className="mt-3 text-2xl md:text-3xl font-serif text-foreground">{copy.titleTwo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.bodyTwo}</p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{copy.budget}</p>
                <div className="grid grid-cols-2 gap-2">
                  {budgetRanges.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setBudget(item.key)}
                      className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                        budget === item.key
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/60 bg-background/50 text-foreground hover:border-primary/30"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{copy.horizon}</p>
                <div className="space-y-2">
                  {horizons.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setHorizon(item.key)}
                      className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                        horizon === item.key
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/60 bg-background/50 text-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground ml-2">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(3)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                <SkipForward className="h-3.5 w-3.5" /> {copy.skip}
              </button>
              <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-medium transition hover:bg-foreground/90">
                {copy.continue} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.step(3)}</p>
            <h1 className="mt-3 text-2xl md:text-3xl font-serif text-foreground">{copy.titleThree}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.bodyThree}</p>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  {copy.safety}
                </div>
                <div className="flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  {copy.yield}
                </div>
              </div>
              <input type="range" min={0} max={100} value={yieldBias} onChange={(e) => setYieldBias(Number(e.target.value))} className="w-full accent-foreground" />
              <div className="text-center mt-2">
                <span className="text-xs text-muted-foreground">{yieldDescription(yieldBias, locale)}</span>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <button onClick={() => finish()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                <SkipForward className="h-3.5 w-3.5" /> {copy.skip}
              </button>
              <button onClick={() => finish()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium transition hover:bg-foreground/90 disabled:opacity-50">
                {saving ? copy.finishing : copy.finish} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
