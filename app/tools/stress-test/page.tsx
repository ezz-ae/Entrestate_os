import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { formatScore } from "@/components/decision/formatters"
import { listProperties } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function StressTestPage() {
  const data = await listProperties({ page: 1, pageSize: 30, sortBy: "god_metric" })

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Tools</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Stress Test Engine</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review stress grades and engine scores across top-ranked projects.
          </p>
        </header>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-3 border-b border-border/60 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Project</span>
            <span>Area</span>
            <span>Stress grade</span>
            <span>Stress score</span>
          </div>

          <div className="mt-2 space-y-2">
            {data.projects.map((project) => (
              <div
                key={String(project.slug)}
                className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <span className="text-foreground">{String(project.name ?? "Project")}</span>
                <span className="text-muted-foreground">{String(project.final_area ?? project.area ?? "—")}</span>
                <span className="text-foreground">{String(project.l2_stress_test_grade ?? "—")}</span>
                <span className="text-foreground">{formatScore(project.engine_stress_test)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}

