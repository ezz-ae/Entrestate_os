import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { listProperties } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

type SearchParams = {
  profile?: string
}

function profileFilters(profile: string | undefined) {
  const normalized = (profile ?? "conservative").toLowerCase()
  if (normalized === "balanced") {
    return {
      intent: "balanced",
      stressGradeMin: "C" as const,
    }
  }
  if (normalized === "aggressive") {
    return {
      intent: "general",
      stressGradeMin: "D" as const,
    }
  }

  return {
    intent: "conservative",
    stressGradeMin: "B" as const,
  }
}

export default async function AgentRuntimePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const activeProfile = params.profile ?? "conservative"

  const result = await listProperties({
    filters: {
      ...profileFilters(activeProfile),
      budgetMinAed: 1,
    },
    sortBy: "god_metric",
    page: 1,
    pageSize: 20,
  })

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor Routing</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Investor Match Desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profile-based inventory routing across outcome intent, affordability, and stress metrics.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["conservative", "Conservative"],
              ["balanced", "Balanced"],
              ["aggressive", "Aggressive"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={`/agent-runtime?profile=${value}`}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeProfile === value
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/50 text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.projects.map((project) => (
            <ProjectCard
              key={String(project.slug)}
              slug={String(project.slug)}
              name={String(project.name ?? "Project")}
              area={String(project.final_area ?? project.area ?? "")}
              developer={String(project.developer ?? "")}
              l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
              l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
              l2_stress_test_grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null}
              l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
              engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
              l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
            />
          ))}
        </section>
      </div>
      <Footer />
    </main>
  )
}
