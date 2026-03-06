import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { getGoldenVisaProjects } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function GoldenVisaPage() {
  const result = await getGoldenVisaProjects()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Golden Visa</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Golden Visa Qualifier</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Projects priced at AED 2M+ with confidence-aware screening and timing/stress signals.
          </p>
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

