"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Props = {
  tier: "free" | "pro" | "team" | "institutional"
  subscriptionId: string | null
  status: string | null
}

function statusLabel(value: string | null) {
  if (!value) return "unknown"
  return value.replaceAll("_", " ").toLowerCase()
}

export function AccountBillingControls({ tier, subscriptionId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusUpper = status?.toUpperCase() ?? null

  const runAction = (url: string, successMessage: string, method: "GET" | "POST" = "POST") => {
    setError(null)
    setFeedback(null)

    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        })

        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        if (!response.ok) {
          setError(payload.error ?? "Billing action failed")
          return
        }

        setFeedback(successMessage)
        router.refresh()
      } catch {
        setError("Billing action failed")
      }
    })
  }

  return (
    <div className="mt-4 space-y-3">
      {subscriptionId ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => runAction("/api/billing/paypal/subscription", "Subscription synced with PayPal.", "GET")}
          >
            Sync status
          </Button>

          {(statusUpper === "ACTIVE" || statusUpper === "APPROVAL_PENDING" || statusUpper === "APPROVED") && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => runAction("/api/billing/paypal/manage/cancel", "Subscription cancelled.")}
            >
              Cancel subscription
            </Button>
          )}

          {statusUpper === "SUSPENDED" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runAction("/api/billing/paypal/manage/activate", "Subscription reactivated.")}
            >
              Reactivate subscription
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Change plan</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href="/pricing">Upgrade with PayPal</Link>
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Current tier: <span className="font-medium text-foreground">{tier}</span> · Status: {statusLabel(status)}
      </p>

      {feedback ? <p className="text-xs text-emerald-600">{feedback}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
