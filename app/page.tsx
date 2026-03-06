import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getHomepageContentSections, getMarketPulseSummary, getOutcomeIntentCounts } from "@/lib/frontend-content"
import { HeroSection } from "@/components/homepage/hero-section"
import { ThreeSurfacesSection } from "@/components/homepage/three-surfaces-section"
import { GoldenPathsSection } from "@/components/homepage/golden-paths-section"
import { IntentRoutingSection } from "@/components/homepage/intent-routing-section"
import { TrustSection } from "@/components/homepage/trust-section"
import { PricingSection } from "@/components/homepage/pricing-section"

export const dynamic = "force-dynamic"

const INTENT_FALLBACKS: Record<string, number> = {
  yield_seeking: 1510,
  golden_visa: 1055,
  capital_growth: 1177,
  first_time_buyer: 3887,
  trophy_asset: 483,
  conservative: 1806,
}

const INTENT_LABELS: Record<string, string> = {
  yield_seeking: "Yield Seeking",
  golden_visa: "Golden Visa",
  capital_growth: "Capital Growth",
  first_time_buyer: "First Time Buyer",
  trophy_asset: "Trophy Asset",
  conservative: "Conservative",
}

function normalizeIntentKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function contentForSection(sections: Map<string, unknown>, key: string) {
  return asObject(sections.get(key))
}

export default async function HomePage() {
  const [homepage, pulse, intents] = await Promise.all([
    getHomepageContentSections().catch(() => ({ data_as_of: new Date().toISOString(), sections: [] })),
    getMarketPulseSummary().catch(() => ({
      data_as_of: new Date().toISOString(),
      summary: {
        total: 0,
        avg_price: null,
        avg_yield: null,
        buy_signals: 0,
        high_confidence: 0,
      },
    })),
    getOutcomeIntentCounts().catch(() => ({ data_as_of: new Date().toISOString(), rows: [] })),
  ])

  const sectionMap = new Map(homepage.sections.map((row) => [row.section, row.content_json]))

  const heroContent = contentForSection(sectionMap, "hero")
  const surfacesContent = contentForSection(sectionMap, "three-surfaces")
  const pathsContent = contentForSection(sectionMap, "golden-paths")
  const trustContent = contentForSection(sectionMap, "trust-section")
  const pricingContent = contentForSection(sectionMap, "pricing")

  const totalProjects = pulse.summary.total || 7015
  const highConfidence = pulse.summary.high_confidence || 593
  const buySignals = pulse.summary.buy_signals || 2667

  const intentMap = new Map<string, number>()
  for (const row of intents.rows) {
    intentMap.set(normalizeIntentKey(row.intent), row.count)
  }

  const intentCards = Object.keys(INTENT_LABELS).map((key) => ({
    key,
    label: INTENT_LABELS[key],
    count: intentMap.get(key) ?? INTENT_FALLBACKS[key],
  }))

  const surfaces = asArray(surfacesContent.surfaces ?? surfacesContent.items).map((item) => ({
    title: asText(item.title) ?? "Surface",
    description: asText(item.description) ?? "",
    href: asText(item.href) ?? "/",
  }))

  const shortcuts = asArray(pathsContent.shortcuts ?? pathsContent.items).map((item) => ({
    label: asText(item.label) ?? "Open",
    href: asText(item.href) ?? "/",
  }))

  const pricingTiers = asArray(pricingContent.tiers).map((item) => ({
    name: asText(item.name) ?? "Tier",
    price: asText(item.price) ?? "—",
    description: asText(item.description) ?? "",
    href: asText(item.href) ?? "/pricing",
    cta: asText(item.cta) ?? "Open",
  }))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:pt-36">
        <HeroSection
          totalProjects={totalProjects}
          dataPoints={180}
          highConfidence={highConfidence}
          buySignals={buySignals}
          avgPrice={pulse.summary.avg_price}
          avgYield={pulse.summary.avg_yield}
          headline={asText(heroContent.headline) ?? undefined}
          subheadline={asText(heroContent.subheadline) ?? undefined}
          primaryCtaLabel={asText(heroContent.primary_cta_label) ?? undefined}
          primaryCtaHref={asText(heroContent.primary_cta_href) ?? undefined}
          secondaryCtaLabel={asText(heroContent.secondary_cta_label) ?? undefined}
          secondaryCtaHref={asText(heroContent.secondary_cta_href) ?? undefined}
        />

        <ThreeSurfacesSection surfaces={surfaces.length > 0 ? surfaces : undefined} />
        <GoldenPathsSection shortcuts={shortcuts.length > 0 ? shortcuts : undefined} />
        <IntentRoutingSection intents={intentCards} />

        <TrustSection
          verifiedRows={totalProjects}
          highConfidencePct={totalProjects > 0 ? (highConfidence / totalProjects) * 100 : 0}
          updatedAt={homepage.data_as_of}
          title={asText(trustContent.title) ?? undefined}
          methodology={asText(trustContent.methodology) ?? undefined}
        />

        <PricingSection tiers={pricingTiers.length > 0 ? pricingTiers : undefined} />
      </div>
      <Footer />
    </main>
  )
}
