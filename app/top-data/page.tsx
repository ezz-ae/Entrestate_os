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

const SECTION_COPY: Record<
  (typeof REQUIRED_SECTIONS)[number],
  { title: string; subtitle: string }
> = {
  "market-pulse": {
    title: "Market Pulse",
    subtitle: "Big-picture snapshot: active projects, average price, average yield, and BUY opportunities.",
  },
  "timing-signals": {
    title: "Timing Signals",
    subtitle: "Distribution of BUY / HOLD / WAIT signals with price and yield context.",
  },
  "stress-grades": {
    title: "Stress Grades",
    subtitle: "Portfolio resilience distribution from grade A through F.",
  },
  affordability: {
    title: "Affordability Tiers",
    subtitle: "Project mix by affordability segment and yield profile.",
  },
  "outcome-intents": {
    title: "Outcome Intents",
    subtitle: "What investor goals the current inventory best serves.",
  },
  "top-projects": {
    title: "Top Projects",
    subtitle: "Ranked projects table with price, yield, stress, timing, and score fields.",
  },
  "area-intelligence": {
    title: "Area Intelligence",
    subtitle: "Area-level project depth, pricing, efficiency, and supply pressure.",
  },
  "developer-reliability": {
    title: "Developer Reliability",
    subtitle: "Developer-level consistency, safe-project count, and track record.",
  },
  "golden-visa": {
    title: "Golden Visa",
    subtitle: "Eligible inventory counts and quality profile for AED 2M+ buyers.",
  },
  "trust-bar": {
    title: "Trust Bar",
    subtitle: "Data hierarchy, engine stack, and confidence distribution across the dataset.",
  },
}

function sectionLayoutClass(section: (typeof REQUIRED_SECTIONS)[number]) {
  if (section === "market-pulse") return "xl:col-span-3"
  if (section === "top-projects") return "xl:col-span-3"
  if (section === "outcome-intents") return "xl:col-span-2"
  if (section === "area-intelligence") return "xl:col-span-2"
  if (section === "trust-bar") return "xl:col-span-2"
  return "xl:col-span-1"
}

export default async function TopDataPage() {
  const topData = await getTopDataRows()

  const rowsBySection = new Map(topData.sections.map((row) => [row.section, row]))
  const availableSections = topData.sections.filter((row) => REQUIRED_SECTIONS.includes(row.section as (typeof REQUIRED_SECTIONS)[number]))
  const missingSections = REQUIRED_SECTIONS.filter((key) => !rowsBySection.has(key))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Market Data</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">UAE Market Intelligence</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A guided intelligence board for pricing, timing, stress, developer quality, and opportunity signals.
          </p>
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{availableSections.length}</span>
              /{REQUIRED_SECTIONS.length} sections loaded
            </span>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
            Start with <span className="font-medium text-foreground">Market Pulse</span> → scan{" "}
            <span className="font-medium text-foreground">Timing</span> &{" "}
            <span className="font-medium text-foreground">Stress</span> → drill into{" "}
            <span className="font-medium text-foreground">Top Projects</span>
          </div>
          {missingSections.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-400">
              Missing: {missingSections.map((key) => SECTION_COPY[key].title).join(", ")}
            </div>
          ) : null}
        </section>

        <section className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(245,158,11,0.18),transparent_58%)]" />
          {REQUIRED_SECTIONS.map((sectionKey) => {
            const section = rowsBySection.get(sectionKey)
            const nowIso = new Date().toISOString()
            const fallback = SECTION_COPY[sectionKey]

            return (
              <div key={sectionKey} className={sectionLayoutClass(sectionKey)}>
                <TopDataSection
                  section={sectionKey}
                  title={section?.title ?? fallback.title}
                  subtitle={section?.subtitle ?? fallback.subtitle}
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
