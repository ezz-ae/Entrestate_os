"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Check, Minus, ChevronDown, ChevronUp, Tag } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

function CouponBanner({
  coupon,
  onClear,
  locale,
}: {
  coupon: { code: string; discount_pct: number } | null
  onClear: () => void
  locale: AppLocale
}) {
  if (!coupon) return null
  const isArabic = locale === "ar"
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <Tag className="h-4 w-4" />
        <span>
          {isArabic ? (
            <>
              تم تفعيل الكود <strong>{coupon.code.toUpperCase()}</strong> — خصم {coupon.discount_pct}% على أول شهر
            </>
          ) : (
            <>
              Coupon <strong>{coupon.code.toUpperCase()}</strong> applied — {coupon.discount_pct}% off your first month
            </>
          )}
        </span>
      </div>
      <button onClick={onClear} className="text-xs text-emerald-500 hover:text-emerald-400 underline">
        {isArabic ? "إزالة" : "Remove"}
      </button>
    </div>
  )
}

function CouponInput({
  onApplied,
  locale,
}: {
  onApplied: (coupon: { code: string; discount_pct: number }) => void
  locale: AppLocale
}) {
  const [code, setCode] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const isArabic = locale === "ar"

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/billing/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        onApplied({ code: data.code, discount_pct: data.discount_pct })
        setCode("")
        setState("idle")
      } else {
        setErrorMsg(data.reason ?? (isArabic ? "الكود غير صالح." : "Invalid coupon code."))
        setState("error")
      }
    } catch {
      setErrorMsg(isArabic ? "تعذر التحقق من الكود. حاول مرة أخرى." : "Could not validate coupon. Try again.")
      setState("error")
    }
  }

  return (
    <form onSubmit={handleApply} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setState("idle"); setErrorMsg("") }}
          placeholder={isArabic ? "أدخل الكود" : "Coupon code"}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={state === "loading" || !code.trim()}>
        {state === "loading" ? "…" : isArabic ? "تفعيل" : "Apply"}
      </Button>
      {state === "error" && errorMsg && (
        <span className="text-xs text-red-500">{errorMsg}</span>
      )}
    </form>
  )
}

const tiers = [
  {
    name: "Starter",
    price: "Free",
    sub: "Always free",
    blurb: "Start exploring. 3 AI sessions per day, core market data.",
    cta: "Get started",
    checkoutTier: null,
    popular: false,
  },
  {
    name: "Pro",
    price: "$299",
    sub: "per month",
    blurb: "Unlimited AI sessions, full deal screener, CSV exports.",
    cta: "Subscribe with PayPal",
    checkoutTier: "pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$999",
    sub: "per month",
    blurb: "Team seats, shared watchlists, report generation, audit trail.",
    cta: "Subscribe with PayPal",
    checkoutTier: "team",
    popular: false,
  },
  {
    name: "Institutional",
    price: "$4,000",
    sub: "per month",
    blurb: "Portfolio monitoring, risk oversight, enterprise-grade support.",
    cta: "Subscribe with PayPal",
    checkoutTier: "institutional",
    popular: false,
  },
]

type FeatureValue = boolean | string

