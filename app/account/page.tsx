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

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic ? "إدارة اشتراكك، بيانات الحساب، والوصول إلى أدوات ذكاء القرار." : "Manage your subscription, identity, and decision tool access."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Profile & Subscription */}
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-medium">{t("identity")}</h2>
              </div>
              <AccountIdentity />
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-medium">{t("billing")}</h2>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${PLAN_COLORS[entitlement.tier]}`}>
                  <Zap className="h-3.5 w-3.5" />
                  {tierLabel}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("activePlan")}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground capitalize">{tierLabel}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("status")}</p>
                  <p className="mt-1 text-lg font-semibold text-foreground capitalize">{humanizeStatus(entitlement.status, locale)}</p>
                </div>
                {entitlement.subscriptionId && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("nextBilling")}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">—</p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <AccountBillingControls />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-medium">{isArabic ? "سجل الفوترة" : "Billing Activity"}</h2>
              </div>

              {billingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                  <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{isArabic ? "لا توجد معاملات سابقة لهذا الحساب." : "No previous transactions for this account."}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
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
                          <td className="px-4 py-3 font-medium tabular-nums">{formatDate(event.createdAt, locale)}</td>
                          <td className="px-4 py-3">
                             <div className="flex items-center gap-2">
                               <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                               <span className="capitalize">{event.type.replace(/_/g, ' ')}</span>
                             </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">{event.amount} {event.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Usage & Quick Access */}
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium">{isArabic ? "حدود الاستخدام" : "Usage Limits"}</h2>
                <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">DAILY</div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isArabic ? "مساعد القرار (Copilot)" : "Decision Assistant"}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {usage.used.toLocaleString(numberLocale)} / {usage.limit.toLocaleString(numberLocale)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {isArabic 
                    ? "يتم تصفير الحدود يومياً الساعة 12:00 صباحاً بتوقيت دبي. حدود المشاريع تعتمد على باقتك النشطة."
                    : "Limits reset daily at 12:00 AM GST. Feature access varies by active tier."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-6 font-medium">{isArabic ? "وصول سريع" : "Quick Access"}</h2>
              <div className="grid grid-cols-1 gap-3">
                {quickAccess.map((item) => {
                  const Icon = item.icon
                  const hasAccess = item.tiers.includes(entitlement.tier as any)
                  
                  return (
                    <Link
                      key={item.label}
                      href={hasAccess ? prefixLocalePath(item.href, locale) : "#"}
                      className={`group flex items-center justify-between rounded-xl border border-border p-4 transition-all ${
                        hasAccess 
                          ? "bg-muted/30 hover:-translate-y-0.5 hover:bg-muted/60" 
                          : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-background p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {hasAccess && <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all rtl:rotate-180" />}
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
