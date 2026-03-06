import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { formatAed, formatScore } from "@/components/decision/formatters"
import { getDeveloperBySlug } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const detail = await getDeveloperBySlug(slug)
  if (!detail) notFound()

  const developer = detail.developer
  const profile = developer.profile as Record<string, unknown> | null

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Developer Detail</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{String(developer.developer ?? "Developer")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[profile?.founded_year, profile?.hq].filter(Boolean).join(" · ") || "Developer profile"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <p className="text-xs text-muted-foreground">Reliability</p>
              <p className="font-medium text-foreground">{formatScore(developer.reliability)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Efficiency</p>
              <p className="font-medium text-foreground">{formatScore(developer.efficiency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projects</p>
              <p className="font-medium text-foreground">{String(developer.projects ?? "—")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Safe projects</p>
              <p className="font-medium text-foreground">{String(developer.safe_projects ?? "—")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg ticket</p>
              <p className="font-medium text-foreground">{formatAed(developer.avg_price)}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {detail.projects.map((project) => (
                <ProjectCard
                  key={String(project.slug)}
                  slug={String(project.slug)}
                  name={String(project.name ?? "Project")}
                  area={String(project.area ?? "")}
                  developer={String(developer.developer ?? "")}
                  l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
                  l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
                  l2_stress_test_grade={
                    typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null
                  }
                  l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
                  engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
                  l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
                />
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <h2 className="text-lg font-semibold text-foreground">Area presence</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {detail.area_presence.map((area, index) => (
                <li key={`${String(area.area)}-${index}`} className="flex items-center justify-between">
                  <span>{String(area.area ?? "Area")}</span>
                  <span>{String(area.projects ?? "—")}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  )
}

