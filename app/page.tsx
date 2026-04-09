import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  Building2,
  Map,
  Users2,
  ShieldCheck,
  TrendingUp,
  FileText,
  Lock,
  Activity,
  Zap,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/homepage/hero-section"
import { DecisionTunnelStepper } from "@/components/homepage/decision-tunnel-stepper"
import { getMarketPulseSummary } from "@/lib/frontend-content"
import { SEO, absoluteUrl, getLocaleAlternates, getSeoCopy } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const copy = getSeoCopy(locale)

  return {
    title: copy.homeTitle,
    description: copy.homeDescription,
    alternates: getLocaleAlternates("/"),
    openGraph: {
      title: copy.defaultTitle,
      description: copy.homeDescription,
      url: getLocaleAlternates("/").languages?.[locale],
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.defaultTitle,
      description: copy.homeDescription,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

function getSurfaces(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          icon: Sparkles,
          label: "محطة القرار",
          description: "حوّل الاستعلامات إلى SQL حتمي مع أثر أدوات واضح - لا دردشة تسويقية.",
          href: "/chat",
          cta: "جرّب محطة القرار",
          accent: "text-blue-400",
          bg: "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
        },
        {
          icon: Building2,
          label: "طبقة المشاريع (API)",
          description: "كل مشروع مع استجابة API مباشرة: التسعير، العائد، والضغط - بنفس شكل الـ JSON الذي يوصله لبوابتك.",
          href: "/properties",
          cta: "عرض البيانات",
          accent: "text-indigo-400",
          bg: "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40",
        },
        {
          icon: Map,
          label: "ملف المناطق",
          description: "تغطية موثّقة لمناطق الإمارات مع مؤشرات العرض والطلب والعائد.",
          href: "/areas",
          cta: "استكشف التغطية",
          accent: "text-teal-400",
          bg: "bg-teal-500/5 border-teal-500/20 hover:border-teal-500/40",
        },
        {
          icon: Users2,
          label: "موثوقية المطورين",
          description: "تحقق من سجل التسليم والتقييمات الدقيقة لكل مطور.",
          href: "/developers",
          cta: "مراجعة المطورين",
          accent: "text-violet-400",
          bg: "bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
        },
        {
          icon: TrendingUp,
          label: "محرك الإشارات",
          description: "إشارات التوقيت والضغط - نظام القرار V1 مباشر.",
          href: "/top-data",
          cta: "لوحة الإشارات",
          accent: "text-amber-400",
          bg: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
        },
        {
          icon: FileText,
          label: "دليل التكامل",
          description: "وثائق API والربط المؤسسي - كيف تضيف Entrestate تحت بوابتك الحالية.",
          href: "/enterprise",
          cta: "افتح الدليل",
          accent: "text-rose-400",
          bg: "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
        },
      ]
    : [
  {
    icon: Sparkles,
    label: "Decision Terminal",
    description: "Structured queries with deterministic SQL traces - no chatbot theater.",
    href: "/chat",
    cta: "Open terminal",
    accent: "text-blue-400",
    bg: "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
  },
  {
    icon: Building2,
    label: "Project API Layer",
    description: "Every project with the exact JSON your frontend would consume.",
    href: "/properties",
    cta: "Explore data",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40",
  },
  {
    icon: Map,
    label: "Area Intelligence",
    description: "Coverage across UAE neighbourhoods with yield, supply pressure, and timing signals.",
    href: "/areas",
    cta: "View coverage",
    accent: "text-teal-400",
    bg: "bg-teal-500/5 border-teal-500/20 hover:border-teal-500/40",
  },
  {
    icon: Users2,
    label: "Developer Reliability",
    description: "Delivery consistency, stress-grade distribution, and track record per developer.",
    href: "/developers",
    cta: "Review developers",
    accent: "text-violet-400",
    bg: "bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: TrendingUp,
    label: "Signal Engine V1",
    description: "Live timing signals, affordability tiers, and market pulse - evidence-backed.",
    href: "/top-data",
    cta: "Open signals",
    accent: "text-amber-400",
    bg: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: FileText,
    label: "Integration Guide",
    description: "API docs + enterprise integration map. Plug the backend into your existing portal.",
    href: "/enterprise",
    cta: "View guide",
    accent: "text-rose-400",
    bg: "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
  },
]
}