const FEATURE_GROUPS: {
  group: string
  rows: { label: string; values: [FeatureValue, FeatureValue, FeatureValue, FeatureValue] }[]
}[] = [
  {
    group: "AI Chat",
    rows: [
      { label: "AI messages", values: ["Free window + cooldown", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Deal screener", values: [false, true, true, true] },
      { label: "Price reality check", values: [false, true, true, true] },
      { label: "Area risk brief", values: [false, true, true, true] },
      { label: "Developer due diligence", values: [false, true, true, true] },
      { label: "Investor memo generation", values: [false, true, true, true] },
    ],
  },
  {
    group: "Market Intelligence",
    rows: [
      { label: "Market pulse overview", values: [true, true, true, true] },
      { label: "Top-data tables", values: ["Read-only", true, true, true] },
      { label: "Area trust map", values: [true, true, true, true] },
      { label: "Developer reliability scores", values: [true, true, true, true] },
      { label: "Timing signals (BUY / HOLD / WAIT)", values: [false, true, true, true] },
      { label: "Supply pressure heatmaps", values: [false, false, true, true] },
    ],
  },
  {
    group: "Data & Exports",
    rows: [
      { label: "CSV export", values: [false, true, true, true] },
      { label: "PDF investor memo", values: [false, true, true, true] },
      { label: "Saved watchlists", values: ["1", "10", "Unlimited", "Unlimited"] },
      { label: "Shared team watchlists", values: [false, false, true, true] },
      { label: "Audit trail", values: [false, false, true, true] },
      { label: "API access", values: [false, false, false, true] },
    ],
  },
  {
    group: "Account",
    rows: [
      { label: "Team seats", values: ["1", "1", "5", "25+"] },
      { label: "Priority support", values: [false, false, true, true] },
      { label: "Dedicated account manager", values: [false, false, false, true] },
      { label: "Custom onboarding", values: [false, false, false, true] },
    ],
  },
]

const FAQ_GROUPS = [
  {
    group: "The Platform",
    items: [
      {
        q: "What is Entrestate, exactly?",
        a: "Entrestate is a real estate intelligence operating system — not a listing portal. It takes raw UAE property data and transforms it into institutional-grade investment intelligence through a ten-phase data pipeline and five-layer evidence stack. Think of it as a decision engine: it tells you not just what exists, but what to do and why.",
      },
      {
        q: "How is this different from Property Finder or Bayut?",
        a: "Property Finder and Bayut are listing portals — they show you what's available. Entrestate scores every project against timing labels, stress resilience, yield benchmarks, and data confidence, then matches them to your specific investor profile. External portals are treated as 'sensors' in our architecture — data inputs we validate, not sources we trust blindly.",
      },
      {
        q: "What is the Decision Tunnel?",
        a: "The Decision Tunnel is Entrestate's four-stage intelligence pipeline: Intent (parsing your natural language goals), Evidence (collecting high-integrity verified records), Judgment (ranking candidates via a 65/35 Market Score + Personal Match weighting), and Action (generating defensible outputs like investor memos and reports). It transforms a question into a deployable decision.",
      },
      {
        q: "What is the 5-Layer Evidence Stack?",
        a: "Every data point in the system is tagged by reliability tier — from L1 Canonical (audited static truths: verified locations, cleaned developer names, official launch dates) down to L5 Raw (unverified, unprocessed). This means every metric comes with a known confidence level. If a number hasn't reached L1 or L2, the system flags it rather than hiding the uncertainty.",
      },
    ],
  },
  {
    group: "Signals & Scoring",
    items: [
      {
        q: "What does a BUY signal mean?",
        a: "A BUY signal means a project has passed through the full Decision Tunnel and scored high enough on both the 65% Market Score (timing, stress resilience, yield, data confidence) and the 35% Personal Match (your risk profile and time horizon). Out of 2,813 active UAE projects, 136 currently hold a BUY or STRONG_BUY signal — roughly 5% of total inventory.",
      },
      {
        q: "How is the 65% Market Score calculated?",
        a: "The Market Score evaluates four objective signals: (1) Timing Signal — identifying the optimal investment window based on price momentum, lifecycle state, and secondary market flow; (2) Stress Resilience — measuring delivery risk, developer track record, and volatility resistance; (3) Yield — comparing gross yield against the UAE market average (currently ~6.6%); (4) Data Confidence — scoring how verified the underlying data is using the 5-Layer Evidence Stack.",
      },
      {
        q: "What is the Stress Resilience grade and how is it determined?",
        a: "The Stress Resilience grade measures a project's ability to withstand market volatility, delivery risk, and execution pressure. It is driven by developer reliability, supply resilience, liquidity resilience, pricing discipline, handover reliability, area stability, and payment plan strength. A poor developer track record directly lowers a project's stress grade even if its yield is attractive.",
      },
      {
        q: "How does my investor profile change what I see?",
        a: "Your profile acts as a Decision Lens applied to the 35% Personal Match component. A Conservative investor sees only the 99 projects that prioritize capital preservation and low volatility. A Balanced investor gets yield-optimized results. A Speculative investor can explore the 71% of market inventory flagged as higher-risk. Two people asking the same question receive fundamentally different ranked results — this prevents what we call 'intent collapse'.",
      },
      {
        q: "What is a Timing Signal?",
        a: "The Timing Signal identifies the optimal entry or exit window for a project by treating it as a dynamic lifecycle state rather than a static listing. It analyzes price momentum tiers (from Deep Discount to High Premium), secondary market resale rates, flip patterns, supply-demand dynamics, and handover timelines. This tells you not just if a project is good — but if now is the right time.",
      },
    ],
  },
  {
    group: "AI & Reports",
    items: [
      {
        q: "What can the AI Copilot actually do?",
        a: "The AI Copilot screens properties by budget, area, and risk profile using live scored data; compares markets side-by-side on price, yield, stress grade, and timing label; returns real V1 stress metrics and resilience sub-scores; generates full investor memos with price reality checks, developer due diligence, and final verdicts; and saves structured reports to your account. It answers from live UAE market data, not generic knowledge.",
      },
      {
        q: "What are slash commands?",
        a: "Slash commands are quick shortcuts inside the AI chat. Type /screen to run a deal screener, /compare for a market comparison, /memo for an investor memo, /risk to return real V1 stress metrics, or /price for a price reality check. They auto-complete as you type and execute pre-built intelligence workflows instantly.",
      },
      {
        q: "What is a Decision Canvas?",
        a: "The Decision Canvas is a live workspace panel alongside the AI chat. It surfaces workspace cards (matched projects, avg price, decision label, data confidence), performance sparkline charts (investor score and gross yield curves across results), a project comparison table with bar charts, and a V1 risk breakdown panel with live stress grade, stress score, and resilience sub-scores.",
      },
      {
        q: "Can I export reports?",
        a: "Yes. Pro and above tiers can save AI sessions as structured investor reports (PDF or branded format), download via direct link, and share via the built-in Share modal which supports direct links, social media (X/Twitter, LinkedIn, WhatsApp, Telegram), AI-generated social posts for each platform, portal embed codes, and press release formatting.",
      },
    ],
  },
  {
    group: "Broker & Team Features",
    items: [
      {
        q: "What does the Broker Dashboard include?",
        a: "The Broker Dashboard is built for sales teams and includes: CRM Intelligence (AI-powered lead scoring categorizing leads as hot, warm, or cold based on engagement depth, budget alignment, and conversion probability), Brochure-to-Listing Automation (drag and drop a PDF brochure; Gemini 1.5 extracts payment plans, coordinates, unit specs, and handover dates to create a complete listing in minutes), competitive analysis, and a Sales Communication Coach for objection handling and buyer persona customization.",
      },
      {
        q: "How does AI lead scoring work?",
        a: "The system automatically calculates a priority score for each lead based on: pages viewed and time on site (engagement depth), how specific their inquiry is, response time to broker communications, budget match against available inventory, historical conversion patterns, and lead source quality (website vs. social vs. referral). High-scoring hot leads surface in a dedicated alert widget with the AI's reasoning for the prioritization.",
      },
      {
        q: "What is Brochure-to-Listing Automation?",
        a: "A broker drags and drops a developer PDF brochure into the Add New Project interface. Gemini 1.5 parses the document and extracts payment plan structures, unit specifications, coordinates, handover dates, and pricing data — auto-populating a structured listing form. Missing fields are highlighted for human review before the project is published as a standalone SEO-optimized landing page. What used to take hours takes minutes.",
      },
    ],
  },
  {
    group: "Pricing & Billing",
    items: [
      {
        q: "How does billing work?",
        a: "All plans are monthly subscriptions processed via PayPal. There are no contracts, no cancellation fees, and no card details stored on our servers. You can upgrade or cancel at any time — upgrades take effect immediately.",
      },
      {
        q: "What is the free tier?",
        a: "The Starter tier is always free. It includes a free message window with cooldown (a set number of AI sessions per day before a cooldown period), read-only access to top data tables, area trust maps, developer reliability scores, and 1 saved watchlist. It's designed to let you explore the platform's intelligence before committing.",
      },
      {
        q: "What does Pro add over Starter?",
        a: "Pro ($299/mo) unlocks unlimited AI messages, the full deal screener, price reality checks, area risk briefs, developer due diligence, investor memo generation, timing labels (BUY/HOLD/WAIT), CSV exports, PDF investor memos, up to 10 saved watchlists, and 1 user seat.",
      },
      {
        q: "When does Team tier make sense?",
        a: "Team ($999/mo) is for brokerage firms and analyst teams. It adds 5 seats, shared team watchlists, supply pressure heatmaps, report generation, audit trails, and priority support. It's the minimum tier required for report export via the API and for Broker Dashboard features.",
      },
      {
        q: "What is included in Institutional?",
        a: "Institutional ($4,000/mo) is for funds, family offices, and enterprise real estate operators. It includes 25+ seats, full API access for integration with internal systems, portfolio monitoring and risk oversight tooling, a dedicated account manager, and custom onboarding.",
      },
    ],
  },
]

function getLocalizedTiers(locale: AppLocale) {
  if (locale !== "ar") return tiers
  return [
    {
      name: "الأساس",
      price: "مجاني",
      sub: "دائمًا بدون رسوم",
      blurb: "ابدأ بهدوء. 3 جلسات يوميًا مع مؤشرات السوق الأساسية.",
      cta: "ابدأ الآن",
      checkoutTier: null,
      popular: false,
    },
    {
      name: "احترافي",
      price: "$299",
      sub: "شهريًا",
      blurb: "جلسات غير محدودة، فرز كامل للفرص، وتصدير البيانات بنقرة واحدة.",
      cta: "اشترك عبر PayPal",
      checkoutTier: "pro",
      popular: true,
    },
    {
      name: "فرق",
      price: "$999",
      sub: "شهريًا",
      blurb: "مقاعد للفريق، قوائم مشتركة، تقارير جاهزة، وسجل واضح للقرارات.",
      cta: "اشترك عبر PayPal",
      checkoutTier: "team",
      popular: false,
    },
    {
      name: "مؤسسي",
      price: "$4,000",
      sub: "شهريًا",
      blurb: "متابعة المحافظ، رقابة المخاطر، تكاملات، ودعم على مستوى المؤسسة.",
      cta: "اشترك عبر PayPal",
      checkoutTier: "institutional",
      popular: false,
    },
  ]
}

function getLocalizedFeatureGroups(locale: AppLocale) {
  if (locale !== "ar") return FEATURE_GROUPS
  return [
    {
      group: "مساعد القرار",
      rows: [
        { label: "جلسات المساعد", values: ["نافذة مجانية + انتظار", "غير محدود", "غير محدود", "غير محدود"] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "فرز الفرص", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "فحص السعر", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "ملخص مخاطر المنطقة", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "فحص المطور", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "مذكرة استثمار", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
      ],
    },
    {
      group: "رؤية السوق",
      rows: [
        { label: "نبض السوق", values: [true, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "جداول المؤشرات", values: ["قراءة فقط", true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "خريطة السوق", values: [true, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "موثوقية المطور", values: [true, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "إشارات التوقيت (BUY / HOLD / WAIT)", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "خرائط ضغط المعروض", values: [false, false, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
      ],
    },
    {
      group: "البيانات والتصدير",
      rows: [
        { label: "تصدير CSV", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "مذكرة PDF", values: [false, true, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "قوائم محفوظة", values: ["1", "10", "غير محدود", "غير محدود"] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "قوائم مشتركة", values: [false, false, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "سجل التتبع", values: [false, false, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "وصول API", values: [false, false, false, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
      ],
    },
    {
      group: "الحساب",
      rows: [
        { label: "مقاعد الفريق", values: ["1", "1", "5", "25+"] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "دعم أولوية", values: [false, false, true, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "مدير حساب", values: [false, false, false, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
        { label: "تهيئة مخصصة", values: [false, false, false, true] as [FeatureValue, FeatureValue, FeatureValue, FeatureValue] },
      ],
    },
  ]
}

function getLocalizedFaqGroups(locale: AppLocale) {
  if (locale !== "ar") return FAQ_GROUPS
  return [
    {
      group: "المنصة",
      items: [
        { q: "ما هو Entrestate بالضبط؟", a: "Entrestate منصة قرار عقاري، وليست بوابة إعلانات. نجمع بيانات السوق، ننظفها، ثم نحولها إلى قراءة واضحة تساعدك على اختيار المشروع المناسب وتوقيت الدخول الصحيح." },
        { q: "ما الفرق بينه وبين Property Finder أو Bayut؟", a: "تلك المنصات تعرض المعروض. أما Entrestate فيقيّم المعروض نفسه: السعر، التوقيت، الضغط، العائد، وثقة البيانات، ثم يربطه بهدف المستثمر لا بمجرد قائمة مشاريع." },
        { q: "ما المقصود بمسار القرار؟", a: "هو الطريقة التي يعمل بها المنتج: نفهم طلبك، نجمع الأدلة، نرتّب الخيارات، ثم نعطيك مخرجًا عمليًا مثل قائمة فرص أو مذكرة استثمار." },
        { q: "ما هي طبقات الثقة الخمس؟", a: "كل رقم في المنصة له درجة ثقة واضحة، من بيانات موثقة بالكامل إلى بيانات أولية ما زالت تحت التحقق. لهذا لا نخفي الشك، بل نظهره لك بوضوح." },
      ],
    },
    {
      group: "الإشارات والتقييم",
      items: [
        { q: "ماذا يعني BUY؟", a: "يعني أن المشروع اجتاز طبقات التقييم وحقق مستوى قويًا في التوقيت والمرونة والعائد وثقة البيانات، بما يناسب هدف المستثمر." },
        { q: "كيف يُحسب Market Score؟", a: "النتيجة تعتمد على أربعة أعمدة: التوقيت، والمرونة تحت الضغط، والعائد، وثقة البيانات. هذه الأعمدة تعمل معًا لتكوين قراءة سوقية قابلة للدفاع عنها." },
        { q: "ما معنى درجة الضغط؟", a: "درجة الضغط تقيس قدرة المشروع على تحمل تقلب السوق والتنفيذ والتسليم. يدخل فيها تاريخ المطور، سيولة السوق، استقرار المنطقة، وخطة السداد." },
        { q: "كيف يغيّر ملف المستثمر النتائج؟", a: "نفس المشروع قد يبدو مناسبًا لمستثمر وغير مناسب لآخر. لذلك نعيد ترتيب النتائج بحسب أسلوبك: محافظ، متوازن، أو أعلى مخاطرة." },
        { q: "ما المقصود بإشارة التوقيت؟", a: "هي قراءة تقول لك هل الآن هو الوقت المناسب للدخول، أم الأفضل الانتظار، أو الاكتفاء بالمراقبة. ليست حكمًا على المشروع فقط، بل على اللحظة أيضًا." },
      ],
    },
    {
      group: "المساعد والتقارير",
      items: [
        { q: "ما الذي يقدمه مساعد القرار؟", a: "يفرز المشاريع بحسب الميزانية والهدف، يقارن بين المناطق والمطورين، يعرض مؤشرات V1 الفعلية، ويكتب لك مخرجات جاهزة مثل مذكرات الاستثمار والتقارير." },
        { q: "ما هي أوامر الشرطة المائلة؟", a: "هي اختصارات سريعة داخل المحادثة مثل /screen و /compare و /memo و /risk. تسرّع الوصول للمهمة بدل كتابة الطلب من الصفر." },
        { q: "ما هي Decision Canvas؟", a: "هي مساحة عمل حيّة بجانب المحادثة تعرض البطاقات، المؤشرات، والجداول المقارنة حتى ترى الصورة كاملة أثناء التقييم." },
        { q: "هل أستطيع تصدير التقارير؟", a: "نعم. في الباقات الأعلى يمكنك حفظ الجلسات كمذكرات وتقارير قابلة للمشاركة أو التنزيل بروابط مباشرة وصيغ جاهزة." },
      ],
    },
    {
      group: "الوسطاء والفرق",
      items: [
        { q: "ماذا تتضمن لوحة الوسطاء؟", a: "تضم قراءة العملاء المحتملين، أتمتة تحويل البروشور إلى مشروع، مقارنة المنافسين، وأدوات تساعد فريق المبيعات في متابعة الاعتراضات والفرص." },
        { q: "كيف يعمل تقييم العملاء المحتملين؟", a: "يعتمد على التفاعل، دقة الطلب، ملاءمة الميزانية، سرعة الاستجابة، ومصدر العميل. ثم يرفع لك الأولويات بدل التساوي بين الجميع." },
        { q: "ما هي أتمتة البروشور إلى مشروع؟", a: "ترفع ملف المطور، فتستخرج المنصة منه خطة السداد والمواصفات والموقع والتسليم، ثم تبني لك مشروعًا جاهزًا للمراجعة بسرعة كبيرة." },
      ],
    },
    {
      group: "الأسعار والفوترة",
      items: [
        { q: "كيف تعمل الفوترة؟", a: "كل الباقات شهرية عبر PayPal. يمكنك الترقية أو الإيقاف في أي وقت، ولا نخزن بيانات البطاقة على خوادمنا." },
        { q: "ما هي الباقة المجانية؟", a: "الباقة الأساسية تتيح لك تجربة المنصة، مع جلسات يومية محدودة وبعض الجداول والخرائط وقائمة متابعة واحدة." },
        { q: "ماذا تضيف باقة Pro؟", a: "تفتح لك الجلسات غير المحدودة، والفرز الكامل، وفحص السعر، وتقارير المستثمر، وتصدير CSV وPDF، مع أدوات أعمق لاتخاذ القرار." },
        { q: "متى أحتاج باقة Team؟", a: "إذا كان القرار يتم داخل فريق، فهذه الباقة هي الأنسب. تضيف مقاعد متعددة، قوائم مشتركة، تقارير، وسجل متابعة للعمل الجماعي." },
        { q: "ماذا تتضمن الباقة المؤسسية؟", a: "الباقة المؤسسية موجهة للصناديق والمكاتب العائلية والجهات الكبيرة، وتشمل مقاعد موسعة، API، متابعة محافظ، ودعم خاص." },
      ],
    },
  ]
}

function FaqGroup({ group, items }: { group: string; items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{group}</p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-border"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="border-t border-border/40 px-5 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)
    return (
      <span className="flex justify-center">
        <Check className="h-4 w-4 text-emerald-500" />
      </span>
    )
  if (value === false)
    return (
      <span className="flex justify-center">
        <Minus className="h-4 w-4 text-muted-foreground/40" />
      </span>
    )
  return <span className="block text-center text-xs text-muted-foreground">{value}</span>
}

export default function PricingPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount_pct: number } | null>(null)
  const localizedTiers = getLocalizedTiers(locale)
  const localizedFeatureGroups = getLocalizedFeatureGroups(locale)
  const localizedFaqGroups = getLocalizedFaqGroups(locale)

  function buildCheckoutUrl(checkoutTier: string) {
    const base = `/api/billing/paypal/checkout?tier=${checkoutTier}`
    return activeCoupon ? `${base}&coupon=${encodeURIComponent(activeCoupon.code)}` : base
  }

  function getDisplayPrice(tier: typeof tiers[0]) {
    if (!activeCoupon || !tier.checkoutTier) return tier.price
    const base = { pro: 299, team: 999, institutional: 4000 }[tier.checkoutTier as string]
    if (!base) return tier.price
    const discounted = (base * (1 - activeCoupon.discount_pct / 100)).toFixed(2)
    return `$${discounted}`
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 md:pt-36">
        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الأسعار" : "Pricing"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
            {isArabic ? "باقات تناسب كل مرحلة من رحلة القرار" : "Plans for every stage"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            {isArabic
              ? "باقات شهرية عبر PayPal. يمكنك الإيقاف أو الترقية في أي وقت بدون التزام طويل."
              : "Monthly PayPal subscriptions. Cancel anytime. No contracts."}
          </p>
        </header>

        {/* Coupon */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <CouponBanner coupon={activeCoupon} onClear={() => setActiveCoupon(null)} locale={locale} />
          {!activeCoupon && (
            <CouponInput onApplied={setActiveCoupon} locale={locale} />
          )}
        </div>

        {/* Tier cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-16">
          {localizedTiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative rounded-2xl border p-5 flex flex-col ${
                tier.popular
                  ? "border-foreground/30 bg-card shadow-md"
                  : "border-border/70 bg-card/70"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                  {isArabic ? "الأكثر طلبًا" : "Most popular"}
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{tier.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                {activeCoupon && tier.checkoutTier ? (
                  <>
                    <span className="text-2xl font-bold text-emerald-500">{getDisplayPrice(tier)}</span>
                    <span className="text-xs text-muted-foreground line-through ml-1">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{isArabic ? "للشهر الأول" : "first month"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.sub}</span>
                  </>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground flex-1">{tier.blurb}</p>
              {tier.checkoutTier ? (
                <Button className="mt-5 w-full" variant={tier.popular ? "default" : "outline"} asChild>
                  <Link href={buildCheckoutUrl(tier.checkoutTier)}>
                    {tier.cta}
                  </Link>
                </Button>
              ) : (
                <Button className="mt-5 w-full" variant="outline">
                  {tier.cta}
                </Button>
              )}
            </article>
          ))}
        </section>

        {/* Feature comparison table */}
        <section>
          <h2 className="mb-6 text-sm font-semibold text-foreground">{isArabic ? "مقارنة المزايا" : "Full feature comparison"}</h2>
          <div className="rounded-2xl border border-border/70 bg-card/70 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-5 border-b border-border/70 bg-muted/20">
              <div className="col-span-1 px-4 py-3" />
              {localizedTiers.map((t) => (
                <div key={t.name} className="px-2 py-3 text-center">
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                </div>
              ))}
            </div>

            {localizedFeatureGroups.map((group, gi) => (
              <div key={group.group} className={gi > 0 ? "border-t border-border/50" : ""}>
                {/* Group label */}
                <div className="grid grid-cols-5 bg-muted/10 px-4 py-2">
                  <p className="col-span-5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {group.group}
                  </p>
                </div>
                {/* Rows */}
                {group.rows.map((row, ri) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-5 items-center px-4 py-2.5 ${
                      ri % 2 === 0 ? "" : "bg-muted/5"
                    }`}
                  >
                    <p className="col-span-1 text-xs text-muted-foreground pr-4">{row.label}</p>
                    {row.values.map((val, vi) => (
                      <div key={vi} className="px-2">
                        <FeatureCell value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <footer className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>{isArabic ? "الدفع عبر PayPal — ولا نخزن بيانات البطاقة على خوادمنا" : "Payments via PayPal — no card stored on our servers"}</span>
          <span className="hidden sm:block text-border">|</span>
          <span>{isArabic ? "يمكنك الإيقاف في أي وقت بدون رسوم إلغاء" : "Cancel anytime, no cancellation fee"}</span>
          <span className="hidden sm:block text-border">|</span>
          <span>{isArabic ? "الترقية تُفعّل مباشرة" : "Upgrades take effect immediately"}</span>
        </footer>

        {/* FAQ */}
        <section className="mt-24">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{isArabic ? "كل ما تحتاج معرفته" : "Everything you need to know"}</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">{isArabic ? "أسئلة متكررة" : "Frequently Asked Questions"}</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              {isArabic
                ? "إجابات مباشرة على أهم ما تحتاجه قبل الاشتراك: كيف تعمل المنصة، وماذا تضيف كل باقة، ومتى تحتاج كل مستوى."
                : "From how the scoring engine works to what each plan includes — answered in plain language."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {localizedFaqGroups.map((faqGroup) => (
              <FaqGroup key={faqGroup.group} group={faqGroup.group} items={faqGroup.items} />
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-border/60 bg-card/60 px-8 py-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{isArabic ? "هل لديك سؤال خاص؟" : "Still have questions?"}</p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">{isArabic ? "تواصل مع الفريق" : "Talk to the team"}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              {isArabic
                ? "إذا كنت تبحث عن تسعير مؤسسي، أو تكامل API، أو تهيئة خاصة لفريقك، تواصل معنا مباشرة."
                : "For institutional inquiries, API integration, or custom enterprise pricing — reach us directly."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="default">
                <Link href={prefixLocalePath("/chat", locale)}>{isArabic ? "افتح مساعد القرار" : "Open AI Copilot"}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:hello@entrestate.com">{isArabic ? "راسلنا" : "Email us"}</a>
              </Button>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
