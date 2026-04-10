import type { Metadata } from "next"
import Link from "next/link"
import { Activity, ArrowRight, FileText, Lock, ShieldCheck, Zap } from "lucide-react"
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

function getTrustMarkers(locale: "en" | "ar") {
  return locale === "ar"
    ? ["Canonical DLD", "Verified Records", "Auditable Lineage", "SOC 2 Ready"]
    : ["Canonical DLD", "Verified Records", "Auditable Lineage", "SOC 2 Ready"]
}

function getAutomationCards(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          icon: Zap,
          title: "ProAgent Studio",
          body:
            "شغّل وكلاء مستقلين يعملون كمحللين دائمين يراقبون سرعة DLD وتحولات القوائم، وينفّذون فقط عند توافق ضوابط الحوكمة.",
          cta: "إطلاق البنية التنفيذية",
          href: "/apps/agent-builder",
          accent: "text-blue-400",
        },
        {
          icon: FileText,
          title: "Institutional Output Layer",
          body:
            "حوّل الحقيقة الموثقة إلى مذكرات استثمار، تقارير استخبارات سوق، وتحديثات مؤسسية مع نفس استمرارية الأدلة التي تقود كل حكم.",
          cta: "عرض طبقة المخرجات",
          href: "/enterprise",
          accent: "text-violet-400",
        },
      ]
    : [
        {
          icon: Zap,
          title: "ProAgent Studio",
          body:
            "Deploy always-on autonomous analysts that monitor DLD velocity, listing drift, and mandate thresholds, and execute only when governance rules align.",
          cta: "Launch execution stack",
          href: "/apps/agent-builder",
          accent: "text-blue-400",
        },
        {
          icon: FileText,
          title: "Institutional Output Layer",
          body:
            "Transform canonical truth into investor briefs, market intelligence reports, and institutional updates with the same evidence continuity that drives every verdict.",
          cta: "View output layer",
          href: "/enterprise",
          accent: "text-violet-400",
        },
      ]
}

const API_PAYLOAD_PREVIEW = {
  project: "Marina Vista",
  verdict: "BUY",
  confidence: 0.84,
  evidence_level: "L1_CANONICAL",
  sources: ["DLD", "PropertyFinder", "Bayut"],
  timing_score: 78,
  stress_grade: "B",
  yield_score: 72,
  drivers: {
    positive: ["DLD velocity +23% QoQ", "Below area median entry"],
    negative: ["Developer continuity at watch threshold"],
  },
}

