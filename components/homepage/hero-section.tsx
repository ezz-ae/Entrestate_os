"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { ArrowRight, Code, Database, TerminalSquare } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type Props = {
  totalProjects: number
}

const COPY = {
  en: {
    eyebrow: "Decision Infrastructure - Live Demo",
    titleLineOne: "Entrestate Decision &",
    titleLineTwo: "Execution Infrastructure",
    description: "One truth layer. Proper API boundaries. Real estate decision and execution, unified.",
    primaryCta: "Explore the Data",
    secondaryCta: "Try the Decision Terminal",
    tertiaryCta: "View API Docs",
    apiPreview: "API Response Preview",
    apiPreviewNote: "This is the exact JSON payload your frontend receives.",
    stats: {
      projects: "PF-verified projects",
      listings: "Bayut listings",
      dld: "DLD transactions",
      areas: "Areas",
      developers: "Developers",
    },
  },
  ar: {
    eyebrow: "البنية التحتية للقرار - عرض مباشر",
    titleLineOne: "منظومة القرار والتنفيذ",
    titleLineTwo: "من Entrestate",
    description: "طبقة واحدة للحقيقة. حدود واضحة للـ API. قرار وتنفيذ عقاري موحّد.",
    primaryCta: "استكشف البيانات",
    secondaryCta: "جرّب محطة القرار",
    tertiaryCta: "وثائق الـ API",
    apiPreview: "معاينة استجابة الـ API",
    apiPreviewNote: "هذه هي نفس استجابة JSON التي يتلقاها واجهتك.",
    stats: {
      projects: "مشروع موثق",
      listings: "قائمة Bayut",
      dld: "صفقة DLD",
      areas: "منطقة",
      developers: "مطور",
    },
  },
} as const

export function HeroSection({ totalProjects }: Props) {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const numberLocale = locale === "ar" ? "ar-AE-u-nu-latn" : "en-US"
  const bayutListings = 41381
  const dldTransactions = 36841
  const areasCount = 167
  const developerCount = 481
  const stats = [
    { label: copy.stats.projects, value: totalProjects },
    { label: copy.stats.listings, value: bayutListings },
    { label: copy.stats.dld, value: dldTransactions },
    { label: copy.stats.areas, value: areasCount },
    { label: copy.stats.developers, value: developerCount },
  ]
  const sampleResponse = {
    project_id: 1284,
    name: "Marina Gate",
    timing_label: "BUY",
    stress_grade: "A",
    rental_yield: 6.8,
    price_from_aed: 2100000,
    evidence_level: "HIGH",
  }

  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
            {copy.eyebrow}
          </p>

          <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {copy.titleLineOne}
            <br />
            <span className="text-primary">{copy.titleLineTwo}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={prefixLocalePath("/properties", locale)}
              className="flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
            >
              <Database className="h-4 w-4" />
              {copy.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={prefixLocalePath("/chat", locale)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <TerminalSquare className="h-4 w-4 text-primary" />
              {copy.secondaryCta}
            </Link>
            <Link
              href={prefixLocalePath("/enterprise#api", locale)}
              className="flex items-center gap-2 rounded-full border border-dashed border-border/80 bg-background/60 px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <Code className="h-4 w-4 text-primary" />
              {copy.tertiaryCta}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {stats.map((item) => (
              <div key={item.label} className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {item.value.toLocaleString(numberLocale)}
                </span>
                <span className="text-[11px] text-muted-foreground/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[360px] xl:w-[420px]">
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{copy.apiPreview}</p>
                <p className="text-xs font-medium text-foreground">{copy.apiPreviewNote}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/80">
                {JSON.stringify(sampleResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
