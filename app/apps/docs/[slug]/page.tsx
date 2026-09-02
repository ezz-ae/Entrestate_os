import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

type DocSection = {
  title: string
  body: string
}

type DocPage = {
  title: string
  subtitle: string
  useCases: string[]
  sections: DocSection[]
  steps: string[]
  cta: { label: string; href: string }
}

const docPagesEn: Record<string, DocPage> = {
  "automation-first-builder": {
    title: "Automation-First Builder",
    subtitle: "Create real estate automations with a guided business-first flow.",
    useCases: ["Lead qualification", "Investor matching", "Listing follow-up"],
    sections: [
      {
        title: "What it does",
        body: "Turns business inputs into a working automation without technical setup.",
      },
      {
        title: "Why it matters",
        body: "You get consistent qualification and handoff without manual effort.",
      },
    ],
    steps: ["Pick a role", "Set the rules", "Launch the agent"],
    cta: { label: "Open Automation-First Builder", href: "/apps/agent-builder" },
  },
  "cold-calling": {
    title: "Cold Calling",
    subtitle: "Run outbound calling with scripts, queues, and outcomes.",
    useCases: ["New listings outreach", "Broker reactivation", "Event follow-ups"],
    sections: [
      {
        title: "What it does",
        body: "Keeps call scripts, lead queues, and results in one workflow.",
      },
      {
        title: "Why it matters",
        body: "Faster follow-up and consistent messaging improves conversion.",
      },
    ],
    steps: ["Load your list", "Use the call script", "Log outcomes"],
    cta: { label: "Open Cold Calling", href: "/apps/coldcalling" },
  },
  "insta-dm-lead-automation": {
    title: "Insta DM Lead Automation",
    subtitle: "Qualify leads in Instagram DMs, web chat, QR codes, and landing pages.",
    useCases: ["Inbound DM capture", "Website chat", "Event QR lead capture"],
    sections: [
      {
        title: "What it does",
        body: "Runs a structured lead desk that verifies intent before handing off to your team.",
      },
      {
        title: "Why it matters",
        body: "You spend time only on ready buyers, not on cold messages.",
      },
    ],
    steps: ["Connect Instagram DM", "Set the qualifying flow", "Start capturing leads"],
    cta: { label: "Open Insta DM Lead Automation", href: "/apps/lead-agent" },
  },
}

