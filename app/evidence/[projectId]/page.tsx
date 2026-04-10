import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"

type EvidencePageProps = {
  params: {
    projectId: string
  }
}

const MOCK_SOURCES = [
  { label: "DLD registrations", value: "api.dld_transactions_v1" },
  { label: "Bayut listing feed", value: "api.listings_feed" },
  { label: "Project canon", value: "api.projects_v1" },
]

const MOCK_EXCLUSIONS = [
  "Excluded pre-2005 transactions (low-confidence)",
  "Dropped PF listings flagged as duplicates",
  "Removed neighborhoods under renovation moratorium",
]

const MOCK_ASSUMPTIONS = [
  "Yield is computed on fully financed price",
  "Timing signal assumes current zoning approval timeline",
  "Developer reliability pulls last 12 months of delivery data",
]

export default function EvidencePage({ params }: EvidencePageProps) {
  const { projectId } = params

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 py-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          Evidence Drawer
        </p>
        <h1 className="mt-3 text-3xl font-serif font-semibold tracking-tight text-foreground">
          Audit trail for {projectId}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Every verdict on Entrestate traces back to the data sources, filters, and assumptions surfaced here.
          Use this canonical record when you brief stakeholders, risk, or regulators about why the decision landed where it did.
        </p>

        <div className="mt-8 space-y-10">
          <EvidenceDrawer
            title={`Evidence Drawer • ${projectId}`}
            sources={MOCK_SOURCES}
            exclusions={MOCK_EXCLUSIONS}
            assumptions={MOCK_ASSUMPTIONS}
            confidenceScore={86}
            confidenceLevel="high"
            runId="run-2026-04-14-001"
            snapshotTs={new Date().toISOString()}
          />
          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Next steps</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Reference the `requestId` in your workflows to replay the same data set.</li>
              <li>Share the Evidence Drawer URL with stakeholders so everyone sees the same sources.</li>
              <li>Schedule follow-up automation using ProAgent Studio after leadership signs off.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="rounded-full border border-primary/60 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:border-primary hover:text-primary-foreground"
              >
                Browse Properties
              </Link>
              <Link
                href="/chat"
                className="rounded-full border border-border/60 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                Launch Decision Terminal
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
