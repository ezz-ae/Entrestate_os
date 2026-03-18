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
      id: "investor",
      icon: User,
      title: "Individual Investor",
      badge: "Free",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "Full access to the decision engine, market intelligence, AI copilot, and file generation — branded with Entrestate.",
      features: [
        "AI Decision Copilot (unlimited sessions)",
        "Deal screener, area risk briefs, developer scores",
        "BUY / HOLD / WAIT timing signals",
        "Investor memo generation",
        "DLD transaction data & area benchmarks",
        "File outputs branded with Entrestate",
      ],
      cta: "Get started free",
      href: "/signup",
    },
    {
      id: "realtor",
      icon: Briefcase,
      title: "Individual Realtor",
      badge: "Free",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "Everything investors get, plus outputs carrying your personal branding alongside Entrestate — ready to send to clients.",
      features: [
        "Everything in Individual Investor",
        "File generation with personal + Entrestate branding",
        "Client-ready investor memos & reports",
        "Developer due diligence reports",
        "AI-powered lead briefings",
        "Market comparison exports",
      ],
      cta: "Get started free",
      href: "/signup",
    },
    {
      id: "org",
      icon: Building2,
      title: "Organisation Terminal",
      badge: "Paid",
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "A branded execution dashboard for companies and professional firms. Multi-user, company-branded outputs, team intelligence.",
      features: [
        "Full company-branded workspace & outputs",
        "Multiple user seats under one account",
        "Shared watchlists, portfolios & audit trail",
        "Supply pressure heatmaps & advanced signals",
        "API access with dual-schema security",
        "Dedicated onboarding & account support",
      ],
      cta: "Contact us",
      href: "mailto:hello@entrestate.com",
      isExternal: true,
      highlight: true,
    },
  ],
  ar: [
    {
      id: "investor",
      icon: User,
      title: "مستثمر فردي",
      badge: "مجاني",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "وصول كامل لمحرك القرار، رؤية السوق، مساعد القرار، وإنشاء الملفات — بعلامة Entrestate.",
      features: [
        "مساعد القرار بالذكاء الاصطناعي (جلسات غير محدودة)",
        "فرز الفرص، مخاطر المناطق، درجات المطورين",
        "إشارات التوقيت: شراء / انتظار / تريّث",
        "إنشاء مذكرات الاستثمار",
        "بيانات DLD ومعايير المناطق",
        "ملفات مخرجة بعلامة Entrestate",
      ],
      cta: "ابدأ مجاناً",
      href: "/signup",
    },
    {
      id: "realtor",
      icon: Briefcase,
      title: "وسيط عقاري",
      badge: "مجاني",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "كل ما يحصل عليه المستثمر، مع إضافة علامتك التجارية الشخصية على المخرجات — جاهزة للإرسال للعملاء.",
      features: [
        "كل مميزات حساب المستثمر",
        "مخرجات بعلامتك + علامة Entrestate",
        "مذكرات وتقارير جاهزة للعملاء",
        "تقارير فحص المطورين",
        "ملخصات العملاء بالذكاء الاصطناعي",
        "تصدير المقارنات السوقية",
      ],
      cta: "ابدأ مجاناً",
      href: "/signup",
    },
    {
      id: "org",
      icon: Building2,
      title: "منصة المؤسسات",
      badge: "مدفوع",
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "لوحة تنفيذ بعلامة الشركة للشركات والمكاتب المحترفة. متعدد المستخدمين، مخرجات بعلامة الشركة، ذكاء الفريق.",
      features: [
        "مساحة عمل كاملة بعلامة الشركة",
        "مقاعد متعددة تحت حساب واحد",
        "قوائم مشتركة، محافظ، وسجل متابعة",
        "خرائط ضغط المعروض وإشارات متقدمة",
        "وصول API مع أمان ثنائي المخطط",
        "تهيئة مخصصة ودعم مخصص",
      ],
      cta: "تواصل معنا",
      href: "mailto:hello@entrestate.com",
      isExternal: true,
      highlight: true,
    },
  ],
}

// ── Organisation Terminal feature highlights ──────────────────────────────────

