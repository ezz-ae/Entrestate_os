import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChatInterface } from "@/components/ChatInterface"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { FREE_COPILOT_DAILY_LIMIT, getCopilotDailyUsage } from "@/lib/copilot-usage"

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const entitlement = await getCurrentEntitlement()
  const params = (await searchParams) ?? {}
  const billingParam = Array.isArray(params.billing) ? params.billing[0] : params.billing
  const usage = entitlement.accountKey
    ? await getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
    : {
        accountKey: "",
        date: new Date().toISOString().slice(0, 10),
        used: 0,
        limit: entitlement.tier === "free" ? FREE_COPILOT_DAILY_LIMIT : null,
        remaining: entitlement.tier === "free" ? FREE_COPILOT_DAILY_LIMIT : null,
      }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Decision Tunnel</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Decision Tunnel + Evidence</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask for project screening, price checks, area risk briefs, and full investor memos.
          </p>
          {billingParam === "success" ? (
            <p className="mt-2 text-sm text-emerald-600">Subscription activated. Your new tier is syncing now.</p>
          ) : null}
        </header>
        <ChatInterface
          initialTier={entitlement.tier}
          initialDailyLimit={usage.limit}
          initialUsedToday={usage.used}
          initialRemaining={usage.remaining}
        />
      </div>
      <Footer />
    </main>
  )
}
