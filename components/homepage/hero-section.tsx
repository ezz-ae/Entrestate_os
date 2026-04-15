"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { ArrowRight, Database, Lock, ShieldCheck } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatInteger } from "@/lib/format/number"

type Props = {
  avgMarketPrice: number | null
  totalProjects: number
}

const COPY = {
  en: {
    eyebrow: "UAE Real Estate Intelligence",
    titleLineOne: "Dubai real estate is moving fast.",
    titleLineTwo: "Your data should too.",
    primaryCta: "Open Terminal",
    secondaryCta: "Enterprise Integration",
    trustTitle: "Every verdict links back to source.",
    trustBody:
      "Confidence, timing, yield, and drivers stay visible so the output can be reviewed before it is used.",
    trustPills: ["Canonical DLD", "Verified Records", "Auditable Lineage", "SOC 2 Ready"],
    stats: {
      projects: "Projects scored",
      avgPrice: "Avg. entry price",
      listings: "Verified listings",
      dld: "DLD transactions",
      areas: "Area profiles",
      developers: "Tracked developers",
    },
  },
  ar: {
    eyebrow: "استخبارات العقار في الإمارات",
    titleLineOne: "سوق دبي العقاري يتحرك بسرعة.",
    titleLineTwo: "ويجب أن تتحرك بياناتك بالسرعة نفسها.",
    primaryCta: "افتح المحطة",
    secondaryCta: "تكامل المؤسسات",
    trustTitle: "كل حكم مرتبط بمصدره.",
    trustBody:
      "الثقة والتوقيت والعائد ومحركات النتيجة تبقى ظاهرة حتى يمكن مراجعة المخرج قبل استخدامه.",
    trustPills: ["DLD Canonical", "سجلات موثقة", "تتبّع كامل", "SOC 2 Ready"],
    stats: {
      projects: "مشروع مقيّم",
      avgPrice: "متوسط سعر الدخول",
      listings: "قائمة موثقة",
      dld: "معاملة DLD",
      areas: "ملف منطقة",
      developers: "مطور متابع",
    },
  },
} as const

export function HeroSection({ avgMarketPrice, totalProjects }: Props) {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en

  const bayutListings = 41381
  const dldTransactions = 36841
  const areasCount = 167
  const developerCount = 481
  const totalProjectsDisplay = formatInteger(totalProjects, locale)
  const descriptionLead = locale === "ar"
    ? `${formatInteger(dldTransactions, locale)} معاملة DLD. ${totalProjectsDisplay} مشروعاً مقيّماً. ${formatInteger(areasCount, locale)} ملف منطقة.`
    : `${formatInteger(dldTransactions, locale)} DLD transactions. ${totalProjectsDisplay} scored projects. ${formatInteger(areasCount, locale)} area profiles.`
  const descriptionBody = locale === "ar"
    ? "منصة واحدة تحول ضوضاء السوق إلى حكم منظم، مع الأدلة التي تدعم كل نتيجة."
    : "One platform that turns market noise into a structured verdict, with the evidence to back every call."
  const stats = [
    { label: copy.stats.projects, value: totalProjects },
    avgMarketPrice && avgMarketPrice > 0
      ? { label: copy.stats.avgPrice, value: formatAed(avgMarketPrice, locale, { compact: true }) }
      : null,
    { label: copy.stats.listings, value: bayutListings },
    { label: copy.stats.dld, value: dldTransactions },
    { label: copy.stats.areas, value: areasCount },
    { label: copy.stats.developers, value: developerCount },
  ].filter(Boolean) as Array<{ label: string; value: number | string }>

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

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
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

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
            {descriptionLead}
            <br />
            {descriptionBody}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={prefixLocalePath("/chat", locale)}
              className="flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
            >
              <Database className="h-4 w-4" />
              {copy.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={prefixLocalePath("/infrastructure", locale)}
              className="flex items-center gap-2 rounded-full border border-dashed border-border/80 bg-background/60 px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <Lock className="h-4 w-4 text-primary" />
              {copy.secondaryCta}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {stats.map((item) => (
              <div key={item.label} className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {typeof item.value === "number" ? formatInteger(item.value, locale) : item.value}
                </span>
                <span className="text-[11px] text-muted-foreground/60">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[360px] xl:w-[420px]">
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{copy.trustTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.trustBody}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {copy.trustPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
