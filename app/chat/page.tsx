import { Navbar } from "@/components/navbar"
import { ChatInterface } from "@/components/ChatInterface"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getCopilotDailyLimit, getCopilotDailyUsage } from "@/lib/copilot-usage"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  // Check for mobile user agent to handle "no chat page on mobile" requirement
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent)
  const params = (await searchParams) ?? {}
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id
  const promptParam = Array.isArray(params.prompt) ? params.prompt[0] : params.prompt
  const queryParam = Array.isArray(params.q) ? params.q[0] : params.q

  if (isMobile) {
    // On mobile, always use the sidebar chat experience instead of the desktop /chat layout.
    const chatParams = new URLSearchParams({ openChat: "true" })
    if (sessionId) {
      chatParams.set("id", sessionId)
    }
    redirect(`/?${chatParams.toString()}`)
  }

  const entitlement = await getCurrentEntitlement()
  const billingParam = Array.isArray(params.billing) ? params.billing[0] : params.billing
  const usage = entitlement.accountKey
    ? await getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
    : {
        accountKey: "",
        date: new Date().toISOString().slice(0, 10),
        used: 0,
        limit: getCopilotDailyLimit(entitlement.tier),
        remaining: getCopilotDailyLimit(entitlement.tier),
        blocked: false,
        resetAt: null,
        cooldownUntil: null,
        cooldownSecondsRemaining: null,
      }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1600px] px-6 pb-14 pt-28 md:pt-32">
        {billingParam === "success" ? (
          <p className="mb-4 text-sm text-emerald-600">Subscription activated. Your new tier is syncing now.</p>
        ) : null}
        <ChatInterface
          id={sessionId || undefined}
          initialLimit={usage.limit}
          initialRemaining={usage.remaining}
          initialBlocked={usage.blocked}
          initialCooldownSecondsRemaining={usage.cooldownSecondsRemaining}
        />
      </div>
    </main>
  )
}
