import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  MessageSquareText,
  BarChart3,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccountIdentity } from "@/components/account-identity"
import { AccountBillingControls } from "@/components/account-billing-controls"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listBillingEventsByAccountKey, type BillingActivityEvent } from "@/lib/billing-entitlements"
import { getCopilotDailyLimit, getCopilotDailyUsage } from "@/lib/copilot-usage"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { formatDate } from "@/lib/format/date"
import { getNumberLocale } from "@/lib/format/locale"

const PLAN_COLORS: Record<"free" | "pro" | "team" | "institutional", string> = {
  free: "text-muted-foreground",
  pro: "text-blue-500",
  team: "text-violet-500",
  institutional: "text-amber-500",
}

function tierLabel(tier: "free" | "pro" | "team" | "institutional", locale: AppLocale) {
  if (locale !== "ar") {
    return {
      free: "Starter",
      pro: "Pro",
      team: "Team",
      institutional: "Institutional",
    }[tier]
  }

  return {
    free: "الأساسية",
    pro: "Pro",
    team: "Team",
    institutional: "المؤسسية",
  }[tier]
}

function humanizeStatus(value: string | null | undefined, locale: AppLocale) {
  if (!value) return locale === "ar" ? "غير مشترك" : "not subscribed"

  const normalized = value.replaceAll("_", " ").toLowerCase()
  if (locale !== "ar") return normalized

  switch (normalized) {
    case "active":
      return "نشطة"
    case "approval pending":
    case "approved":
      return "قيد الاعتماد"
    case "cancelled":
      return "ملغاة"
    case "suspended":
      return "معلّقة"
    case "expired":
      return "منتهية"
    case "inactive":
      return "غير مفعّلة"
    default:
      return normalized
  }
}

function getQuickAccess(locale: AppLocale) {
  const isArabic = locale === "ar"

  return [
    {
      label: isArabic ? "المساعد" : "AI Chat",
      description: isArabic ? "جلسات القرار، فرز المشاريع، والمذكرات" : "Decision sessions, deal screener, memos",
      href: "/chat",
      icon: MessageSquareText,
      tiers: ["free", "pro", "team", "institutional"] as const,
    },
    {
      label: isArabic ? "بيانات السوق" : "Market Data",
      description: isArabic ? "جداول السوق ولقطته المباشرة" : "Top-data tables and market pulse",
      href: "/top-data",
      icon: BarChart3,
      tiers: ["free", "pro", "team", "institutional"] as const,
    },
    {
      label: isArabic ? "المناطق" : "Area Intelligence",
      description: isArabic ? "قراءة المناطق وضغط المعروض" : "Area trust maps and supply pressure",
      href: "/areas",
      icon: MapPin,
      tiers: ["free", "pro", "team", "institutional"] as const,
    },
    {
      label: isArabic ? "مذكرة الاستثمار" : "Investor Memo",
      description: isArabic ? "مذكرة جاهزة للعرض والمشاركة" : "Generate PDF-ready investment memos",
      href: "/chat",
      icon: FileText,
      tiers: ["pro", "team", "institutional"] as const,
    },
  ]
}

function formatEventType(eventType: string | null, locale: AppLocale) {
  if (!eventType) return locale === "ar" ? "حدث غير محدد" : "Unknown event"
  const normalized = eventType.replaceAll("_", " ").toLowerCase()
  if (locale !== "ar") return normalized

  const map: Record<string, string> = {
    "subscription created": "إنشاء الاشتراك",
    "subscription activated": "تفعيل الاشتراك",
    "subscription cancelled": "إلغاء الاشتراك",
    "subscription suspended": "تعليق الاشتراك",
    "subscription updated": "تحديث الاشتراك",
    "payment completed": "اكتمال السداد",
    "payment failed": "تعذر السداد",
  }

  return map[normalized] ?? normalized
}

