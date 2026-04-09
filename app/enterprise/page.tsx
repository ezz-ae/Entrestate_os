import Link from "next/link"
import { CheckCircle2, Database, ShieldCheck, TerminalSquare, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { getApiContentRows } from "@/lib/frontend-content"

export const dynamic = "force-dynamic"

const MODULES = {
  en: [
    { title: "Truth Layer", description: "Unified canonical data spine with provenance and confidence tiers." },
    { title: "Decision Engine", description: "Deterministic signals across timing, stress, yield, and evidence." },
    { title: "Onboarding Engine", description: "Delta-first ingestion that resolves missing or conflicting data." },
    { title: "Collision Engine", description: "Sybil firewall for duplicate and fraudulent listings." },
    { title: "Transaction Engine", description: "Workspace-based execution with holds, queues, and routing." },
    { title: "Contract Engine", description: "Template-driven agreements with audit trail and signatures." },
    { title: "Execution API", description: "Endpoint surface that integrates invisibly under your portal." },
    { title: "Evidence Layer", description: "Every metric carries source lineage and confidence levels." },
    { title: "Recovery Engine", description: "Soft-bounce recovery to preserve intent and liquidity." },
    { title: "Trust Protocol", description: "Consent overlap and privacy-first contact reveal." },
  ],
  ar: [
    { title: "طبقة الحقيقة", description: "عمود بيانات موحد مع مستويات موثوقية ومصادر واضحة." },
    { title: "محرك القرار", description: "إشارات حتمية للتوقيت والضغط والعائد وجودة الأدلة." },
    { title: "محرك الإدخال", description: "استيراد يعتمد على الفجوات ويحل التعارضات تلقائياً." },
    { title: "محرك التصادم", description: "حاجز سيبيل لاكتشاف التكرار والاحتيال." },
    { title: "محرك المعاملات", description: "مساحات عمل تنفيذية مع الحجز والطوابير والتوجيه." },
    { title: "محرك العقود", description: "عقود قابلة للتوليد مع أثر تدقيق كامل." },
    { title: "واجهة التنفيذ", description: "طبقة API تعمل تحت بوابتك دون تغيير الواجهة." },
    { title: "طبقة الأدلة", description: "كل رقم يحمل مصدره ومستوى الثقة." },
    { title: "محرك الاستعادة", description: "استعادة تلقائية للاهتمام عند فشل الصفقة." },
    { title: "بروتوكول الثقة", description: "إظهار تواصل مشروط بتداخل الموافقات." },
  ],
}

const FALLBACK_API_GROUPS = [
  {
    title: "Intelligence API",
    endpoints: [
      { method: "POST", endpoint: "/api/intel/screen", description: "Filtered projects by criteria" },
      { method: "GET", endpoint: "/api/intel/project/:id", description: "Full project with all scores" },
      { method: "GET", endpoint: "/api/intel/project/:id/evidence", description: "Evidence drawer + attribution" },
      { method: "POST", endpoint: "/api/intel/compare", description: "Side-by-side comparison" },
      { method: "GET", endpoint: "/api/intel/area/:slug", description: "Area profile with benchmarks" },
      { method: "GET", endpoint: "/api/intel/area/:slug/projects", description: "All projects in area" },
      { method: "GET", endpoint: "/api/intel/developer/:slug", description: "Developer profile + trust" },
      { method: "GET", endpoint: "/api/intel/developer/:slug/projects", description: "Developer portfolio" },
      { method: "GET", endpoint: "/api/intel/market/pulse", description: "Market timing + stress" },
      { method: "GET", endpoint: "/api/intel/market/top-data", description: "Homepage signals" },
      { method: "POST", endpoint: "/api/intel/search", description: "Natural language -> structured query" },
      { method: "POST", endpoint: "/api/intel/memo", description: "Investment memo" },
    ],
  },
  {
    title: "Leasing API",
    endpoints: [
      { method: "POST", endpoint: "/api/tx/ingest/url", description: "Parse URL -> structured workspace" },
      { method: "POST", endpoint: "/api/tx/ingest/portfolio", description: "Bulk ingest portfolio" },
      { method: "POST", endpoint: "/api/tx/spine/match", description: "Canonical identity resolution" },
      { method: "POST", endpoint: "/api/tx/trust/collision", description: "Genetic collision detection" },
      { method: "POST", endpoint: "/api/tx/trust/sybil", description: "Sybil firewall" },
      { method: "GET", endpoint: "/api/tx/consent/overlap", description: "Channel intersection" },
      { method: "POST", endpoint: "/api/tx/hold/request", description: "Request hold or queue" },
      { method: "POST", endpoint: "/api/tx/hold/extend", description: "Extend hold" },
      { method: "POST", endpoint: "/api/tx/queue/promote", description: "Promote queue" },
      { method: "POST", endpoint: "/api/tx/recovery/bounce", description: "Find genetic match" },
      { method: "GET", endpoint: "/api/tx/workspace/:id", description: "Workspace detail" },
      { method: "POST", endpoint: "/api/tx/workspace/:id/transition", description: "State machine transition" },
      { method: "POST", endpoint: "/api/tx/contract/generate", description: "Generate agreement" },
      { method: "POST", endpoint: "/api/tx/contract/sign", description: "Record signature" },
      { method: "POST", endpoint: "/api/tx/messaging/classify", description: "WhatsApp intent routing" },
    ],
  },
  {
    title: "MCP Bridge",
    endpoints: [
      { method: "TOOL", endpoint: "search_mapped_city", description: "Find matching properties" },
      { method: "TOOL", endpoint: "request_primary_hold", description: "Lock unit or queue tenant" },
      { method: "TOOL", endpoint: "attempt_publish", description: "Sybil firewall + publish" },
      { method: "TOOL", endpoint: "get_folder_detail", description: "Workspace + intelligence" },
      { method: "TOOL", endpoint: "check_consent_overlap", description: "Channel intersection" },
      { method: "TOOL", endpoint: "get_queue_status", description: "Queue positions" },
      { method: "TOOL", endpoint: "classify_whatsapp_intent", description: "Intent routing" },
    ],
  },
]

const INTEGRATION_STEPS = {
  en: [
    "Connect your data sources and align schema boundaries.",
    "Provision API keys and map tier-gated columns.",
    "Embed the Decision Terminal and API response previews into your portal.",
    "Activate leasing workflows (holds, queues, consent, contracts).",
  ],
  ar: [
    "اربط مصادر البيانات وحدد حدود الـ API.",
    "قم بتفعيل مفاتيح API وربط الأعمدة حسب الباقة.",
    "ادمج محطة القرار ومعاينات الاستجابة داخل بوابتك.",
    "فعّل مسارات التنفيذ: الحجز والطوابير والموافقات والعقود.",
  ],
}

export default async function EnterprisePage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const modules = MODULES[isArabic ? "ar" : "en"]
  const steps = INTEGRATION_STEPS[isArabic ? "ar" : "en"]
  const apiContent = await getApiContentRows().catch(() => ({ rows: [], data_as_of: new Date().toISOString() }))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="rounded-3xl border border-border/70 bg-card/70 p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {isArabic ? "تكامل المؤسسات" : "Enterprise Integration"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "بيئة العرض الحي تحت بوابتك" : "A live demo environment under your portal"}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
            {isArabic
              ? "هذا الموقع ليس سوقاً للمستهلك. كل ما تراه هنا هو واجهة API تعمل تحت البنية الحالية لديك - دون تغيير واجهتك الحالية."
              : "This site is not a consumer marketplace. Everything you see is an API running invisibly under your existing frontend - no rebuild required."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={prefixLocalePath("/enterprise/demo", locale)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              <TerminalSquare className="h-4 w-4" />
              {isArabic ? "افتح الديمو التنفيذي" : "Open the Execution Demo"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={prefixLocalePath("/contact", locale)}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-6 py-3 text-sm font-semibold text-foreground"
            >
              {isArabic ? "مبيعات المؤسسات" : "Enterprise Sales"}
            </Link>
          </div>
        </header>

        <section id="modules" className="mt-12">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {isArabic ? "10 وحدات بنية تحتية" : "10 Infrastructure Modules"}
            </h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <div key={module.title} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <h3 className="text-sm font-semibold text-foreground">{module.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{module.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="api" className="mt-14">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {isArabic ? "سطح الـ API - 34 نقطة" : "API Surface - 34 Endpoints"}
            </h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {isArabic
              ? "كل استجابة تحمل request_id ومصدر الأدلة. الأعمدة المقيدة تُزال تلقائياً حسب الباقة."
              : "Every response ships with request_id and evidence provenance. Tier-gated columns are removed server-side."}
          </p>

          {apiContent.rows.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {apiContent.rows.map((row) => (
                    <tr key={`${row.method}-${row.endpoint}`} className="border-t border-border/40">
                      <td className="px-4 py-3 font-mono text-[11px] text-primary">{row.method}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-foreground">{row.endpoint}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.description ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.tier_required ?? "Enterprise"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {FALLBACK_API_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  <div className="mt-3 space-y-2">
                    {group.endpoints.map((endpoint) => (
                      <div key={endpoint.endpoint} className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-primary">
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-foreground">{endpoint.endpoint}</span>
                        <span className="text-muted-foreground">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {isArabic ? "خريطة التكامل" : "Integration Flow"}
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {isArabic ? "خطوة" : "Step"} {index + 1}
                </p>
                <p className="mt-2 text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
