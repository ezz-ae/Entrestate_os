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
  BookOpen,
  Sparkles,
  Download,
  Share2,
  PenLine,
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
import { getTranslations } from "next-intl/server"

const PLAN_COLORS: Record<"free" | "pro" | "team" | "institutional", string> = {
  free: "text-muted-foreground",
  pro: "text-blue-500",
  team: "text-violet-500",
  institutional: "text-amber-500",
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

export default async function AccountPage() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "account" })
  const entitlement = await getCurrentEntitlement()
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)

  const quickAccess = [
    {
      label: isArabic ? "دفتر السوق الشخصي" : "Personal Market Book",
      description: isArabic ? "توليد، تقرير، مشاركة، وتنفيذ" : "Generate, report, share, and implement",
      href: "/account/profile",
      icon: BookOpen,
      tiers: ["free", "pro", "team", "institutional"] as const,
      highlight: true,
    },
    {
      label: t("quickAccess.chat"),
      description: t("quickAccess.chatDesc"),
      href: "/chat",
      icon: MessageSquareText,
      tiers: ["free", "pro", "team", "institutional"] as const,
    },
    {
      label: t("quickAccess.marketData"),
      description: t("quickAccess.marketDataDesc"),
      href: "/top-data",
      icon: BarChart3,
      tiers: ["free", "pro", "team", "institutional"] as const,
    },
    {
      label: t("quickAccess.areas"),
      description: t("quickAccess.areasDesc"),
      href: "/areas",
      icon: MapPin,
      tiers: ["pro", "team", "institutional"] as const,
    },
    {
      label: isArabic ? "مكتبة الأبحاث" : "Research Library",
      description: isArabic ? "التقارير المُنشأة والمذكرات الاستثمارية" : "Generated reports and market memos",
      href: "/reports/library",
      icon: FileText,
      tiers: ["pro", "team", "institutional"] as const,
    },
  ]

  const billingEvents = entitlement.accountKey
    ? await listBillingEventsByAccountKey(entitlement.accountKey)
    : []

  const usage = entitlement.accountKey
    ? await getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
    : { used: 0, limit: getCopilotDailyLimit(entitlement.tier) }

  const tierLabel = t(`tier.${entitlement.tier}`)

  const usagePct = Math.min((usage.used / usage.limit) * 100, 100)

  return (
    <main id="main-content">
      <Navbar />

      {/* ── Mobile section tabs ── */}
      <div className="sticky top-16 z-30 lg:hidden bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex overflow-x-auto scrollbar-none px-4 gap-1 py-2">
          {[
            { id: "identity", label: isArabic ? "الهوية" : "Identity", icon: Building2 },
            { id: "billing",  label: isArabic ? "الفاتورة" : "Billing",  icon: CreditCard },
            { id: "activity", label: isArabic ? "السجل" : "Activity",  icon: ShieldCheck },
            { id: "usage",    label: isArabic ? "الاستخدام" : "Usage",   icon: Zap },
            { id: "access",   label: isArabic ? "وصول" : "Access",      icon: ArrowRight },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Icon className="h-3 w-3" />
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-20 pt-6 md:pt-10 lg:pt-16">
        <header className="mb-8 lg:mb-10">
          <h1 className="text-2xl font-semibold text-foreground md:text-4xl lg:text-5xl">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isArabic ? "إدارة اشتراكك، بيانات الحساب، والوصول إلى أدوات ذكاء القرار." : "Manage your subscription, identity, and decision tool access."}
          </p>
        </header>

        {/* ── Personal Market Book banner ── */}
        <Link href={prefixLocalePath("/account/profile", locale)} className="group block mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/6 via-card to-card p-5 md:p-7 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-primary/8 blur-[60px] rounded-full" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {isArabic ? "دفتر السوق الشخصي" : "Personal Market Book ML"}
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary/80">
                    {isArabic ? "جديد" : "New"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/75 leading-relaxed">
                  {isArabic
                    ? "توليد كتب الاستخبارات، إنشاء التقارير، المشاركة والتنفيذ — كل شيء مرتبط بسوق دبي الحي."
                    : "Generate intelligence books, create reports, share and implement — all connected to the live Dubai market."}
                </p>
                {/* Capability chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { icon: Sparkles, label: isArabic ? "توليد" : "Generate" },
                    { icon: FileText, label: isArabic ? "تقرير" : "Report" },
                    { icon: PenLine, label: isArabic ? "إعادة كتابة" : "Rewrite" },
                    { icon: Share2, label: isArabic ? "مشاركة" : "Share" },
                    { icon: Download, label: isArabic ? "تصدير" : "Export" },
                    { icon: Zap, label: isArabic ? "تنفيذ" : "Implement" },
                  ].map(({ icon: Ic, label }) => (
                    <span key={label} className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground/70">
                      <Ic className="h-2.5 w-2.5" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:gap-8 lg:grid-cols-3">
          {/* Left Column: Profile & Subscription */}
          <div className="space-y-5 lg:space-y-8 lg:col-span-2">

            <section id="identity" className="rounded-2xl border border-border bg-card p-5 md:p-8 scroll-mt-32 lg:scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-base md:text-xl font-medium">{t("identity")}</h2>
              </div>
              <AccountIdentity />
            </section>

            <section id="billing" className="rounded-2xl border border-border bg-card p-5 md:p-8 scroll-mt-32 lg:scroll-mt-24">
              <div className="mb-5 md:mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-base md:text-xl font-medium">{t("billing")}</h2>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${PLAN_COLORS[entitlement.tier]}`}>
                  <Zap className="h-3 w-3" />
                  {tierLabel}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("activePlan")}</p>
                  <p className="mt-1 text-base md:text-lg font-semibold text-foreground capitalize">{tierLabel}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("status")}</p>
                  <p className="mt-1 text-base md:text-lg font-semibold text-foreground capitalize">{humanizeStatus(entitlement.status, locale)}</p>
                </div>
                {entitlement.subscriptionId && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 md:p-4 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("nextBilling")}</p>
                    <p className="mt-1 text-base md:text-lg font-semibold text-foreground">—</p>
                  </div>
                )}
              </div>

              <div className="mt-5 md:mt-8">
                <AccountBillingControls />
              </div>
            </section>

            <section id="activity" className="rounded-2xl border border-border bg-card p-5 md:p-8 scroll-mt-32 lg:scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base md:text-xl font-medium">{isArabic ? "سجل الفوترة" : "Billing Activity"}</h2>
              </div>

              {billingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                  <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{isArabic ? "لا توجد معاملات سابقة لهذا الحساب." : "No previous transactions for this account."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5 md:mx-0 rounded-none md:rounded-xl border-y md:border border-border">
                  <table className="w-full min-w-[400px] text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground rtl:text-right">
                      <tr>
                        <th className="px-4 py-3 font-medium">{isArabic ? "التاريخ" : "Date"}</th>
                        <th className="px-4 py-3 font-medium">{isArabic ? "الوصف" : "Description"}</th>
                        <th className="px-4 py-3 font-medium text-right">{isArabic ? "المبلغ" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {billingEvents.map((event: BillingActivityEvent) => (
                        <tr key={event.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium tabular-nums whitespace-nowrap">{formatDate(event.createdAt, locale)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              <span className="capitalize">{event.type.replace(/_/g, ' ')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">{event.amount} {event.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Usage & Quick Access */}
          <div className="space-y-5 lg:space-y-8">

            <section id="usage" className="rounded-2xl border border-border bg-card p-5 md:p-8 scroll-mt-32 lg:scroll-mt-24">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-sm md:text-base">{isArabic ? "حدود الاستخدام" : "Usage Limits"}</h2>
                <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">DAILY</div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isArabic ? "مساعد القرار" : "Decision Assistant"}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {usage.used.toLocaleString(numberLocale)} / {usage.limit.toLocaleString(numberLocale)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all duration-700 ${usagePct >= 90 ? "bg-destructive" : usagePct >= 70 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground/60 text-right tabular-nums">
                    {usagePct.toFixed(0)}% {isArabic ? "مستخدم" : "used"}
                  </p>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground/70 border-t border-border/30 pt-3">
                  {isArabic
                    ? "يتم تصفير الحدود يومياً الساعة 12:00 صباحاً بتوقيت دبي."
                    : "Limits reset daily at 12:00 AM GST. Feature access varies by active tier."}
                </p>
              </div>
            </section>

            <section id="access" className="rounded-2xl border border-border bg-card p-5 md:p-8 scroll-mt-32 lg:scroll-mt-24">
              <h2 className="mb-4 font-medium text-sm md:text-base">{isArabic ? "وصول سريع" : "Quick Access"}</h2>
              <div className="grid grid-cols-1 gap-2.5">
                {quickAccess.map((item) => {
                  const Icon = item.icon
                  const hasAccess = item.tiers.includes(entitlement.tier as any)
                  const isHighlight = (item as any).highlight

                  return (
                    <Link
                      key={item.label}
                      href={hasAccess ? prefixLocalePath(item.href, locale) : prefixLocalePath("/pricing", locale)}
                      className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isHighlight
                          ? "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 active:scale-[0.98]"
                          : hasAccess
                          ? "border-border bg-muted/20 hover:-translate-y-0.5 hover:bg-muted/50 active:scale-[0.98]"
                          : "border-border opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 transition-colors ${
                          isHighlight
                            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            : hasAccess
                            ? "bg-background text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isHighlight ? "text-primary" : "text-foreground"}`}>{item.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight className={`h-4 w-4 shrink-0 rtl:rotate-180 transition-all ${hasAccess || isHighlight ? "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5" : "text-muted-foreground/30"}`} />
                    </Link>
                  )
                })}
              </div>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
