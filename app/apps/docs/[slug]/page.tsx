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

const docPages: Record<string, DocPage> = {
  "storyboard-builder": {
    title: "Storyboard Builder",
    subtitle: "Turn project media into a launch-ready storyboard in minutes.",
    useCases: ["New project launch", "Investor pitch", "Developer portfolio update"],
    sections: [
      {
        title: "What it does",
        body: "Builds a visual story from your project media so teams can pitch faster and stay on message.",
      },
      {
        title: "Why it matters",
        body: "A clean storyboard removes guesswork. Buyers see the narrative, not just scattered assets.",
      },
    ],
    steps: ["Pick a project", "Choose a storyline", "Export the storyboard pack"],
    cta: { label: "Open Storyboard Builder", href: "/storyboard" },
  },
  "launch-timeline": {
    title: "Launch Timeline",
    subtitle: "Create a timed media sequence for campaigns and listings.",
    useCases: ["Campaign rollouts", "Pre-launch nurture", "Weekly listing cadence"],
    sections: [
      {
        title: "What it does",
        body: "Turns project media into a structured launch plan with clear timing and asset order.",
      },
      {
        title: "Why it matters",
        body: "Launch plans keep teams aligned and keep marketing consistent across channels.",
      },
    ],
    steps: ["Select campaign window", "Set sequence blocks", "Share the timeline"],
    cta: { label: "Open Launch Timeline", href: "/timeline" },
  },
  "image-playground": {
    title: "Image Studio",
    subtitle: "Create listing-ready visuals from your project media library.",
    useCases: ["Listing refresh", "Social media packs", "Broker presentations"],
    sections: [
      {
        title: "What it does",
        body: "Creates clean, branded visuals with consistent framing and export sizes.",
      },
      {
        title: "Why it matters",
        body: "Better visuals lead to better response rates and fewer back-and-forth edits.",
      },
    ],
    steps: ["Pick the asset set", "Apply a style pack", "Export for listings"],
    cta: { label: "Open Image Studio", href: "/image-playground" },
  },
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
    cta: { label: "Open Automation-First Builder", href: "/apps/automation-builder" },
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
    cta: { label: "Open Insta DM Lead Automation", href: "/apps/lead-automation" },
  },
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = docPages[params.slug]
  return {
    title: page ? `${page.title} – Entrestate` : "App Guide – Entrestate",
    description: page?.subtitle ?? "App guide for Entrestate.",
  }
}

export default async function AppDocPage({ params }: { params: { slug: string } }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const page = docPages[params.slug]
  const copy = {
    notFoundTitle: isArabic ? "لم يتم العثور على دليل التطبيق" : "App guide not found",
    notFoundBody: isArabic ? "تعذر العثور على هذا الدليل. اختر تطبيقاً آخر من صفحة التطبيقات." : "We could not find that guide. Choose another app from the Apps page.",
    backToApps: isArabic ? "العودة إلى التطبيقات" : "Back to Apps",
    eyebrow: isArabic ? "دليل التطبيق" : "App Guide",
    whenToUse: isArabic ? "متى تستخدم هذا التطبيق" : "When to use this app",
    quickSummary: isArabic ? "ملخص سريع" : "Quick summary",
    tip: isArabic ? "نصيحة: اجعل الوصف موجزاً ومركزاً. هذا التطبيق مصمم لإخراج سريع وواضح." : "Tip: Keep the brief short and focused. This app is designed for fast, clear output.",
    setup: isArabic ? "إعداده خلال دقائق" : "Set it up in minutes",
    step: isArabic ? "الخطوة" : "Step",
    nextStep: isArabic ? "الخطوة التالية" : "Next step",
    readyToOpen: isArabic ? `جاهز لفتح ${toTitleCase(params.slug)}؟` : `Ready to open ${toTitleCase(params.slug)}?`,
    openBody: isArabic ? "افتح التطبيق وابدأ بمشروع واحد أو تدفق عميل واحد." : "Open the app and start with a single project or lead flow.",
  }

  if (!page) {
    return (
      <main id="main-content">
        <Navbar />
        <div className="pt-28 pb-20 md:pt-36 md:pb-32">
          <div className="mx-auto w-full max-w-4xl px-6">
            <h1 className="text-3xl font-semibold text-foreground">{copy.notFoundTitle}</h1>
            <p className="mt-3 text-muted-foreground">
              {copy.notFoundBody}
            </p>
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
          <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/15 via-background/60 to-background/80 p-8 mb-10">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground mt-3">{page.title}</h1>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl">{page.subtitle}</p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-10">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                {copy.whenToUse}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
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
              <p className="mt-3 text-sm text-muted-foreground">
                {page.subtitle}
              </p>
              <div className="mt-4">
                <ExplainWithChat prompt={`Explain the ${page.title} guide and how to use it.`} />
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
                {copy.tip}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {page.sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-border/70 bg-card/60 p-6">
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-7 mb-12">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {copy.setup}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h2 className="text-xl font-semibold text-foreground mt-2">
                  {copy.readyToOpen}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {copy.openBody}
                </p>
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