export default async function HomePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const trustMarkers = getTrustMarkers(locale)
  const automationCards = getAutomationCards(locale)

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
        <HeroSection totalProjects={totalProjects} />

        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "مسار القرار" : "Decision Narrative"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic
                ? "إشارة → أدلة → حكم → تنفيذ"
                : "Signal → Evidence → Judgment → Action"}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              {isArabic
                ? "كل قرار عقاري عالي المخاطر يبدأ بإشارة واحدة. يعرض هذا المسار الموحد الإشارة → الأدلة → الحكم → التنفيذ، حيث تستضيف المرحلة الثانية طبقة الأدلة الخمس وتؤدي المرحلة الرابعة إلى الواجهات التنفيذية الست."
                : "Every high-stakes property decision starts with a signal. This unified tunnel keeps Signal → Evidence → Judgment → Action in one narrative, with Stage 2 holding the 5-layer evidence stack and Stage 4 flowing directly into the six execution surfaces."}
            </p>
          </div>
          <DecisionTunnelStepper />
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card px-6 py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <ShieldCheck className="h-8 w-8 shrink-0 text-primary/70" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {isArabic
                  ? "علامات ثقة تشغيلية عبر كل خطوة"
                  : "Operational trust markers across every stage"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trustMarkers.map((marker) => (
                  <span
                    key={marker}
                    className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={prefixLocalePath("/docs/data-information", locale)}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"
            >
              {isArabic ? "كيف تعمل الأدلة" : "See evidence model"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        <section className="relative mt-28 overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 md:p-12">
          <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <Lock className="h-3 w-3" />
                {isArabic ? "طبقة المؤسسات" : "Enterprise Layer"}
              </div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
                {isArabic
                  ? "هندسة قرار قابلة للتدقيق وليست واجهة تسويقية"
                  : "Auditable decision infrastructure, not dashboard theater"}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {isArabic
                  ? "واجهة الموقع تعرض القدرات، لكن نفس العمود الفقري يُدمج تحت بوابتك الحالية كطبقة قرار وتنفيذ مع حوكمة مؤسسية."
                  : "The site demonstrates the system, but the same decision spine deploys under your existing portal as governed infrastructure."}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href={prefixLocalePath("/enterprise", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                >
                  {isArabic ? "دليل التكامل المؤسسي" : "Integration architecture"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={prefixLocalePath("/contact", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-sm font-semibold transition-all hover:bg-slate-900"
                >
                  {isArabic ? "التحدث مع فريق المؤسسات" : "Talk to enterprise team"}
                </Link>
              </div>
            </div>

            <div className="relative aspect-square rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl lg:aspect-video">
              <div className="flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      {isArabic ? "مسار القرار النشط" : "Decision spine active"}
                    </span>
                  </div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>

                <div className="flex flex-1 flex-col justify-center space-y-4">
                  <div className="flex h-12 items-center rounded-lg border border-slate-800 bg-slate-900 px-4">
                    <div className="h-1.5 w-1/3 rounded-full bg-blue-500/40" />
                  </div>
                  <div className="flex h-12 items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4">
                    <div className="h-1.5 w-1/2 rounded-full bg-indigo-500" />
                  </div>
                  <div className="flex h-12 items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4">
                    <div className="h-1.5 w-2/3 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        </section>

        <section className="mt-24">
          <div className="mb-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "طبقة التنفيذ" : "Execution Infrastructure"}
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              {isArabic ? "ذكاء مستقل يحافظ على تنفيذ التفويضات" : "Autonomous intelligence for institutional execution"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {isArabic
                ? "يدير ProAgent Studio وكلاء دائمين يراقبون الإشارات الموثقة وينفّذون فقط عند توافق شروط التفويض، مع ضمان أن كل مخرج مثل مذكرات الاستثمار، تقارير استخبارات السوق، والتحديثات المؤسسية يعود لنفس الأدلّة."
                : "ProAgent Studio orchestrates always-on agents that monitor canonical signals, trigger execution only when mandate controls align, and keep investor briefs, market intelligence reports, and institutional updates tied to the same evidence continuity."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {automationCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-sm">
                  <Icon className={`mb-6 h-8 w-8 ${card.accent}`} />
                  <h3 className="mb-3 text-xl font-bold">{card.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-400">{card.body}</p>
                  <Link href={prefixLocalePath(card.href, locale)} className={`flex items-center gap-2 text-sm font-semibold ${card.accent}`}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-24 rounded-3xl border border-border bg-card/60 p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {isArabic ? "سجل تشغيلي" : "Operational record"}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
                {isArabic ? "حزمة القرار الموثقة" : "Verified payload for trusted execution"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "هذا JSON يربط الحكم، الثقة، وسلسلة الأدلة ولوجستيات التنفيذ، حتى تلتزم فرق العمليات والحوكمة بنفس الحقيقة."
                  : "This JSON ties the verdict, confidence, and evidence lineage into one canonical record so operations, risk, and leadership act from the same truth."}
              </p>

              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p>{isArabic ? "• يسرّع التنفيذ وراء حوكمة واضحة." : "• Speeds execution while respecting governance."}</p>
                <p>{isArabic ? "• يربط كل حكم بمصادر معتمدة لتقليل المخاطر." : "• Links every verdict to documented sources to reduce risk."}</p>
                <p>{isArabic ? "• يكشف ما الذي يغير النتيجة حتى يعرف التحالف ما يراقب." : "• Shows what would move the conclusion so teams know what to monitor."}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {isArabic ? "معاينة payload" : "Payload preview"}
              </p>
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/85">
                {JSON.stringify(API_PAYLOAD_PREVIEW, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
