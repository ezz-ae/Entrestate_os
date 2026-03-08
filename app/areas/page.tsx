import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AreasView } from "@/components/decision/areas-view"
import { listAreas } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function AreasPage() {
  const data = await listAreas()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            Areas
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-5xl">
            Area Intelligence Map
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.areas.length.toLocaleString()} area profiles — pricing depth, yield averages, and market timing signals. Click any dot to explore.
          </p>
        </header>

        <AreasView areas={data.areas} />
      </div>
      <Footer />
    </main>
  )
}
