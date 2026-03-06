import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AreaCard } from "@/components/decision/area-card"
import { listAreas } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function AreasPage() {
  const data = await listAreas()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Areas</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Area Intelligence Map</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            64 area profiles powered by inventory-level pricing, yield, and timing signals.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.areas.map((area) => (
            <AreaCard
              key={String(area.slug)}
              slug={String(area.slug)}
              area={String(area.area ?? "Area")}
              projects={typeof area.projects === "number" ? area.projects : null}
              avg_price={typeof area.avg_price === "number" ? area.avg_price : null}
              avg_yield={typeof area.avg_yield === "number" ? area.avg_yield : null}
              image_url={typeof area.image_url === "string" ? area.image_url : null}
            />
          ))}
        </section>
      </div>
      <Footer />
    </main>
  )
}

