import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { listProperties } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

type SearchParams = {
  area?: string
  developer?: string
  timing?: "BUY" | "HOLD" | "WAIT"
  stress?: "A" | "B" | "C" | "D"
  minPrice?: string
  maxPrice?: string
  bedsMin?: string
  bedsMax?: string
  page?: string
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? "1", 10)

  const result = await listProperties({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 20,
    filters: {
      area: params.area,
      developer: params.developer,
      timingSignal: params.timing,
      stressGradeMin: params.stress,
      budgetMinAed: params.minPrice ? Number.parseFloat(params.minPrice) : undefined,
      budgetMaxAed: params.maxPrice ? Number.parseFloat(params.maxPrice) : undefined,
      bedsMin: params.bedsMin ? Number.parseFloat(params.bedsMin) : undefined,
      bedsMax: params.bedsMax ? Number.parseFloat(params.bedsMax) : undefined,
    },
  })

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Properties</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">UAE Project Inventory</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.total.toLocaleString()} projects — each scored for pricing, market timing, stress resilience, and data confidence.
          </p>
        </header>

        {/* Filter / Signal chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter by signal:</span>
          {(["BUY", "HOLD", "WAIT"] as const).map((signal) => {
            const colors = signal === "BUY"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              : signal === "HOLD"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            return (
              <a
                key={signal}
                href={`?timing=${signal}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${colors} ${params.timing === signal ? "ring-1 ring-offset-1 ring-current" : ""}`}
              >
                {signal}
              </a>
            )
          })}
          {(["A", "B", "C"] as const).map((grade) => (
            <a
              key={grade}
              href={`?stress=${grade}`}
              className={`rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground ${params.stress === grade ? "border-primary/60 bg-primary/10 text-foreground" : ""}`}
            >
              Risk Grade {grade}
            </a>
          ))}
          {(params.timing || params.stress) ? (
            <a href="/properties" className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground">
              Clear filters
            </a>
          ) : null}
        </div>

        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(59,130,246,0.22),transparent_58%)]" />
          {result.projects.map((project) => (
            <ProjectCard
              key={String(project.slug)}
              slug={String(project.slug)}
              name={String(project.name ?? "Unnamed project")}
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
