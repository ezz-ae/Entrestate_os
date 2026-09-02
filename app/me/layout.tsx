import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MeNav } from "@/components/me/me-nav"
import { requireSyncedUser } from "@/lib/auth/guard"
import { getCurrentEntitlement } from "@/lib/account-entitlement"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your Entrestate",
  // Personal home is per-user content — never indexed
  robots: { index: false, follow: false },
}

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSyncedUser("/me")
  const entitlement = await getCurrentEntitlement()

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:px-8">
        <MeNav tier={entitlement.tier} />
        <div className="mt-6">{children}</div>
      </div>
      <Footer />
    </main>
  )
}
