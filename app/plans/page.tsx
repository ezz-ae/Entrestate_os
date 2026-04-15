import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Building2, BriefcaseBusiness, Landmark } from "lucide-react"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "الأسعار والباقات — اختر الطبقة المناسبة | Entrestate"
        : "Pricing & Plans — Choose the Right Workflow Layer | Entrestate",
    description:
      locale === "ar"
        ? "ثلاث طبقات تسعير واضحة: تقارير فردية، محطة القرار للمشغلين، وطبقة API للمؤسسات."
        : "Three clear pricing paths: individual reports, the decision terminal for operators, and the enterprise data/API layer.",
  }
}

export default async function PlansPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)

  const tiers = [
    {
      icon: Building2,
      name: t("Individual Investor", "المستثمر الفردي"),
      headline: t("Confidence per project, on demand.", "ثقة لكل مشروع، عند الطلب."),
      price: t("One-time per report", "مرة واحدة لكل تقرير"),
      body: t(
        "Best when you want a single project memo, area brief, or evidence-backed report before making a call.",
        "مناسب عندما تحتاج إلى مذكرة مشروع واحدة أو ملخص منطقة أو تقرير مدعوم بالأدلة قبل اتخاذ القرار.",
      ),
      bullets: [
        t("Project and area reports", "تقارير المشاريع والمناطق"),
        t("Evidence-linked verdicts", "أحكام مرتبطة بالأدلة"),
        t("No subscription required", "بدون اشتراك شهري"),
      ],
      cta: t("Buy a report", "اشترِ تقريراً"),
      href: "/reports/library",
    },
    {
      icon: BriefcaseBusiness,
      name: t("Broker / Operator", "الوسيط / المشغّل"),
      headline: t("Your own intelligence copilot.", "محطة استخبارات خاصة بك."),
      price: t("Monthly subscription", "اشتراك شهري"),
      body: t(
        "For active operators who need full terminal access, recurring screening, and faster client-facing workflows.",
        "للمشغلين النشطين الذين يحتاجون إلى وصول كامل للمحطة، وفرز متكرر، ومسارات أسرع أمام العملاء.",
      ),
      bullets: [
        t("Full Decision Terminal access", "وصول كامل لمحطة القرار"),
        t("Scored project screening", "فرز المشاريع المصنفة"),
        t("Research and memo workflows", "مسارات الأبحاث والمذكرات"),
      ],
      cta: t("Start free trial", "ابدأ التجربة المجانية"),
      href: "/chat",
      featured: true,
    },
    {
      icon: Landmark,
      name: t("Institution / Enterprise", "المؤسسة / القطاع المؤسسي"),
      headline: t("The full data and API layer.", "طبقة البيانات وواجهة API كاملة."),
      price: t("Annual contract", "عقد سنوي"),
      body: t(
        "For portals, funds, and larger operating teams that want DaaS, APIs, governed execution, and headless deployment.",
        "للبوابات والصناديق والفرق التشغيلية الأكبر التي تحتاج إلى DaaS وواجهات API وتنفيذ محكوم ونشر Headless.",
      ),
      bullets: [
        t("DaaS and API access", "وصول DaaS و API"),
        t("Headless integration", "تكامل Headless"),
        t("Governed deployment support", "دعم نشر محكوم"),
      ],
      cta: t("Talk to enterprise team", "تحدث مع فريق المؤسسات"),
      href: "/contact",
    },
  ]
  const featureMatrix = [
    {
      feature: t("Terminal access", "وصول المحطة"),
      individual: t("Limited", "محدود"),
      broker: "✓",
      enterprise: "✓",
    },
    {
      feature: t("Reports", "التقارير"),
      individual: "✓",
      broker: "✓",
      enterprise: "✓",
    },
    {
      feature: t("Developer scores", "درجات المطورين"),
      individual: t("Limited", "محدود"),
      broker: "✓",
      enterprise: "✓",
    },
    {
      feature: t("API access", "وصول API"),
      individual: "—",
      broker: t("Limited", "محدود"),
      enterprise: "✓",
    },
    {
      feature: t("Deal rooms", "غرف الصفقات"),
      individual: "—",
      broker: t("Limited", "محدود"),
      enterprise: "✓",
    },
    {
      feature: t("DaaS layer", "طبقة DaaS"),
      individual: "—",
      broker: "—",
      enterprise: "✓",
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-14">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
              {t("Simple, transparent pricing", "أسعار بسيطة وواضحة")}
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {t("Choose the layer that fits your workflow", "اختر الطبقة التي تناسب طريقة عملك")}
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              {t(
                "Start with one report, move into the terminal when you need a daily operating surface, or scope the full data layer for enterprise deployment.",
                "ابدأ بتقرير واحد، ثم انتقل إلى المحطة عندما تحتاج إلى سطح تشغيل يومي، أو ابدأ بنطاق طبقة البيانات الكاملة للنشر المؤسسي.",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {tiers.map((tier) => (
              <section
                key={tier.name}
                className={`rounded-3xl border p-7 ${
                  tier.featured
                    ? "border-primary/30 bg-primary/5 shadow-[0_24px_80px_-40px_rgba(99,102,241,0.45)]"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                    <tier.icon className="h-5 w-5" />
                  </div>
                  {tier.featured ? (
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {t("Most active", "الأكثر استخداماً")}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-wider text-accent">{tier.name}</p>
                <h2 className="mt-2 text-2xl font-serif text-foreground">{tier.headline}</h2>
                <p className="mt-3 text-sm font-medium text-foreground/80">{tier.price}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tier.body}</p>

                <div className="mt-5 space-y-2">
                  {tier.bullets.map((bullet) => (
                    <div key={bullet} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                      {bullet}
                    </div>
                  ))}
                </div>

                <Link
                  href={prefixLocalePath(tier.href, locale)}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    tier.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:border-accent/40"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                </Link>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "The verdict and Developer Reliability Score are visible to subscribers. All underlying data and market intelligence remain free.",
                "الحكم ودرجة موثوقية المطور متاحان للمشتركين. أما البيانات الأساسية وذكاء السوق فيبقيان مجانيين.",
              )}
            </p>
          </div>

          <section className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {t("Feature comparison", "مقارنة المزايا")}
                </p>
                <h2 className="mt-2 text-2xl font-serif text-foreground">
                  {t("See the layer differences clearly", "اعرف الفرق بين الطبقات بوضوح")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t(
                  "The data stays open. The workflow depth, verdict access, and infrastructure layers expand as the plan moves up.",
                  "تبقى البيانات مفتوحة. أما عمق سير العمل والوصول إلى الحكم وطبقات البنية فتتوسع مع الخطة الأعلى.",
                )}
              </p>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-border/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-background/70 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("Feature", "الميزة")}</th>
                    <th className="px-4 py-3 font-medium">{t("Individual", "فردي")}</th>
                    <th className="px-4 py-3 font-medium">{t("Broker", "وسيط")}</th>
                    <th className="px-4 py-3 font-medium">{t("Enterprise", "مؤسسي")}</th>
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row) => (
                    <tr key={row.feature} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium text-foreground">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.individual}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.broker}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
