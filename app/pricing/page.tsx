"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Check, ChevronDown, ChevronUp, Building2, User, Briefcase, ArrowRight, Zap, Shield, Globe, BarChart3, FileText, Users } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

// ── User type cards ────────────────────────────────────────────────────────────

const USER_TYPES = {
  en: [
    {
      id: "solo-analyst",
      icon: User,
      title: "Solo Analyst",
      badge: "$299/mo",
      badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      description: "Research-grade access for independent investors and analysts.",
      features: [
        "Decision Terminal access",
        "L1 Canonical data provenance",
        "Unlimited investor memo generation",
        "BUY / HOLD / WAIT timing signals",
        "DLD transaction history & benchmarks",
        "Standard Entrestate branding",
      ],
      cta: "Subscribe Now",
      href: "/api/billing/checkout?tier=solo",
    },
    {
      id: "realtor-pro",
      icon: Briefcase,
      title: "Realtor Pro",
      badge: "$499/mo",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "Client-ready intelligence with branded outputs for advisory teams.",
      features: [
        "Everything in Solo Analyst",
        "Personal + Entrestate branded outputs",
        "Branded Infographic Mode",
        "Client-ready PDF exports",
        "Developer due diligence reports",
        "Priority response processing",
      ],
      cta: "Subscribe Now",
      href: "/api/billing/checkout?tier=realtor",
    },
    {
      id: "enterprise-os",
      icon: Building2,
      title: "Entrestate OS",
      badge: "$2,500/mo+",
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "White-label platform deployment for firms, teams, and API delivery.",
      features: [
        "Full firm branding (White-label)",
        "Automation Studio (Scheduled Workers)",
        "Enterprise API Substrate access",
        "5+ User seats with RBAC",
        "Portfolio-level monitoring",
        "24/7 Priority institutional support",
      ],
      cta: "See Infrastructure",
      href: "/infrastructure",
      highlight: true,
    },
  ],
  ar: [
    {
      id: "solo-analyst",
      icon: User,
      title: "المحلل المستقل",
      badge: "299$/شهرياً",
      badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      description: "وصول بحثي احترافي للمستثمرين والمحللين المستقلين.",
      features: [
        "وصول إلى محطة القرار",
        "توثيق بيانات L1 Canonical",
        "إنشاء مذكرات استثمار غير محدودة",
        "إشارات الشراء والانتظار",
        "سجل معاملات DLD والمعايير",
        "علامة Entrestate القياسية",
      ],
      cta: "اشترك الآن",
      href: "/api/billing/checkout?tier=solo",
    },
    {
      id: "realtor-pro",
      icon: Briefcase,
      title: "الوسيط المحترف",
      badge: "499$/شهرياً",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "استخبارات جاهزة للعملاء مع مخرجات تحمل هويتك.",
      features: [
        "كل مميزات المحلل المستقل",
        "مخرجات بعلامتك + علامة Entrestate",
        "وضع الإنفوجرافيك المخصص",
        "تصدير ملفات PDF جاهزة للعملاء",
        "تقارير تدقيق المطورين",
        "أولوية في معالجة الطلبات",
      ],
      cta: "اشترك الآن",
      href: "/api/billing/checkout?tier=realtor",
    },
    {
      id: "enterprise-os",
      icon: Building2,
      title: "Entrestate OS للمؤسسات",
      badge: "2,500$+ /شهرياً",
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "نشر White-label للشركات والفرق وحمولة API جاهزة للتكامل.",
      features: [
        "علامة تجارية كاملة (White-label)",
        "استوديو الأتمتة (عمال مجدولون)",
        "وصول كامل لبنية الـ API",
        "أكثر من 5 مقاعد مع إدارة صلاحيات",
        "مراقبة المحافظ الاستثمارية",
        "دعم مؤسسي ذو أولوية 24/7",
      ],
      cta: "شاهد البنية التحتية",
      href: "/infrastructure",
      highlight: true,
    },
  ],
}

// ── Entrestate OS feature highlights ──────────────────────────────────────────

