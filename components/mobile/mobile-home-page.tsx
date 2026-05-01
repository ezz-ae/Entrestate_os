import Link from "next/link"
import { ArrowRight, Building2, Database, FileText, MapPin, Search, ShieldCheck, Sparkles, Users2 } from "lucide-react"
import { LiveSignalCard } from "@/components/platform/live-signal-card"
import { MOBILE_CHAT_SHORTCUTS } from "@/lib/copilot/mobile-prompts"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type TopProject = {
  slug: string
  name: string
  area?: string | null
  developer?: string | null
  timing?: string | null
  stress?: string | null
  yieldValue?: number | null
  score?: number | null
  price?: number | null
} | null

type Props = {
  locale: AppLocale
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  buySignals: number
  dldTransactions: number
  syncLabel: string
  topProject: TopProject
}

function formatInteger(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US").format(value)
}

function buildChatHref(locale: AppLocale, prompt: string) {
  const params = new URLSearchParams({
    openChat: "true",
    prompt,
  })
  return `${prefixLocalePath("/", locale)}?${params.toString()}`
}

export function MobileHomePage({
  locale,
  totalProjects,
  totalAreas,
  ratedDevelopers,
  buySignals,
  dldTransactions,
  syncLabel,
  topProject,
}: Props) {
  const isArabic = locale === "ar"
  const quickActions = [
    {
      title: isArabic ? "افتح المحطة" : "Open chat",
      body: isArabic ? "اسأل مباشرة وافتح درج الأدلة فوراً." : "Ask directly and open the evidence-backed terminal.",
      href: `${prefixLocalePath("/", locale)}?openChat=true`,
      icon: Database,
    },
    {
      title: isArabic ? "ابحث في السوق" : "Search market",
      body: isArabic ? "شاشات مقارنة أسرع للمشاريع والمناطق." : "Fast screening across projects and submarkets.",
      href: prefixLocalePath("/search", locale),
      icon: Search,
    },
    {
      title: isArabic ? "مساحة العمل" : "Workspace",
      body: isArabic ? "لوحات، تقارير، ومكاتب العمل الأساسية." : "Dashboards, reports, and operator desks.",
      href: prefixLocalePath("/workspace", locale),
      icon: Sparkles,
    },
    {
      title: isArabic ? "رتّب جولة" : "Book walkthrough",
      body: isArabic ? "جلسة تشغيل من دبي لفريقك أو شركتك." : "Dubai-based operator walkthrough for your team.",
      href: prefixLocalePath("/contact", locale),
      icon: FileText,
    },
  ]

  const promptShortcuts = [
    {
      title: isArabic ? "BUY تحت 2M" : "BUY under AED 2M",
      prompt: MOBILE_CHAT_SHORTCUTS.screenBuyProjects,
    },
    {
      title: isArabic ? "مارينا ضد JBR" : "Marina vs JBR",
      prompt: MOBILE_CHAT_SHORTCUTS.compareMarinaVsJbr,
    },
    {
      title: isArabic ? "مذكرة مارينا فيستا" : "Marina Vista memo",
      prompt: MOBILE_CHAT_SHORTCUTS.marinaVistaMemo,
    },
  ]

  const trustCounters = [
    {
      label: isArabic ? "المعاملات المرجعية" : "Canonical DLD",
      value: formatInteger(dldTransactions, locale),
      body: isArabic ? "تغذية سوقية مباشرة" : "Live market feed",
      icon: ShieldCheck,
    },
    {
      label: isArabic ? "المشاريع المصنفة" : "Scored projects",
      value: formatInteger(totalProjects, locale),
      body: isArabic ? "إشارات BUY وطبقة ثقة" : "BUY signals and confidence tiers",
      icon: Building2,
    },
    {
      label: isArabic ? "ملفات المناطق" : "Area coverage",
      value: formatInteger(totalAreas, locale),
      body: isArabic ? "قراءة مكانية قابلة للمقارنة" : "Comparable spatial reading",
      icon: MapPin,
    },
    {
      label: isArabic ? "المطورون" : "Developers",
      value: formatInteger(ratedDevelopers, locale),
      body: isArabic ? `${formatInteger(buySignals, locale)} BUY مباشر` : `${formatInteger(buySignals, locale)} BUY live`,
      icon: Users2,
    },
  ]

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-24 sm:px-6">
      <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(160deg,rgba(47,90,166,0.16),rgba(17,22,29,0.04))] px-5 py-6 shadow-[0_24px_90px_-56px_rgba(47,90,166,0.55)]">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {isArabic ? "موبايل تشغيل" : "Mobile operating shell"}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {isArabic ? "نسخة هاتف حقيقية لاتخاذ القرار العقاري." : "A real phone-first shell for real estate decisions."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isArabic
            ? "ابدأ من المحطة، افحص السوق، وادخل إلى مساحة العمل من دون المرور بواجهة سطح مكتب مصغّرة."
            : "Start from the terminal, screen the market, and move into the workspace without dragging desktop chrome onto a phone."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
            {isArabic ? `${formatInteger(buySignals, locale)} BUY مباشر` : `${formatInteger(buySignals, locale)} BUY live`}
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
            {isArabic ? `آخر مزامنة ${syncLabel}` : `Synced ${syncLabel}`}
          </span>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-[1.6rem] border border-border/60 bg-card/70 p-4 shadow-sm transition hover:border-primary/30 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{action.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.body}</p>
            </Link>
          )
        })}
      </section>

      {topProject ? (
        <section className="mt-5">
          <LiveSignalCard
            title={topProject.name}
            area={topProject.area}
            developer={topProject.developer}
            timing={topProject.timing}
            stress={topProject.stress}
            yieldValue={topProject.yieldValue}
            score={topProject.score}
            price={topProject.price}
            updatedLabel={syncLabel}
            slug={topProject.slug}
          />
        </section>
      ) : null}

      <section className="mt-5 rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              {isArabic ? "ابدأ من سؤال جاهز" : "Start from a ready prompt"}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {isArabic ? "اختصارات ذكية للهاتف" : "Phone-native decision shortcuts"}
            </p>
          </div>
          <Database className="h-5 w-5 text-primary/70" />
        </div>
        <div className="mt-4 space-y-3">
          {promptShortcuts.map((shortcut) => (
            <Link
              key={shortcut.title}
              href={buildChatHref(locale, shortcut.prompt)}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm transition hover:border-primary/30"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{shortcut.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{shortcut.prompt}</p>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 text-primary/70 ${isArabic ? "rotate-180" : ""}`} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {trustCounters.map((counter) => {
          const Icon = counter.icon
          return (
            <div key={counter.label} className="rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{counter.label}</p>
                <Icon className="h-4 w-4 text-primary/60" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{counter.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{counter.body}</p>
            </div>
          )
        })}
      </section>
    </div>
  )
}