const structuredDataObj = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SEO.siteName,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.svg"),
    },
    {
      "@type": "WebSite",
      name: SEO.siteName,
      url: absoluteUrl("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/search")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default async function HomePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const surfaces = getSurfaces(locale)
  const pulse = await getMarketPulseSummary().catch(() => ({
    data_as_of: new Date().toISOString(),
    summary: { total: 2813, avg_price: null, avg_yield: null, buy_signals: 136, high_confidence: 0 },
  }))

  const totalProjects = pulse.summary.total || 2813

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataObj) }}
      />
      <Navbar />

      <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-32 md:pt-44">

        {/* ── Hero ── */}
        <HeroSection totalProjects={totalProjects} />

        {/* ── Decision tunnel ── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{isArabic ? "كيف يعمل" : "How it works"}</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "سلسلة قرار من 4 مراحل" : "A 4-stage decision pipeline"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              {isArabic
                ? "كل إشارة تمر عبر خط معالجة منظم. لا تنتقل بيانات القوائم الخام مباشرة إلى القرار."
                : "Every signal passes through a structured pipeline. No raw listing data goes directly to a decision."}
            </p>
          </div>
          <DecisionTunnelStepper />
        </section>

        {/* ── Intelligence surfaces ── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{isArabic ? "المنصة" : "The platform"}</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "ست واجهات للبنية التحتية" : "Six infrastructure surfaces"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              {isArabic
                ? "كل واجهة تقرّبك من نفس البيانات المقيّمة، لكن من زاوية مختلفة تناسب طريقة عملك."
                : "Each surface is a different entry point into the same scored dataset and API response."}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {surfaces.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.label}
                  href={prefixLocalePath(s.href, locale)}
                  className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/20 ${s.bg}`}
                >
                  <div>
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                    <p className="mt-3 text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                    {s.cta}
                    <ArrowRight className={`h-3 w-3 transition-transform ${isArabic ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Enterprise funnel ── */}
        <section className="mt-28 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 md:p-12 overflow-hidden relative">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-6">
                <Lock className="h-3 w-3" />
                {isArabic ? "مؤسسي" : "Enterprise Tier"}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                {isArabic ? "طبقة القرار والتنفيذ" : "Decision + Execution Infrastructure"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {isArabic 
                  ? "هذا الموقع هو بيئة العرض. كل ما تراه يعمل عبر API يمكنك توصيله تحت بوابتك الحالية." 
                  : "This site is the live demo. Everything you see runs on an API that plugs invisibly under your existing portal."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={prefixLocalePath("/enterprise", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                >
                  {isArabic ? "دليل التكامل" : "Integration Guide"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={prefixLocalePath("/contact", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-sm font-semibold transition-all hover:bg-slate-900"
                >
                  {isArabic ? "مبيعات المؤسسات" : "Enterprise Sales"}
                </Link>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-video rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl">
               <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                       <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Tunnel</span>
                    </div>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    <div className="h-12 w-full rounded-lg bg-slate-900 border border-slate-800 flex items-center px-4">
                       <div className="h-1.5 w-1/3 rounded-full bg-blue-500/40" />
                    </div>
                    <div className="h-12 w-full rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center px-4">
                       <div className="h-1.5 w-1/2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="h-12 w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center px-4">
                       <div className="h-1.5 w-2/3 rounded-full bg-emerald-500" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 bg-blue-600/10 blur-[120px] rounded-full" />
        </section>

        {/* ── Automation Moat ── */}
        <section className="mt-28">
          <div className="mb-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">{isArabic ? "خندق الأتمتة" : "The Automation Moat"}</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              {isArabic 
                ? "لا تكتفِ بالوصول إلى البيانات؛ قم بأتمتتها. أنشئ وكلاء ذكاء اصطناعي يعملون على مدار الساعة لاستخراج الفرص." 
                : "Don't just access data; automate it. Build AI agents that run 24/7 to extract opportunities, verify signals, and generate market briefs."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-sm">
               <Zap className="h-8 w-8 text-blue-400 mb-6" />
               <h3 className="text-xl font-bold mb-3">{isArabic ? "استوديو الوكلاء المحترفين" : "Pro Agent Studio"}</h3>
               <p className="text-sm text-slate-500 leading-relaxed mb-6">
                 Visual node-based builder for high-end market pipelines. Connect data scientists to live inventory feeds.
               </p>
               <Link href={prefixLocalePath("/apps/agent-builder", locale)} className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                 {isArabic ? "بدء البناء" : "Start building"} <ArrowRight className="h-4 w-4" />
               </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-sm">
               <FileText className="h-8 w-8 text-violet-400 mb-6" />
               <h3 className="text-xl font-bold mb-3">{isArabic ? "أتمتة المخرجات الضخمة" : "Mass-Automation Outputs"}</h3>
               <p className="text-sm text-slate-500 leading-relaxed mb-6">
                 Schedule thousands of personalized PDF briefs or social assets. Scale your institutional reach without increasing headcount.
               </p>
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-800 px-2 py-1 rounded">
                 Enterprise Only
               </span>
            </div>
          </div>
        </section>

        {/* ── Evidence trust bar ── */}
        <section className="mt-12 rounded-2xl border border-border bg-card px-6 py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <ShieldCheck className="h-8 w-8 shrink-0 text-primary/60" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{isArabic ? "طبقات الثقة الخمس - كل رقم أمامك ومعه مستوى موثوقيته" : "5-Layer Evidence Stack - you always know how reliable a number is"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { tag: "L1 Canonical", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
                  { tag: "L2 Derived", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
                  { tag: "L3 Dynamic", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
                  { tag: "L4 External", color: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
                  { tag: "L5 Raw", color: "border-red-500/40 bg-red-500/10 text-red-400" },
                ].map((l) => (
                  <span key={l.tag} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${l.color}`}>
                    {l.tag}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isArabic
                  ? "البيانات الخارجية الخام لا تقود القرار مباشرة. كل مقياس يمر عبر خط التحقق قبل الوصول إلى حالة L1 Canonical."
                  : "Raw external data never drives a decision directly. Every metric is adjudicated through the pipeline before reaching L1 Canonical status."}
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href={prefixLocalePath("/docs/data-information", locale)}
                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"
              >
                {isArabic ? "كيف تعمل البيانات" : "How data works"} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