const ORG_FEATURES = {
  en: [
    { icon: Building2, title: "Company-Branded Outputs", desc: "Memos, reports, and exports ship in your firm's identity." },
    { icon: Users, title: "Multi-User Team Workspace", desc: "Shared watchlists, portfolios, and audit trails in one workspace." },
    { icon: Shield, title: "Dual-Schema API Security", desc: "Validated, encrypted responses with governed access." },
    { icon: BarChart3, title: "Advanced Market Signals", desc: "Portfolio monitoring and market oversight for operating teams." },
    { icon: Globe, title: "API Integration", desc: "Headless delivery for third-party platforms and internal systems." },
    { icon: FileText, title: "Dedicated Onboarding", desc: "Structured rollout, setup, and ongoing support." },
  ],
  ar: [
    { icon: Building2, title: "مخرجات بعلامة الشركة", desc: "المذكرات والتقارير والملفات تخرج بهوية شركتك." },
    { icon: Users, title: "مساحة عمل الفريق", desc: "قوائم مشتركة ومحافظ وسجل متابعة داخل مساحة واحدة." },
    { icon: Shield, title: "أمان API ثنائي المخطط", desc: "استجابات متحققة ومشفرة مع وصول محكوم." },
    { icon: BarChart3, title: "إشارات سوقية متقدمة", desc: "متابعة المحافظ ورقابة السوق لفرق التشغيل." },
    { icon: Globe, title: "تكامل API", desc: "تسليم Headless للمنصات الخارجية والأنظمة الداخلية." },
    { icon: FileText, title: "تهيئة مخصصة", desc: "إطلاق منظم وإعداد ودعم مستمر." },
  ],
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

const FAQ_GROUPS = {
  en: [
    {
      group: "Access & Accounts",
      items: [
        {
          q: "Is Entrestate really free for individuals?",
          a: "Yes. Individuals can start free with core intelligence, copilot access, and report generation.",
        },
        {
          q: "What's the difference between an investor and a realtor account?",
          a: "Both use the same core engine. Realtor accounts add personal branding to client-ready outputs.",
        },
      ],
    },
    {
      group: "Entrestate OS",
      items: [
        {
          q: "What is Entrestate OS?",
          a: "It is the company deployment: branded workspace, team controls, API access, and guided rollout.",
        },
        {
          q: "How is enterprise priced?",
          a: "Pricing is tailored by seats, API scope, and deployment requirements.",
        },
      ],
    },
    {
      group: "The Platform",
      items: [
        {
          q: "What is Entrestate, exactly?",
          a: "Entrestate turns UAE property data into verified decision and execution workflows.",
        },
        {
          q: "What can the Decision Terminal actually do?",
          a: "It screens opportunities, compares markets, surfaces signals, and generates investor-ready reports.",
        },
      ],
    },
  ],
  ar: [
    {
      group: "الوصول والحسابات",
      items: [
        {
          q: "هل Entrestate مجاني حقاً للأفراد؟",
          a: "نعم. يمكن للأفراد البدء مجاناً مع الوصول إلى الاستخبارات الأساسية والمساعد والتقارير.",
        },
        {
          q: "ما الفرق بين حساب المستثمر وحساب الوسيط؟",
          a: "كلاهما يستخدم نفس المحرك. حساب الوسيط يضيف علامته إلى المخرجات الجاهزة للعملاء.",
        },
      ],
    },
    {
      group: "Entrestate OS",
      items: [
        {
          q: "ما هو Entrestate OS؟",
          a: "هو نشر الشركة: مساحة بعلامتك، وضوابط للفريق، ووصول API، وإطلاق منظم.",
        },
        {
          q: "كيف يتم التسعير للمؤسسات؟",
          a: "يتم التسعير بحسب عدد المقاعد ونطاق الـ API ومتطلبات النشر.",
        },
      ],
    },
    {
      group: "المنصة",
      items: [
        {
          q: "ما هو Entrestate بالضبط؟",
          a: "تحول Entrestate بيانات السوق العقاري في الإمارات إلى تدفقات قرار وتنفيذ موثقة.",
        },
        {
          q: "ماذا يقدم مساعد القرار؟",
          a: "يفرز الفرص ويقارن الأسواق ويعرض الإشارات ويولد تقارير جاهزة للمستثمر.",
        },
      ],
    },
  ],
}

function FaqGroup({ group, items }: { group: string; items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{group}</p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-border">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="border-t border-border/40 px-5 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const userTypes = USER_TYPES[locale] ?? USER_TYPES.en
  const orgFeatures = ORG_FEATURES[locale] ?? ORG_FEATURES.en
  const faqGroups = FAQ_GROUPS[locale] ?? FAQ_GROUPS.en

  return (
    <main id="main-content" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pb-24 pt-28 md:pt-36">

        {/* ── Header ── */}
        <header className="mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            {isArabic ? "التسعير" : "Pricing"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl leading-tight">
            {isArabic ? "اختر مستوى التشغيل المناسب لفريقك." : "Choose the operating level that fits your team."}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {isArabic
              ? "من التحليل الفردي إلى نشر Entrestate OS على مستوى الشركة."
              : "From solo research to full Entrestate OS deployment."}
          </p>
        </header>

        {/* ── User type cards ── */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-20">
          {userTypes.map((type) => {
            const Icon = type.icon
            return (
              <article
                key={type.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  type.highlight
                    ? "border-amber-500/30 bg-card shadow-xl shadow-amber-500/5"
                    : "border-border/60 bg-card/70"
                }`}
              >
                {type.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background shadow-lg">
                    {isArabic ? "مدفوع" : "Paid"}
                  </div>
                )}

                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                    <Icon className="h-5 w-5 text-foreground/70" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${type.badgeColor}`}>
                    {type.badge}
                  </span>
                </div>

                <h2 className="text-base font-semibold text-foreground mb-2">{type.title}</h2>
                <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 flex-1">{type.description}</p>

                <ul className="space-y-2.5 mb-7">
                  {type.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {type.isExternal ? (
                  <Button
                    asChild
                    variant={type.highlight ? "default" : "outline"}
                    className="w-full gap-2"
                  >
                    <a href={type.href}>
                      {type.cta}
                      <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                    </a>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link href={prefixLocalePath(type.href, locale)}>
                      {type.cta}
                    </Link>
                  </Button>
                )}
              </article>
            )
          })}
        </section>

        {/* ── Entrestate OS deep-dive ── */}
        <section className="mb-24 rounded-3xl border border-amber-500/20 bg-card/60 overflow-hidden">
          <div className="px-6 md:px-10 py-10 border-b border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Building2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {isArabic ? "المنتج المدفوع الوحيد" : "The only paid product"}
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  {isArabic ? "Entrestate OS للمؤسسات" : "Entrestate OS"}
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {isArabic
                ? "نشر كامل للشركة بعلامتك، مع ضوابط للفريق، وحمولة API Headless، وإطلاق منظم."
                : "A full company deployment with your brand, team controls, headless API payloads, and structured rollout."}
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 divide-y sm:divide-y-0 ${isArabic ? "sm:divide-x-reverse" : "sm:divide-x"} divide-border/40`}>
            {orgFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 md:p-7">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 mb-4">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="px-6 md:px-10 py-7 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isArabic ? "سعر مخصص لكل شركة" : "Custom pricing per company"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isArabic ? "بحسب حجم الفريق، واحتياجات API، ونطاق التكامل." : "Based on team size, API needs, and integration scope."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="gap-2 shrink-0">
                <Link href={prefixLocalePath("/enterprise", locale)}>
                  {isArabic ? "دليل الـ API" : "API guide"}
                </Link>
              </Button>
              <Button asChild variant="default" className="gap-2 shrink-0">
                <a href="mailto:hello@entrestate.com">
                  <Zap className="h-4 w-4" />
                  {isArabic ? "تواصل معنا" : "Contact us"}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              {isArabic ? "أسئلة شائعة" : "Common questions"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">
              {isArabic ? "أسئلة متكررة" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {faqGroups.map((group) => (
              <FaqGroup key={group.group} group={group.group} items={group.items} />
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-border/60 bg-card/60 px-8 py-10 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              {isArabic ? "هل لديك سؤال خاص؟" : "Still have questions?"}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              {isArabic ? "تواصل مع الفريق" : "Talk to the team"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              {isArabic
                ? "للتسعير المؤسسي أو تكامل API أو الإطلاق المخصص، تواصل معنا مباشرة."
                : "For enterprise pricing, API integration, or custom rollout, reach us directly."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="default">
                <Link href={prefixLocalePath("/chat", locale)}>
                  {isArabic ? "افتح المحطة" : "Open Terminal"}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={prefixLocalePath("/infrastructure", locale)}>
                  {isArabic ? "شرح البنية" : "System overview"}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:hello@entrestate.com">
                  {isArabic ? "راسلنا" : "Email us"}
                </a>
              </Button>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