function getActivityDescription(event: BillingActivityEvent, locale: AppLocale) {
  if (!event.payload || typeof event.payload !== "object") return null
  const payload = event.payload as Record<string, unknown>
  const status = typeof payload.subscription_status === "string" ? payload.subscription_status : null
  const tier = typeof payload.tier === "string" ? payload.tier : null

  if (status && tier) {
    return locale === "ar"
      ? `الحالة ${humanizeStatus(status, locale)} · الباقة ${tierLabel(tier as "free" | "pro" | "team" | "institutional", locale)}`
      : `Status ${status} · Tier ${tier}`
  }
  if (status) return locale === "ar" ? `الحالة ${humanizeStatus(status, locale)}` : `Status ${status}`
  if (tier) return locale === "ar" ? `الباقة ${tierLabel(tier as "free" | "pro" | "team" | "institutional", locale)}` : `Tier ${tier}`
  return null
}

function UsageMeter({
  limit,
  blocked,
  locale,
}: {
  limit: number | null
  blocked: boolean
  locale: AppLocale
}) {
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)

  if (limit === null) {
    return (
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">
          {isArabic ? "وصول مفتوح داخل الباقة الحالية" : "Unlimited access"}
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">
          {isArabic ? "نافذة يومية مجانية" : "Free access"}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {isArabic ? `حتى ${limit.toLocaleString(numberLocale)} جلسات في اليوم.` : `Up to ${limit.toLocaleString(numberLocale)} sessions per day.`}
      </p>
      {blocked ? (
        <p className="mt-1.5 text-[11px] text-red-400">
          {isArabic ? "وصلت النافذة اليومية حدها الآن. حاول بعد قليل." : "Usage is cooling down. Please try again soon."}
        </p>
      ) : null}
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "الحساب - Entrestate" : "Account - Entrestate",
    description:
      locale === "ar"
        ? "إدارة الحساب، الباقة، وحركة الاشتراك من مكان واحد."
        : "Manage your Entrestate account, subscription, and AI usage.",
  }
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const params = (await searchParams) ?? {}
  const billingState = Array.isArray(params.billing) ? params.billing[0] : params.billing

  const entitlement = await getCurrentEntitlement()
  const [billingActivity, usage] = await Promise.all([
    entitlement.accountKey ? listBillingEventsByAccountKey(entitlement.accountKey, 6) : Promise.resolve([]),
    entitlement.accountKey
      ? getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
      : Promise.resolve({
          used: 0,
          limit: getCopilotDailyLimit(entitlement.tier),
          remaining: getCopilotDailyLimit(entitlement.tier),
          blocked: false,
          cooldownSecondsRemaining: null,
        }),
  ])

  const planLabel = tierLabel(entitlement.tier, locale)
  const planColor = PLAN_COLORS[entitlement.tier]
  const statusLabel = humanizeStatus(entitlement.status, locale)
  const isActive = entitlement.tier !== "free" && entitlement.status === "active"
  const quickAccess = getQuickAccess(locale)
  const accessibleFeatures = quickAccess.filter((feature) => feature.tiers.includes(entitlement.tier))
  const lockedFeatures = quickAccess.filter((feature) => !feature.tiers.includes(entitlement.tier))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 md:pt-36">
        {billingState === "success" ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            {isArabic ? "تم تفعيل الاشتراك بنجاح ورفع الباقة الحالية." : "PayPal subscription activated successfully. Your plan has been upgraded."}
          </div>
        ) : null}
        {billingState === "cancelled" ? (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            {isArabic ? "تم إيقاف عملية الدفع ولم يتم خصم أي مبلغ." : "Checkout was cancelled. No charge was made."}
          </div>
        ) : null}
        {billingState === "error" || billingState === "missing_subscription" ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {isArabic
              ? "تعذر التحقق من اشتراك PayPal. إذا تم الخصم فعلًا فتواصل مع الدعم."
              : "We could not verify your PayPal subscription. Contact support if you were charged."}
          </div>
        ) : null}

        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الحساب" : "Account"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "ملف الحساب والاشتراك" : "Account & Billing"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {isArabic
              ? "من هنا تضبط الباقة، تراجع حركة الاشتراك، وتفتح المسارات المناسبة لك داخل المنصة."
              : "Manage your plan, billing activity, and key workstreams from one place."}
          </p>
        </header>

        <div className="mb-8">
          <AccountIdentity />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{isArabic ? "الباقة الحالية" : "Current plan"}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${planColor}`}>{planLabel}</span>
                    {isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {isArabic ? "نشطة" : "Active"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3" /> {statusLabel}
                      </span>
                    )}
                  </div>
                </div>
                {entitlement.tier === "free" ? (
                  <Link
                    href={prefixLocalePath("/pricing", locale)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/70"
                  >
                    {isArabic ? "غيّر الباقة" : "Upgrade plan"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isArabic ? "المساعد · النافذة اليومية" : "AI Chat · Free usage window"}
                </p>
                <UsageMeter limit={usage.limit} blocked={usage.blocked} locale={locale} />
              </div>

              <div className="mt-4">
                <AccountBillingControls tier={entitlement.tier} subscriptionId={entitlement.subscriptionId} status={entitlement.status} />
              </div>

              {entitlement.subscriptionId ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {isArabic ? "رقم الاشتراك:" : "Subscription ID:"} <span className="font-mono">{entitlement.subscriptionId}</span>
                </p>
              ) : null}
            </section>

            <section>
              <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">{isArabic ? "ابدأ من هنا" : "Quick access"}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {accessibleFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Link
                      key={feature.label}
                      href={prefixLocalePath(feature.href, locale)}
                      className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{feature.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  )
                })}
                {lockedFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.label} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 opacity-60">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{feature.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Link
                        href={prefixLocalePath("/pricing", locale)}
                        className="ml-auto flex-shrink-0 rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isArabic ? "افتحها" : "Upgrade"}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{isArabic ? "ملف الجهة" : "Organization"}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isArabic ? "السوق الرئيسي" : "Primary market"}</p>
                  <p className="mt-1 text-sm text-foreground">{isArabic ? "الإمارات · دبي" : "UAE · Dubai"}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isArabic ? "نوع الجهة" : "Company type"}</p>
                  <p className="mt-1 text-sm text-foreground">{isArabic ? "وساطة واستثمار" : "Brokerage / Investment"}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">{isArabic ? "حركة الاشتراك" : "Billing activity"}</h2>
                </div>
                <Link href={prefixLocalePath("/account/billing-activity", locale)} className="text-[11px] text-muted-foreground hover:text-foreground">
                  {isArabic ? "عرض الكل ←" : "View all →"}
                </Link>
              </div>
              {billingActivity.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">{isArabic ? "لا توجد عمليات اشتراك بعد." : "No billing events yet."}</p>
                  {entitlement.tier === "free" ? (
                    <Link href={prefixLocalePath("/pricing", locale)} className="mt-2 inline-block text-xs text-foreground underline">
                      {isArabic ? "راجع الباقات" : "Explore plans"}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {billingActivity.map((event) => {
                    const detail = getActivityDescription(event, locale)
                    return (
                      <div key={event.event_id} className="rounded-xl border border-border/60 bg-muted/10 p-3">
                        <p className="text-xs font-medium text-foreground">{formatEventType(event.event_type, locale)}</p>
                        {detail ? <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p> : null}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDate(event.received_at, locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
              <Link
                href={prefixLocalePath("/contact", locale)}
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {isArabic ? "دعم الاشتراك" : "Billing support"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{isArabic ? "الحماية" : "Security"}</h2>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{isArabic ? "جلسات الدخول مضبوطة" : "Session controls enabled"}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">{isArabic ? "الصلاحيات مضبوطة حسب الدور" : "Data access restricted by role"}</p>
                </div>
                {entitlement.tier === "team" || entitlement.tier === "institutional" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <p className="text-xs text-muted-foreground">{isArabic ? "سجل المراجعة مفعّل" : "Audit trail active"}</p>
                  </div>
                ) : null}
              </div>
            </section>

            {entitlement.tier === "free" ? (
              <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <p className="text-sm font-semibold text-foreground">{isArabic ? "افتح المنصة كاملة" : "Unlock the full platform"}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {isArabic
                    ? "باقة Pro تفتح الجلسات غير المحدودة، فرز المشاريع، إشارات التوقيت، وتصدير المذكرات والملفات."
                    : "Pro gives you unlimited AI sessions, deal screener, timing signals, and PDF exports."}
                </p>
                <Link
                  href={prefixLocalePath("/pricing", locale)}
                  className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/70"
                >
                  {isArabic ? "عرض الباقات" : "View plans"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  )
}
