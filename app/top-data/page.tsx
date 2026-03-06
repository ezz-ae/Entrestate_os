import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getTopDataRows } from "@/lib/frontend-content"
import { TopDataSection } from "@/components/top-data/top-data-section"

export const dynamic = "force-dynamic"

const REQUIRED_SECTIONS = [
  "market-pulse",
  "timing-signals",
  "stress-grades",
  "affordability",
  "outcome-intents",
  "top-projects",
  "area-intelligence",
  "developer-reliability",
  "golden-visa",
  "trust-bar",
] as const

function sectionLayoutClass(section: (typeof REQUIRED_SECTIONS)[number]) {
  if (section === "market-pulse") return "xl:col-span-3"
  if (section === "top-projects") return "xl:col-span-3"
  if (section === "outcome-intents") return "xl:col-span-2"
  if (section === "area-intelligence") return "xl:col-span-2"
  if (section === "trust-bar") return "xl:col-span-2"
  return "xl:col-span-1"
}

function prettySectionName(section: string) {
  return section
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

export default async function TopDataPage() {
  const topData = await getTopDataRows()

  const rowsBySection = new Map(topData.sections.map((row) => [row.section, row]))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Market Data</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">UAE Real Estate Market Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live market sections with confidence levels and refresh timestamps.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REQUIRED_SECTIONS.map((sectionKey) => {
            const section = rowsBySection.get(sectionKey)
            const nowIso = new Date().toISOString()

            return (
              <div key={sectionKey} className={sectionLayoutClass(sectionKey)}>
                <TopDataSection
                  section={sectionKey}
                  title={section?.title ?? prettySectionName(sectionKey)}
                  subtitle={section?.subtitle ?? null}
                  confidence={section?.confidence ?? "LOW"}
                  lastUpdated={section?.last_updated ?? nowIso}
                  data={section?.data_json ?? { message: "No section data available" }}
                />
              </div>
            )
          })}
        </section>
      </div>
      <Footer />
    </main>
  )
}