const ORG_FEATURES = {
  en: [
    { icon: Building2, title: "Company-Branded Outputs", desc: "Every memo, report, and export carries your firm's identity — not Entrestate's." },
    { icon: Users, title: "Multi-User Team Workspace", desc: "Manage your team's intelligence in one place. Shared watchlists, portfolios, and audit trails." },
    { icon: Shield, title: "Dual-Schema API Security", desc: "Every API response is validated, encrypted per recipient, and multi-node safe. No leaks, no race conditions." },
    { icon: BarChart3, title: "Advanced Market Signals", desc: "Supply pressure heatmaps, portfolio-level monitoring, and institutional risk oversight tools." },
    { icon: Globe, title: "API Integration", desc: "Annual license for third-party platform integration with encrypted, schema-verified responses." },
    { icon: FileText, title: "Dedicated Onboarding", desc: "A real person walks your team through setup, custom workflows, and ongoing support." },
  ],
  ar: [
    { icon: Building2, title: "مخرجات بعلامة الشركة", desc: "كل مذكرة وتقرير وملف يحمل هوية شركتك — لا هوية Entrestate." },
    { icon: Users, title: "مساحة عمل الفريق", desc: "أدر ذكاء فريقك في مكان واحد: قوائم مشتركة، محافظ، وسجل متابعة." },
    { icon: Shield, title: "أمان API ثنائي المخطط", desc: "كل استجابة API مُتحقق منها ومُشفرة لكل مستلم — آمنة متعددة العقد." },
    { icon: BarChart3, title: "إشارات سوقية متقدمة", desc: "خرائط ضغط المعروض، متابعة المحافظ، وأدوات رقابة مخاطر المؤسسات." },
    { icon: Globe, title: "تكامل API", desc: "ترخيص سنوي لتكامل المنصات الخارجية باستجابات مُشفرة ومُتحقق منها." },
    { icon: FileText, title: "تهيئة مخصصة", desc: "شخص حقيقي يأخذ فريقك عبر الإعداد وسير العمل المخصص والدعم المستمر." },
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
          a: "Yes — completely. Individual investors and realtors get full access to the decision engine, AI copilot, market intelligence, timing signals, DLD data, and file generation at no cost. There are no hidden limits, no trial periods, and no credit card required.",
        },
        {
          q: "What's the difference between an investor and a realtor account?",
          a: "Both get identical platform access. The only difference is branding: investor accounts generate files with Entrestate branding, while realtor accounts can add their personal branding alongside Entrestate on client-ready outputs like memos and reports.",
        },
        {
          q: "Can I use the platform without signing up?",
          a: "You can explore limited features without an account. To unlock the full AI copilot, file generation, and saved sessions, you'll need to create a free account.",
        },
      ],
    },
    {
      group: "Organisation Terminal",
      items: [
        {
          q: "What is the Organisation Terminal?",
          a: "The Organisation Terminal is Entrestate's branded execution dashboard for companies and professional firms. It's a multi-user workspace where your team operates under your company's identity — company-branded outputs, shared portfolios, API access, and institutional-grade risk oversight. It's not a subscription plan; it's a company-level product.",
        },
        {
          q: "How is it different from a free individual account?",
          a: "Individual accounts are single-user and output Entrestate or personal branding. The Organisation Terminal is multi-user, outputs your company brand exclusively, adds team features (shared watchlists, audit trails, portfolio monitoring), unlocks the dual-schema API, and comes with a dedicated onboarding and support setup.",
        },
        {
          q: "How is the Organisation Terminal priced?",
          a: "Pricing is set per company based on team size, API needs, and integration scope. Contact us at hello@entrestate.com for a tailored quote.",
        },
        {
          q: "What is Dual-Schema API Security?",
          a: "Every API response is validated against two schemas: an identity schema (who is requesting) and a permission schema (what they can receive). Responses are then encrypted specifically for the intended recipient. Multi-hop request chains (A → B → C) only succeed if every node's schema aligns. This prevents unauthorized access, race conditions, and data leakage — even under heavy parallel load.",
        },
      ],
    },
    {
      group: "The Platform",
      items: [
        {
          q: "What is Entrestate, exactly?",
          a: "Entrestate is a real estate intelligence operating system — not a listing portal. It takes raw UAE property data and transforms it into institutional-grade investment intelligence through a multi-phase data pipeline and five-layer evidence stack. Think of it as a decision engine: it tells you not just what exists, but what to do and why.",
        },
        {
          q: "What does a BUY signal mean?",
          a: "A BUY signal means a project has passed through the full Decision Tunnel and scored high on timing, stress resilience, yield, and data confidence. Out of all UAE projects in the database, only a small percentage hold an active BUY or STRONG_BUY signal at any given time.",
        },
        {
          q: "What can the AI Copilot actually do?",
          a: "The AI Copilot screens properties by budget, area, and risk profile using live scored data; compares markets side-by-side; returns real V1 stress metrics; generates full investor memos with price reality checks and developer due diligence; and saves structured reports to your account.",
        },
        {
          q: "What are slash commands?",
          a: "Slash commands are quick shortcuts inside the AI chat: /screen runs a deal screener, /compare runs a market comparison, /memo generates an investor memo, /risk returns V1 stress metrics, /price runs a price reality check, /pulse shows the DLD market pulse, /bench runs an area benchmark, and /history searches DLD transactions.",
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
          a: "نعم — بالكامل. المستثمرون الأفراد والوسطاء يحصلون على وصول كامل لمحرك القرار، مساعد القرار، رؤية السوق، إشارات التوقيت، بيانات DLD، وإنشاء الملفات — بدون أي تكلفة.",
        },
        {
          q: "ما الفرق بين حساب المستثمر وحساب الوسيط؟",
          a: "كلاهما يحصل على نفس وصول المنصة. الفرق الوحيد في العلامة التجارية: حسابات المستثمرين تنشئ ملفات بعلامة Entrestate، بينما يمكن للوسطاء إضافة علامتهم الشخصية إلى المخرجات الجاهزة للعملاء.",
        },
        {
          q: "هل يمكنني استخدام المنصة بدون تسجيل؟",
          a: "يمكنك استكشاف ميزات محدودة بدون حساب. للحصول على وصول كامل لمساعد القرار وإنشاء الملفات والجلسات المحفوظة، ستحتاج إلى إنشاء حساب مجاني.",
        },
      ],
    },
    {
      group: "منصة المؤسسات",
      items: [
        {
          q: "ما هي منصة المؤسسات؟",
          a: "منصة المؤسسات هي لوحة تنفيذ بعلامة الشركة للشركات والمكاتب المحترفة. مساحة عمل متعددة المستخدمين حيث يعمل فريقك تحت هوية شركتك — مخرجات بعلامة الشركة، محافظ مشتركة، وصول API، ورقابة مخاطر.",
        },
        {
          q: "ما الفرق عن الحساب الفردي المجاني؟",
          a: "الحسابات الفردية لمستخدم واحد وتخرج علامة Entrestate أو العلامة الشخصية. منصة المؤسسات متعددة المستخدمين، تخرج علامة شركتك حصراً، وتضيف ميزات الفريق والوصول لـ API وتهيئة مخصصة.",
        },
        {
          q: "كيف يتم تسعير منصة المؤسسات؟",
          a: "السعر محدد لكل شركة بحسب حجم الفريق، احتياجات API، ونطاق التكامل. تواصل معنا على hello@entrestate.com للحصول على عرض مخصص.",
        },
        {
          q: "ما هو أمان API ثنائي المخطط؟",
          a: "كل استجابة API تُتحقق من مخططين: مخطط الهوية (من يطلب) ومخطط الصلاحية (ما يمكن الوصول إليه). الاستجابات تُشفر خصيصاً للمستلم المقصود، مما يمنع الوصول غير المصرح والتسريبات.",
        },
      ],
    },
    {
      group: "المنصة",
      items: [
        {
          q: "ما هو Entrestate بالضبط؟",
          a: "Entrestate منصة قرار عقاري، وليست بوابة إعلانات. نجمع بيانات السوق، ننظفها، ثم نحولها إلى قراءة واضحة تساعدك على اختيار المشروع المناسب وتوقيت الدخول الصحيح.",
        },
        {
          q: "ماذا يعني BUY؟",
          a: "يعني أن المشروع اجتاز طبقات التقييم وحقق مستوى قويًا في التوقيت والمرونة والعائد وثقة البيانات. فقط نسبة صغيرة من المشاريع تحمل إشارة BUY أو STRONG_BUY في أي وقت.",
        },
        {
          q: "ماذا يقدم مساعد القرار؟",
          a: "يفرز المشاريع بحسب الميزانية والهدف، يقارن المناطق والمطورين، يعرض مؤشرات V1 الفعلية، ويكتب مذكرات الاستثمار والتقارير الجاهزة.",
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
            {isArabic ? "الوصول" : "Access"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl leading-tight">
            {isArabic ? "مجاني للجميع." : "Free for everyone."}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {isArabic
              ? "مستثمرون، وسطاء، شركات — الجميع يحصل على وصول كامل لمحرك القرار. الشركات تحصل على لوحة تنفيذ بعلامتها التجارية."
              : "Investors, realtors, companies — everyone gets full access to the decision engine. Companies get a branded execution dashboard on top."}
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

        {/* ── Organisation Terminal deep-dive ── */}
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
                  {isArabic ? "منصة المؤسسات" : "Organisation Terminal"}
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {isArabic
                ? "لوحة تنفيذ مخصصة للشركات والمكاتب المحترفة. تعمل تحت علامتك التجارية الكاملة، مع بنية متعددة المستخدمين، API آمن، وذكاء جماعي متكامل."
                : "A fully branded execution dashboard for companies and professional firms. Your team operates under your identity, with multi-user infrastructure, secure API access, and institutional-grade intelligence built in."}
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
            <Button asChild variant="default" className="gap-2 shrink-0">
              <a href="mailto:hello@entrestate.com">
                <Zap className="h-4 w-4" />
                {isArabic ? "تواصل معنا" : "Contact us"}
              </a>
            </Button>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              {isArabic ? "كل ما تحتاج معرفته" : "Everything you need to know"}
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
                ? "للاستفسارات المؤسسية أو تكامل API أو تهيئة مخصصة لفريقك — تواصل معنا مباشرة."
                : "For Organisation Terminal inquiries, API integration, or custom enterprise setup — reach us directly."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="default">
                <Link href={prefixLocalePath("/chat", locale)}>
                  {isArabic ? "افتح مساعد القرار" : "Open AI Copilot"}
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
