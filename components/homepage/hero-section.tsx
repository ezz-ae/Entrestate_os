"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { ArrowRight, Database, Lock, ShieldCheck } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type Props = {
  totalProjects: number
}

const COPY = {
  en: {
    eyebrow: "Enterprise decision intelligence",
    titleLineOne: "Stop making billion-dirham decisions",
    titleLineTwo: "on fragmented, unverified data.",
    descriptionLead:
      "Entrestate unifies 36,841 DLD transactions, 41,381 verified listings, and 2,813 scored projects into one auditable decision infrastructure — so every investment verdict traces back to canonical truth.",
    descriptionBody: "Structured API. Verified evidence. Execution-ready intelligence.",
    supporting:
      "Decision packets ship with confidence, source lineage, and driver attribution so operations stay fast without breaking governance.",
    primaryCta: "See the Decision Engine",
    secondaryCta: "View API",
    trustTitle: "Designed for executive review, audit, and downside control.",
    trustBody:
      "Canonical data, evidence grading, and deterministic automation prove reliability for operators and leadership alike.",
    trustPills: ["Canonical DLD", "Verified Records", "Auditable Lineage", "SOC 2 Ready"],
    stats: {
      projects: "Scored projects",
      listings: "Verified listings",
      dld: "DLD transactions",
      areas: "Area profiles",
      developers: "Developer profiles",
    },
  },
  ar: {
    eyebrow: "ذكاء قرار مؤسسي",
    titleLineOne: "توقّف عن اتخاذ قرارات بمليارات الدراهم",
    titleLineTwo: "استنادًا إلى بيانات متفرقة وغير موثوقة.",
    descriptionLead:
      "Entrestate توحّد 36,841 معاملة DLD، و41,381 قائمة موثقة، و2,813 مشروعًا مقيّمًا في بنية قرار واحدة قابلة للتدقيق حتى يمكن تتبّع كل حكم إلى الحقيقة الكنسية.",
    descriptionBody: "واجهة API منظمة. أدلة موثقة. استخبارات جاهزة للتنفيذ.",
    supporting:
      "تصل حزم القرار مرفقة بثقة المصدر، وتدرج الأدلة، وأسباب الحكم لفرق العمليات والحوكمة.",
    primaryCta: "راجع منصة القرار",
    secondaryCta: "عرض الـ API",
    trustTitle: "مصمم لمراجعات القيادات والتدقيق والسيطرة على الهبوط.",
    trustBody:
      "البيانات الكنسية، وتدرج الأدلة، والأتمتة الحتمية تثبت المصداقية للمشغلين والقيادات.",
    trustPills: ["DLD Canonical", "سجلات موثقة", "تتبّع كامل", "SOC 2 Ready"],
    stats: {
      projects: "مشروع مقيّم",
      listings: "قائمة موثقة",
      dld: "معاملة DLD",
      areas: "ملف منطقة",
      developers: "ملف مطوّر",
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
            {copy.descriptionLead}
            <br />
            {copy.descriptionBody}
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/90 md:text-[15px]">{copy.supporting}</p>

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
              href={prefixLocalePath("/enterprise#api", locale)}
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
                  {item.value.toLocaleString(numberLocale)}
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
