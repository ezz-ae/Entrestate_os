import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DeveloperCard } from "@/components/decision/developer-card"
import { listDevelopers } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function DevelopersPage() {
  const data = await listDevelopers()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Developers</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Developer Reliability Directory</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse active developer profiles with reliability and stress-quality metrics.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.developers.map((developer) => (
            <DeveloperCard
              key={String(developer.slug)}
              slug={String(developer.slug)}
              developer={String(developer.developer ?? "Developer")}
              projects={typeof developer.projects === "number" ? developer.projects : null}
              reliability={typeof developer.reliability === "number" ? developer.reliability : null}
              avg_price={typeof developer.avg_price === "number" ? developer.avg_price : null}
              logo_url={typeof developer.logo_url === "string" ? developer.logo_url : null}
            />
          ))}
        </section>
      </div>
      <Footer />
    </main>
  )
}

