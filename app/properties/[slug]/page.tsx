import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"
import { ProjectCard } from "@/components/decision/project-card"
import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { formatAed, formatYield, formatScore } from "@/components/decision/formatters"
import { getProjectBySlug } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { pickLocalizedText } from "@/lib/format/entities"

export const dynamic = "force-dynamic"

function formatValue(value: unknown, locale: string, booleanCopy: { yes: string; no: string }): string {
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString(locale) : "—"
  if (typeof value === "string") return value.trim() || "—"
  if (typeof value === "boolean") return value ? booleanCopy.yes : booleanCopy.no
  return "—"
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getProjectBySlug(slug)

  if (!detail) notFound()

  const project = detail.project
  const copy = locale === "ar"
    ? {
        unknownArea: "منطقة غير معروفة",
        developerFallback: "المطور",
        pageEyebrow: "تفاصيل المشروع",
        projectFallback: "المشروع",
        canonicalPrice: "السعر المرجعي",
        canonicalYield: "العائد المرجعي",
        investorScore: "نتيجة المستثمر",
        stressEngine: "محرك الضغط",
        paymentPlan: "خطة الدفع",
        noPaymentPlan: "لا توجد خطة دفع منظمة حالياً.",
        milestone: "مرحلة",
        units: "الوحدات",
        noUnits: "لا توجد عينات وحدات متاحة حالياً.",
        unit: "وحدة",
        areaContext: "سياق المنطقة",
        developerProfile: "ملف المطور",
        similarProjects: "مشاريع مشابهة",
        yes: "نعم",
        no: "لا",
      }
    : {
        unknownArea: "Unknown area",
        developerFallback: "Developer",
        pageEyebrow: "Project Detail",
        projectFallback: "Project",
        canonicalPrice: "Canonical price",
        canonicalYield: "Canonical yield",
        investorScore: "Investor score",
        stressEngine: "Stress engine",
        paymentPlan: "Payment plan",
        noPaymentPlan: "No structured payment plan available.",
        milestone: "Milestone",
        units: "Units",
        noUnits: "No unit-level samples available yet.",
        unit: "Unit",
        areaContext: "Area context",
        developerProfile: "Developer profile",
        similarProjects: "Similar projects",
        yes: "Yes",
        no: "No",
      }

  const area = pickLocalizedText(locale, project.area_ar, project.final_area ?? project.area, copy.unknownArea)
  const developer = pickLocalizedText(locale, project.developer_ar, project.developer, copy.developerFallback)
  const paymentPlanRows = toRecordArray(project.payment_plan_structured)
  const unitRows = toRecordArray(project.units)
  const areaContext = toObject(detail.area_context)
  const developerProfile = toObject(detail.developer_profile)

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6">
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/25" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(680px_circle_at_50%_-280px,rgba(59,130,246,0.2),transparent_58%)] opacity-80" />

          <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.pageEyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{String(project.name ?? copy.projectFallback)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{[area, developer].filter(Boolean).join(" · ")}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.canonicalPrice}</p>
              <p className="font-medium text-foreground">{formatAed(project.l1_canonical_price, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.canonicalYield}</p>
              <p className="font-medium text-foreground">{formatYield(project.l1_canonical_yield, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.investorScore}</p>
              <p className="font-medium text-foreground">{formatScore(project.engine_god_metric, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.stressEngine}</p>
              <p className="font-medium text-foreground">{formatScore(project.engine_stress_test, locale)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StressGradeBadge grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null} />
            <TimingSignalBadge signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null} />
            <ConfidenceBadge confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null} />
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
              <h2 className="text-lg font-semibold text-foreground">{copy.paymentPlan}</h2>
              {paymentPlanRows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{copy.noPaymentPlan}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {paymentPlanRows.slice(0, 6).map((row, index) => (
                    <div key={`plan-${index}`} className="rounded-lg border border-border/50 bg-background/50 p-3 text-xs">
                      <p className="font-medium text-foreground">{copy.milestone} {index + 1}</p>
                      <p className="mt-1 text-muted-foreground">
                        {Object.entries(row)
                          .slice(0, 3)
                          .map(([key, value]) => `${key}: ${formatValue(value, locale, copy)}`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
              <h2 className="text-lg font-semibold text-foreground">{copy.units}</h2>
              {unitRows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{copy.noUnits}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {unitRows.slice(0, 6).map((row, index) => (
                    <div key={`unit-${index}`} className="rounded-lg border border-border/50 bg-background/50 p-3 text-xs">
                      <p className="font-medium text-foreground">{copy.unit} {index + 1}</p>
                      <p className="mt-1 text-muted-foreground">
                        {Object.entries(row)
                          .slice(0, 4)
                          .map(([key, value]) => `${key}: ${formatValue(value, locale, copy)}`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
              <h2 className="text-lg font-semibold text-foreground">{copy.areaContext}</h2>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(areaContext).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border/50 bg-background/50 p-3 text-xs">
                    <p className="text-muted-foreground">{key}</p>
                    <p className="mt-1 font-medium text-foreground">{formatValue(value, locale, copy)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
              <h2 className="text-lg font-semibold text-foreground">{copy.developerProfile}</h2>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(developerProfile).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border/50 bg-background/50 p-3 text-xs">
                    <p className="text-muted-foreground">{key}</p>
                    <p className="mt-1 font-medium text-foreground">{formatValue(value, locale, copy)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <EvidenceDrawer
              sources={project.evidence_sources}
              exclusions={project.evidence_exclusions}
              assumptions={project.evidence_assumptions}
            />

            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
              <h2 className="text-lg font-semibold text-foreground">{copy.similarProjects}</h2>
              <div className="mt-3 space-y-3">
                {detail.similar_projects.map((similar) => (
                  <ProjectCard
                    key={String(similar.slug)}
                    slug={String(similar.slug)}
                    name={String(similar.name ?? copy.projectFallback)}
                    area={String(similar.area ?? "")}
                    area_ar={typeof similar.area_ar === "string" ? similar.area_ar : null}
                    developer={String(similar.developer ?? "")}
                    developer_ar={typeof similar.developer_ar === "string" ? similar.developer_ar : null}
                    l1_canonical_price={typeof similar.l1_canonical_price === "number" ? similar.l1_canonical_price : null}
                    l1_canonical_yield={typeof similar.l1_canonical_yield === "number" ? similar.l1_canonical_yield : null}
                    l2_stress_test_grade={
                      typeof similar.l2_stress_test_grade === "string" ? similar.l2_stress_test_grade : null
                    }
                    l3_timing_signal={typeof similar.l3_timing_signal === "string" ? similar.l3_timing_signal : null}
                    engine_god_metric={typeof similar.engine_god_metric === "number" ? similar.engine_god_metric : null}
                    l1_confidence={typeof similar.l1_confidence === "string" ? similar.l1_confidence : null}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
