import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield, Clock, Database } from "lucide-react"
import { getRequestLocale } from "@/i18n/request"

function getTierCards(locale: "en" | "ar") {
  if (locale === "ar") {
    return [
      {
        title: "حدود العمق الزمني",
        detail: "اضبط المدة التاريخية المتاحة لكل باقة، من قراءات قصيرة إلى وصول كامل.",
        icon: Clock,
      },
      {
        title: "العناصر المحفوظة",
        detail: "حدد سقوف الجداول المحفوظة والملاحظات ومساحات العمل المرتبطة بها.",
        icon: Database,
      },
      {
        title: "الأعمدة المتقدمة",
        detail: "افتح الإشارات والأعمدة الاحترافية على مستوى الخادم بحسب الباقة.",
        icon: Shield,
      },
    ]
  }

  return [
    {
      title: "Time Depth Limits",
      detail: "Control historical depth per tier (30d to unlimited).",
      icon: Clock,
    },
    {
      title: "Saved Tables",
      detail: "Set caps on saved Time Tables and notes.",
      icon: Database,
    },
    {
      title: "Premium Columns",
      detail: "Gate business and enterprise signals server-side.",
      icon: Shield,
    },
  ]
}

export default async function TierSettingsPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const tierCards = getTierCards(locale)

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الإعدادات — الباقات" : "Settings - Tier"}</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">{isArabic ? "ضبط الصلاحيات حسب الباقة" : "Tier governance"}</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              {isArabic
                ? "من هنا نضبط عمق البيانات والعناصر المحفوظة والأعمدة المتقدمة بحسب كل باقة دون تعديل الكود كل مرة."
                : "Manage limits for time depth, saved objects, and premium signals without touching code."}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tierCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                <card.icon className="h-5 w-5 text-accent" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
