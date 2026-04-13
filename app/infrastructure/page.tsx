import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Blocks,
  Bot,
  Building2,
  Cable,
  Database,
  Fingerprint,
  GitBranch,
  Layers3,
  Lock,
  MapPinned,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "البنية التحتية للقرار والتنفيذ - Entrestate"
        : "Decision Infrastructure - Entrestate",
    description:
      locale === "ar"
        ? "صفحة تشرح طبقة Entrestate الموحدة للقرار والتنفيذ: العمود الفقري للحقيقة، غرف الصفقات، الحدود الصحيحة للـ API، والتحكم الحتمي في سير العمل."
        : "The primary system page for Entrestate's unified decision and execution layer: truth spine, deal rooms, API boundaries, and deterministic workflow control.",
  }
}

export default async function InfrastructurePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)

  const systemIncludes = [
    {
      title: t("Truth spine", "عمود الحقيقة"),
      body: t(
        "One verified property layer for inventory, pricing, media, and lineage.",
        "طبقة موحدة وموثقة للمخزون والسعر والوسائط وتتبع المصدر.",
      ),
    },
    {
      title: t("Decision layer", "طبقة القرار"),
      body: t(
        "Signals become ranked outputs only after evidence and scoring.",
        "تتحول الإشارات إلى مخرجات مرتبة بعد الأدلة والتقييم فقط.",
      ),
    },
    {
      title: t("Deal rooms", "غرف الصفقات"),
      body: t(
        "Every transaction moves inside one governed workspace.",
        "كل معاملة تتحرك داخل مساحة عمل واحدة ومحكومة.",
      ),
    },
    {
      title: t("Headless deployment", "نشر Headless"),
      body: t(
        "Your interface stays in place while Entrestate runs underneath it.",
        "تبقى واجهتك كما هي بينما تعمل Entrestate تحتها.",
      ),
    },
  ]

  const modules = [
    {
      icon: Database,
      title: t("Canonical property spine", "العمود الفقري العقاري"),
      body: t(
        "One verified property layer across sources, stock, and media.",
        "طبقة عقارية موثقة واحدة عبر المصادر والمخزون والوسائط.",
      ),
      accent: "from-cyan-400/20 to-sky-400/5",
    },
    {
      icon: Blocks,
      title: t("Decision infrastructure", "بنية القرار"),
      body: t(
        "Evidence, lineage, and scoring turn signals into usable verdicts.",
        "الأدلة وتتبع المصدر والتقييم تحول الإشارات إلى أحكام قابلة للاستخدام.",
      ),
      accent: "from-amber-400/20 to-orange-400/5",
    },
    {
      icon: MapPinned,
      title: t("Mapped city engine", "محرك المدينة المرسومة"),
      body: t(
        "The city model finds better matches, alternatives, and substitutions.",
        "نموذج المدينة يجد المطابقات والبدائل والاستبدالات الأفضل.",
      ),
      accent: "from-emerald-400/20 to-green-400/5",
    },
    {
      icon: Workflow,
      title: t("Structured deal rooms", "غرف الصفقات المنظمة"),
      body: t(
        "Documents, consent, workflow, and contracts stay in one stateful room.",
        "الوثائق والموافقات وسير العمل والعقود تبقى داخل غرفة واحدة ذات حالة.",
      ),
      accent: "from-fuchsia-400/20 to-pink-400/5",
    },
    {
      icon: GitBranch,
      title: t("Liquidity engine", "محرك السيولة"),
      body: t(
        "Timed holds and queues keep deals moving without freezing inventory.",
        "الحجوزات المؤقتة والطوابير تحافظ على حركة الصفقات دون تجميد المخزون.",
      ),
      accent: "from-blue-400/20 to-indigo-400/5",
    },
    {
      icon: Cable,
      title: t("Intelligence bridge", "جسر الاستخبارات"),
      body: t(
        "AI routes intent. Verified tools execute the actual action.",
        "الذكاء يوجه النية. الأدوات المتحققة تنفذ الفعل الحقيقي.",
      ),
      accent: "from-lime-400/20 to-emerald-400/5",
    },
  ]

  const executionFlow = [
    {
      title: t("Raw URL ingest", "إدخال عبر الرابط"),
      body: t(
        "Drop in a listing URL and let the system read what already exists.",
        "ضع رابط القائمة ودع النظام يقرأ ما هو موجود بالفعل.",
      ),
    },
    {
      title: t("Spine check", "فحص العمود الفقري"),
      body: t(
        "Project, media, and pricing context are filled from the truth spine.",
        "يتم ملء المشروع والوسائط والسياق السعري من عمود الحقيقة.",
      ),
    },
    {
      title: t("Delta-first orchestration", "تنسيق يعتمد على الفجوات"),
      body: t(
        "The system asks only for what is missing.",
        "يطلب النظام فقط ما هو ناقص.",
      ),
    },
    {
      title: t("Deterministic publish", "نشر حتمي"),
      body: t(
        "Publishing becomes a verified state change.",
        "يصبح النشر انتقال حالة متحققاً منه.",
      ),
    },
  ]

  const roiPillars = [
    {
      title: t("Cleaner inventory", "مخزون أنظف"),
      body: t(
        "Duplicates and fake stock are filtered before they spread.",
        "يتم تصفية التكرار والمخزون الوهمي قبل أن ينتشرا.",
      ),
    },
    {
      title: t("Recovered demand", "طلب مستعاد"),
      body: t(
        "Queues and timed holds keep good demand inside the flow.",
        "الطوابير والحجوزات المؤقتة تحافظ على الطلب الجيد داخل التدفق.",
      ),
    },
    {
      title: t("Faster rollout", "إطلاق أسرع"),
      body: t(
        "You launch on top of the interface you already run.",
        "تنطلق فوق الواجهة التي تشغلها بالفعل.",
      ),
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="relative isolate bg-[#061019] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,rgba(6,16,25,0.98),rgba(6,16,25,1))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(to right, #8ef5b41a 1px, transparent 1px), linear-gradient(to bottom, #8ef5b41a 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative mx-auto max-w-[1240px] px-6 pb-24 pt-28 md:pt-36">
          <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,22,34,0.98),rgba(5,13,21,0.94))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  <Network className="h-3.5 w-3.5" />
                  {t("Decision and execution infrastructure", "بنية القرار والتنفيذ")}
                </p>
                <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {t("Deploy the infrastructure. Own the transaction.", "انشر البنية التحتية. وامتلك المعاملة.")}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                  {t(
                    "Entrestate is the operating layer for real estate decisioning, execution, and transaction control.",
                    "Entrestate هي طبقة التشغيل لقرارات العقار والتنفيذ والتحكم في المعاملة.",
                  )}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                  {t(
                    "One truth spine. Clean API boundaries. Structured deal rooms. Deterministic state control.",
                    "عمود حقيقة واحد. حدود API واضحة. غرف صفقات منظمة. تحكم حتمي بالحالة.",
                  )}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={prefixLocalePath("/enterprise", locale)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    {t("Explore the API space", "استكشف مساحة الـ API")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={prefixLocalePath("/contact", locale)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/40 hover:bg-white/10"
                  >
                    {t("Talk to enterprise sales", "تحدث مع فريق المؤسسات")}
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                  {[
                    t("Canonical truth spine", "عمود حقيقة موحد"),
                    t("Verified execution boundary", "حد تنفيذ متحقق"),
                    t("Structured deal rooms", "غرف صفقات منظمة"),
                    t("Headless deployment model", "نموذج نشر Headless"),
                  ].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#071623] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t("Unified architecture", "الهندسة الموحدة")}
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      label: t("Your frontend", "الواجهة الخاصة بك"),
                      detail: t("Your branded experience", "تجربتك بعلامتك"),
                      tone: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
                    },
                    {
                      label: t("Entrestate API boundary", "حد Entrestate API"),
                      detail: t("Typed payloads on /api/intel and /api/tx", "حمولات معيارية عبر /api/intel و /api/tx"),
                      tone: "border-amber-400/30 bg-amber-400/10 text-amber-100",
                    },
                    {
                      label: t("Decision infrastructure", "بنية القرار"),
                      detail: t("Evidence, scoring, and mapped city logic", "الأدلة والتقييم ومنطق المدينة المرسومة"),
                      tone: "border-orange-400/30 bg-orange-400/10 text-orange-100",
                    },
                    {
                      label: t("Execution infrastructure", "بنية التنفيذ"),
                      detail: t("Deal rooms, holds, queues, and contracts", "غرف صفقات وحجوزات وطوابير وعقود"),
                      tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
                    },
                    {
                      label: t("Canonical property spine", "عمود عقاري كنسي"),
                      detail: t("Shared truth under both layers", "الحقيقة المشتركة أسفل الطبقتين"),
                      tone: "border-white/15 bg-white/5 text-slate-100",
                    },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border px-4 py-4 ${item.tone}`}>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-6 opacity-85">{item.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {t(
                    "Keep the interface. Add the operating layer.",
                    "احتفظ بالواجهة. وأضف طبقة التشغيل.",
                  )}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Platform view", "نظرة المنصة")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("What the platform includes", "ما الذي تتضمنه المنصة")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "A short view of the core layers teams deploy first.",
                  "عرض مختصر للطبقات الأساسية التي تنشرها الفرق أولاً.",
                )}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {systemIncludes.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("System map", "خريطة النظام")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("The brain, the hands, and the truth spine underneath them", "الدماغ واليدين وعمود الحقيقة أسفلهما")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "The core modules behind the platform.",
                  "الوحدات الأساسية خلف المنصة.",
                )}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className={`rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]`}
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_0.1fr_0.95fr] lg:items-center">
              <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-6">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t("Stage 1", "المرحلة 1")}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{t("Generative area", "المنطقة التوليدية")}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {t(
                    "Intent is translated into structured objects. The model does not change state.",
                    "تتم ترجمة النية إلى كائنات منظمة. النموذج لا يغيّر الحالة.",
                  )}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-5 py-5 text-center">
                  <Lock className="mx-auto h-5 w-5 text-amber-200" />
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                    {t("Verified execution boundary", "حد التنفيذ المتحقق")}
                  </p>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-6">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t("Stage 2", "المرحلة 2")}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{t("Deterministic area", "المنطقة الحتمية")}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {t(
                    "Verified tools, SQL, and state machines execute every outcome.",
                    "تنفذ الأدوات المتحققة وSQL وآلات الحالات كل نتيجة.",
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Execution model", "نموذج التنفيذ")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("How it runs", "كيف يعمل")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "Less repeated input. More governed execution.",
                  "إدخال مكرر أقل. وتنفيذ محكوم أكثر.",
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-4">
              {executionFlow.map((step, index) => (
                <div key={step.title} className="rounded-[26px] border border-white/10 bg-white/5 p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {t("Step", "خطوة")} {index + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Fingerprint,
                  title: t("Cryptographic contact reveal", "كشف تواصل مشفر"),
                  body: t(
                    "Contact sharing unlocks only after the right conditions are met.",
                    "يتم فتح مشاركة التواصل فقط بعد تحقق الشروط الصحيحة.",
                  ),
                },
                {
                  icon: Workflow,
                  title: t("Timed holds and queue promotion", "حجوزات مؤقتة وترقية في الطابور"),
                  body: t(
                    "Time windows and queue promotion keep transactions moving.",
                    "النوافذ الزمنية وترقية الطابور تحافظ على حركة المعاملات.",
                  ),
                },
                {
                  icon: ShieldCheck,
                  title: t("Compliance before advance", "الامتثال قبل التقدم"),
                  body: t(
                    "Documents and verification are checked before any next step.",
                    "يتم فحص المستندات والتحقق قبل أي خطوة تالية.",
                  ),
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[26px] border border-white/10 bg-slate-950/30 p-6">
                    <Icon className="h-5 w-5 text-emerald-300" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,20,30,0.9),rgba(6,12,18,0.95))] p-8 md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Deployment model", "نموذج النشر")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("Headless underneath your existing portal", "Headless تحت بوابتك الحالية")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "The backend is opinionated. The interface stays yours.",
                  "الخلفية واضحة التوجه. والواجهة تبقى لك.",
                )}
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: t("Your frontend", "واجهتك"),
                  body: t(
                    "Search, listings, CRM, and brand stay under your control.",
                    "البحث والقوائم وCRM والعلامة تبقى تحت تحكمك.",
                  ),
                },
                {
                  icon: Cable,
                  title: t("Typed API payload", "حمولة API معيارية"),
                  body: t(
                    "Entrestate sends the decision and transaction payloads.",
                    "ترسل Entrestate حمولات القرار والتنفيذ.",
                  ),
                },
                {
                  icon: Database,
                  title: t("Our deterministic backend", "خلفيتنا الحتمية"),
                  body: t(
                    "Truth, tooling, evidence, and state control stay centralized.",
                    "تبقى الحقيقة والأدوات والأدلة والتحكم بالحالة مركزية.",
                  ),
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[26px] border border-white/10 bg-white/5 p-6">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 text-center text-lg font-medium text-white md:text-xl">
              {t(
                "Keep your frontend. Plug in the backend.",
                "احتفظ بواجهتك. أوصل الخلفية.",
              )}
            </p>
          </section>

          <section className="mt-20">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("Operator outcomes", "نتائج التشغيل")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {t("Why teams adopt the platform", "لماذا تعتمد الفرق هذه المنصة")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                {t(
                  "The value comes from cleaner inventory, recovered demand, and faster rollout.",
                  "القيمة تأتي من مخزون أنظف وطلب مستعاد وإطلاق أسرع.",
                )}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {roiPillars.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] p-7">
                  <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-200">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[32px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(8,14,24,0.94))] px-8 py-10 text-center md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
              {t("Next step", "الخطوة التالية")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {t(
                "Start with the API space. Expand into the full platform.",
                "ابدأ بمساحة الـ API ثم توسع إلى المنصة الكاملة.",
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-slate-200 md:text-base">
              {t(
                "See the integration surface first, then plan rollout and deployment with the enterprise team.",
                "شاهد سطح التكامل أولاً ثم خطط الإطلاق والنشر مع فريق المؤسسات.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={prefixLocalePath("/enterprise", locale)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {t("Open the API guide", "افتح دليل الـ API")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={prefixLocalePath("/contact", locale)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("Contact enterprise sales", "تواصل مع فريق المؤسسات")}
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
