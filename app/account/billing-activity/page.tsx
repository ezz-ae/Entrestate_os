import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  countBillingEventsByAccountKey,
  listBillingEventsByAccountKey,
  listBillingEventTypesByAccountKey,
  type BillingActivityEvent,
} from "@/lib/billing-entitlements"

const PAGE_SIZE = 20

function toSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function formatEventType(eventType: string | null) {
  if (!eventType) return "Unknown event"
  return eventType.replaceAll("_", " ").toLowerCase()
}

function getEventSummary(event: BillingActivityEvent) {
  if (!event.payload || typeof event.payload !== "object") return "No additional metadata"

  const payload = event.payload as Record<string, unknown>
  const status = typeof payload.subscription_status === "string" ? payload.subscription_status : null
  const tier = typeof payload.tier === "string" ? payload.tier : null
  const action = typeof payload.action === "string" ? payload.action : null

  if (action && status && tier) return `${action} · ${status} · tier ${tier}`
  if (status && tier) return `Status ${status} · tier ${tier}`
  if (status) return `Status ${status}`
  if (tier) return `Tier ${tier}`
  if (action) return `Action ${action}`

  return "No additional metadata"
}

function buildActivityHref(page: number, eventType: string | null) {
  const params = new URLSearchParams()
  params.set("page", String(page))
  if (eventType) params.set("event_type", eventType)
  return `/account/billing-activity?${params.toString()}`
}

export default async function BillingActivityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const requestedEventType = toSingleQueryValue(params.event_type)?.trim() || null
  const requestedPage = parsePage(toSingleQueryValue(params.page))

  const entitlement = await getCurrentEntitlement()

  const accountKey = entitlement.accountKey

  const [eventTypes, totalCount] = accountKey
    ? await Promise.all([
        listBillingEventTypesByAccountKey(accountKey, 50),
        countBillingEventsByAccountKey(accountKey, requestedEventType),
      ])
    : [[], 0]

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * PAGE_SIZE

  const events = accountKey
    ? await listBillingEventsByAccountKey(accountKey, {
        limit: PAGE_SIZE,
        offset,
        eventType: requestedEventType,
      })
    : []

  const activeFilter = requestedEventType

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to account
          </Link>
          <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Billing</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Billing activity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Audit PayPal webhooks and manual billing actions for this account.
          </p>
        </header>

        {!accountKey ? (
          <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
            <p className="text-sm text-muted-foreground">Sign in to view billing activity.</p>
          </section>
        ) : (
          <>
            <section className="mb-4 rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={activeFilter ? "outline" : "default"} size="sm" asChild>
                  <Link href={buildActivityHref(1, null)}>All events</Link>
                </Button>
                {eventTypes.map((eventType) => (
                  <Button
                    key={eventType}
                    variant={activeFilter === eventType ? "default" : "outline"}
                    size="sm"
                    asChild
                  >
                    <Link href={buildActivityHref(1, eventType)}>{formatEventType(eventType)}</Link>
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Showing {events.length} of {totalCount} events · Page {page} of {totalPages}
              </p>
            </section>

            <section className="space-y-3">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
                  No billing events found for this filter.
                </div>
              ) : (
                events.map((event) => (
                  <article key={event.event_id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatEventType(event.event_type)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.received_at}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{getEventSummary(event)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Event ID: {event.event_id}</p>
                    {event.subscription_id ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">Subscription ID: {event.subscription_id}</p>
                    ) : null}
                  </article>
                ))
              )}
            </section>

            <section className="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildActivityHref(page - 1, activeFilter)}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">Page {page} / {totalPages}</p>

              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={buildActivityHref(page + 1, activeFilter)}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </section>
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}
