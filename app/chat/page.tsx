import { Navbar } from "@/components/navbar"
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
      <div className="mx-auto max-w-[1600px] px-6 pb-14 pt-28 md:pt-32">
        {billingParam === "success" ? (
          <p className="mb-4 text-sm text-emerald-600">Subscription activated. Your new tier is syncing now.</p>
        ) : null}
        <ChatInterface
          initialDailyLimit={usage.limit}
          initialRemaining={usage.remaining}
        />
      </div>
    </main>
  )
}
