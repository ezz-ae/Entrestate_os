import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"
import { ProjectCard } from "@/components/decision/project-card"
import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { formatAed, formatYield, formatScore } from "@/components/decision/formatters"
import { getProjectBySlug } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = await getProjectBySlug(slug)

  if (!detail) notFound()

  const project = detail.project
  const area = String(project.final_area ?? project.area ?? "Unknown area")

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Project Detail</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{String(project.name ?? "Project")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{[area, project.developer].filter(Boolean).join(" · ")}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Canonical price</p>
              <p className="font-medium text-foreground">{formatAed(project.l1_canonical_price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Canonical yield</p>
              <p className="font-medium text-foreground">{formatYield(project.l1_canonical_yield)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">God metric</p>
              <p className="font-medium text-foreground">{formatScore(project.engine_god_metric)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stress engine</p>
              <p className="font-medium text-foreground">{formatScore(project.engine_stress_test)}</p>
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
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <h2 className="text-lg font-semibold text-foreground">Payment plan</h2>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {JSON.stringify(project.payment_plan_structured ?? [], null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <h2 className="text-lg font-semibold text-foreground">Units</h2>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{JSON.stringify(project.units ?? [], null, 2)}</pre>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <h2 className="text-lg font-semibold text-foreground">Area context</h2>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {JSON.stringify(detail.area_context ?? {}, null, 2)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <h2 className="text-lg font-semibold text-foreground">Developer profile</h2>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {JSON.stringify(detail.developer_profile ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="space-y-6">
            <EvidenceDrawer
              sources={project.evidence_sources}
              exclusions={project.evidence_exclusions}
              assumptions={project.evidence_assumptions}
            />

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <h2 className="text-lg font-semibold text-foreground">Similar projects</h2>
              <div className="mt-3 space-y-3">
                {detail.similar_projects.map((similar) => (
                  <ProjectCard
                    key={String(similar.slug)}
                    slug={String(similar.slug)}
                    name={String(similar.name ?? "Project")}
                    area={String(similar.area ?? "")}
                    developer={String(similar.developer ?? "")}
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

