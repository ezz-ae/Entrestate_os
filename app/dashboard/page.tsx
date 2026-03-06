import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { TrustBar } from "@/components/decision/trust-bar"
import { getMarketPulse } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const pulse = await getMarketPulse()

  const summary = pulse.summary as Record<string, unknown> | null
  const projects = typeof summary?.projects === "number" ? summary.projects : 0
  const highConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "HIGH")
  const highConfidencePct =
    projects > 0 && typeof highConfidence?.count === "number" ? (highConfidence.count / projects) * 100 : undefined

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Investor Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track market pulse, watchlist activity, and account usage in one place.
          </p>
        </header>

        <TrustBar verifiedRows={projects} highConfidencePct={highConfidencePct} updatedAt={pulse.data_as_of} />

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-border/70 bg-card/70 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Market pulse</p>
            <pre className="mt-3 overflow-auto text-xs text-muted-foreground">{JSON.stringify(summary ?? {}, null, 2)}</pre>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/70 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Quick actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/market-score">New screen</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chat">New chat</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/tools/memo">Generate report</Link>
              </Button>
            </div>
          </article>
        </section>
      </div>
      <Footer />
    </main>
  )
}
