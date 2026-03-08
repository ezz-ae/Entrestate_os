import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GridBackground } from "@/components/grid-background"
import { ScrollToTop } from "@/components/scroll-to-top"

const sections = [
  {
    title: "What this page covers",
    content:
      "This page explains how Entrestate ingests, transforms, stores, and presents market information for platform users, partners, and investor-facing documentation.",
  },
  {
    title: "Data sources",
    content:
      "Primary inputs include licensed listing feeds, developer disclosures, market transaction records, and internal normalization pipelines. We maintain source attribution and refresh metadata for every published metric.",
  },
  {
    title: "Processing model",
    content:
      "Raw feeds are validated, deduplicated, and standardized into canonical entities before scoring and analytics layers are applied. Derived metrics are generated through deterministic rules and auditable transformations.",
  },
  {
    title: "Publication and confidence controls",
    content:
      "Published insights require threshold checks for completeness, freshness, and consistency. Metrics that fail confidence checks are withheld or explicitly marked as limited confidence.",
  },
  {
    title: "Retention and access",
    content:
      "Data retention varies by dataset type and legal requirements. Access is role-based and logged. Sensitive operational datasets are restricted to authorized personnel and service processes only.",
  },
]

export default function DataUsagePage() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <GridBackground />

      <div className="relative pb-24 pt-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-3 text-4xl font-bold text-foreground md:text-5xl">Data Usage</h1>
            <p className="mb-10 text-sm text-muted-foreground">
              Entrestate data handling standards for collection, processing, and publication.
            </p>

            <div className="rounded-xl border border-border/50 bg-card/50 p-8 md:p-10">
              <div className="space-y-8">
                {sections.map((section) => (
                  <section key={section.title} className="border-b border-border/40 pb-8 last:border-0 last:pb-0">
                    <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
                    <p className="leading-relaxed text-muted-foreground">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