const docPagesAr: Record<string, DocPage> = {
  "automation-first-builder": {
    title: "مصمم الأتمتة",
    subtitle: "حوّل احتياج العمل إلى تدفق آلي واضح بدون الدخول في إعدادات تقنية معقدة.",
    useCases: ["فرز العملاء", "مطابقة المستثمرين", "متابعة الإدراجات"],
    sections: [
      {
        title: "ماذا ينجز؟",
        body: "يحوّل خطوات العمل إلى أتمتة عملية يمكن تشغيلها ومراقبتها من دون بناء يدوي من الصفر.",
      },
      {
        title: "لماذا يفيد؟",
        body: "يمنحك تنفيذًا ثابتًا وتسليمًا أنظف بين الفرق بدل الاعتماد على المتابعة اليدوية كل مرة.",
      },
    ],
    steps: ["حدد الدور", "ضع القواعد", "شغّل الوكيل"],
    cta: { label: "افتح مصمم الأتمتة", href: "/apps/agent-builder" },
  },
  "cold-calling": {
    title: "المكالمات الاستباقية",
    subtitle: "أدر حملات الاتصال الخارجي بنصوص واضحة وقوائم مرتبة ونتائج قابلة للمتابعة.",
    useCases: ["الوصول إلى إدراجات جديدة", "إعادة تنشيط الوسطاء", "متابعة الفعاليات"],
    sections: [
      {
        title: "ماذا ينجز؟",
        body: "يجمع نص المكالمة وقائمة المتابعة ونتائج كل اتصال داخل مسار واحد سهل القراءة والإدارة.",
      },
      {
        title: "لماذا يفيد؟",
        body: "يساعد الفريق على سرعة الرد وثبات الرسالة وتحسين التحويل بدل ضياع المحاولات بين أدوات متعددة.",
      },
    ],
    steps: ["حمّل القائمة", "ابدأ بالنص المقترح", "سجل النتائج"],
    cta: { label: "افتح المكالمات الاستباقية", href: "/apps/coldcalling" },
  },
  "insta-dm-lead-automation": {
    title: "أتمتة رسائل إنستغرام",
    subtitle: "استقبل العملاء القادمين من الرسائل والموقع والرموز السريعة داخل مسار تأهيل واحد وواضح.",
    useCases: ["التقاط الرسائل الواردة", "محادثة الموقع", "تجميع عملاء الفعاليات"],
    sections: [
      {
        title: "ماذا ينجز؟",
        body: "يبني مكتب استقبال رقمي يلتقط الاهتمام، يراجع النية، ثم يسلّم العميل إلى الفريق في الوقت المناسب.",
      },
      {
        title: "لماذا يفيد؟",
        body: "يوفر وقت الفريق للمحادثات الجادة بدل إهداره على رسائل باردة أو طلبات غير مؤهلة.",
      },
    ],
    steps: ["اربط قناة الرسائل", "حدد مسار التأهيل", "ابدأ استقبال العملاء"],
    cta: { label: "افتح أتمتة الرسائل", href: "/apps/lead-agent" },
  },
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getDocPage(slug: string, locale: string) {
  const source = locale === "ar" ? docPagesAr : docPagesEn
  return source[slug]
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const locale = await getRequestLocale()
  const page = getDocPage(params.slug, locale)
  return {
    title: page ? `${page.title} – Entrestate` : locale === "ar" ? "دليل التطبيق – Entrestate" : "App Guide – Entrestate",
    description: page?.subtitle ?? (locale === "ar" ? "دليل استخدام لتطبيقات Entrestate." : "App guide for Entrestate."),
  }
}

export default async function AppDocPage({ params }: { params: { slug: string } }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const page = getDocPage(params.slug, locale)
  const copy = {
    notFoundTitle: isArabic ? "لم يتم العثور على دليل التطبيق" : "App guide not found",
    notFoundBody: isArabic ? "تعذر العثور على هذا الدليل. اختر تطبيقاً آخر من صفحة التطبيقات." : "We could not find that guide. Choose another app from the Apps page.",
    backToApps: isArabic ? "العودة إلى التطبيقات" : "Back to Apps",
    eyebrow: isArabic ? "دليل التطبيق" : "App Guide",
    whenToUse: isArabic ? "متى يفيدك هذا التطبيق؟" : "When to use this app",
    quickSummary: isArabic ? "ملخص سريع" : "Quick summary",
    tip: isArabic ? "نصيحة: ابدأ بحالة استخدام واحدة وواضحة. كلما كان الطلب أدق، خرجت النتيجة أنظف وأسرع." : "Tip: Keep the brief short and focused. This app is designed for fast, clear output.",
    setup: isArabic ? "يبدأ خلال دقائق" : "Set it up in minutes",
    step: isArabic ? "الخطوة" : "Step",
    nextStep: isArabic ? "الخطوة التالية" : "Next step",
    readyToOpen: isArabic ? `جاهز لبدء ${page?.title ?? "هذا التطبيق"}؟` : `Ready to open ${toTitleCase(params.slug)}?`,
    openBody: isArabic ? "ادخل التطبيق وابدأ بحالة واحدة واضحة، ثم وسّع الاستخدام خطوة بعد خطوة." : "Open the app and start with a single project or lead flow.",
    explainPrompt: isArabic
      ? `اشرح بالعربية كيف أستخدم ${page?.title ?? "هذا التطبيق"} ومتى يكون مناسباً.`
      : `Explain the ${page?.title ?? toTitleCase(params.slug)} guide and how to use it.`,
  }

  if (!page) {
    return (
      <main id="main-content">
        <Navbar />
        <div className="pt-28 pb-20 md:pt-36 md:pb-32">
          <div className="mx-auto w-full max-w-4xl px-6">
            <h1 className="text-3xl font-semibold text-foreground">{copy.notFoundTitle}</h1>
            <p className="mt-3 text-muted-foreground">{copy.notFoundBody}</p>
            <Link href={prefixLocalePath("/apps", locale)} className="mt-6 inline-flex items-center gap-2 text-primary">
              {copy.backToApps}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <section className="mb-10 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/15 via-background/60 to-background/80 p-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-serif text-foreground md:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">{page.subtitle}</p>
          </section>

          <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                {copy.whenToUse}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {page.useCases.map((item) => (
                  <div key={item} className="rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/50 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                {copy.quickSummary}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{page.subtitle}</p>
              <div className="mt-4">
                <ExplainWithChat prompt={copy.explainPrompt} />
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
                {copy.tip}
              </div>
            </div>
          </section>

          <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {page.sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-border/70 bg-card/60 p-6">
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </section>

          <section className="mb-12 rounded-2xl border border-border/70 bg-background/40 p-7">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {copy.setup}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {page.steps.map((step, index) => (
                <div key={step} className="rounded-xl border border-border/60 bg-card/70 p-5">
                  <div className="text-xs text-muted-foreground">{copy.step} {index + 1}</div>
                  <p className="mt-2 text-sm font-medium text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/70 p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.nextStep}</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">{copy.readyToOpen}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{copy.openBody}</p>
              </div>
              <Link href={prefixLocalePath(page.cta.href, locale)} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground">
                {page.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
