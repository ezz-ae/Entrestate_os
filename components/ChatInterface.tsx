"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type EvidenceItem = {
  id: string
  toolName: string
  args: unknown
  result: unknown
  state: string
}

type ChatInterfaceProps = {
  initialTier?: "free" | "pro" | "team" | "institutional"
  initialDailyLimit?: number | null
  initialUsedToday?: number
  initialRemaining?: number | null
}

function formatTierLabel(tier: ChatInterfaceProps["initialTier"]) {
  if (tier === "institutional") return "Institutional"
  if (tier === "team") return "Team"
  if (tier === "pro") return "Pro"
  return "Free"
}

function messageText(message: any): string {
  if (typeof message.content === "string") return message.content
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
  }
  return ""
}

function extractEvidence(message: any): EvidenceItem[] {
  const items: EvidenceItem[] = []

  if (Array.isArray(message.toolInvocations)) {
    for (const invocation of message.toolInvocations) {
      items.push({
        id: invocation.toolCallId ?? crypto.randomUUID(),
        toolName: invocation.toolName ?? "unknown_tool",
        args: invocation.args,
        result: invocation.result,
        state: invocation.state ?? "result",
      })
    }
  }

  if (Array.isArray(message.parts)) {
    for (const part of message.parts) {
      if (typeof part.type !== "string") continue
      const isStaticToolPart = part.type.startsWith("tool-")
      const isDynamicToolPart = part.type === "dynamic-tool"
      if (!isStaticToolPart && !isDynamicToolPart) continue
      items.push({
        id: part.toolCallId ?? crypto.randomUUID(),
        toolName: isStaticToolPart ? part.type.replace("tool-", "") : (part.toolName ?? "dynamic-tool"),
        args: part.input,
        result: part.output,
        state: part.state ?? "result",
      })
    }
  }

  return items
}

function formatEvidenceLabel(toolName: string) {
  if (toolName === "deal_screener") return "Deal Screener"
  if (toolName === "price_reality_check") return "Price Reality Check"
  if (toolName === "area_risk_brief") return "Area Risk Brief"
  if (toolName === "developer_due_diligence") return "Developer Due Diligence"
  if (toolName === "generate_investor_memo") return "Investor Memo"
  return "Analysis Step"
}

export function ChatInterface({
  initialTier = "free",
  initialDailyLimit = 3,
  initialUsedToday = 0,
  initialRemaining = 3,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [tier, setTier] = useState<"free" | "pro" | "team" | "institutional">(initialTier)
  const [dailyLimit, setDailyLimit] = useState<number | null>(initialDailyLimit)
  const [usedToday, setUsedToday] = useState(initialUsedToday)
  const [remaining, setRemaining] = useState<number | null>(initialRemaining)
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/copilot",
    }),
  })

  useEffect(() => {
    let cancelled = false

    const loadUsage = async () => {
      try {
        const response = await fetch("/api/account/chat-usage", { cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as {
          tier?: "free" | "pro" | "team" | "institutional"
          usage?: { limit?: number | null; used?: number; remaining?: number | null }
        }
        if (cancelled) return
        if (payload.tier) setTier(payload.tier)
        if (payload.usage) {
          setDailyLimit(payload.usage.limit ?? null)
          setUsedToday(payload.usage.used ?? 0)
          setRemaining(payload.usage.remaining ?? null)
        }
      } catch {
        // No-op: keep server-rendered defaults.
      }
    }

    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [])

  const chatBlocked = dailyLimit !== null && (remaining ?? 0) <= 0

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value || status !== "ready" || chatBlocked) return
    await sendMessage({ text: value })

    if (dailyLimit !== null) {
      setUsedToday((prev) => prev + 1)
      setRemaining((prev) => {
        const current = prev ?? dailyLimit
        return Math.max(current - 1, 0)
      })
    }

    setInput("")
  }

  const evidenceItems = useMemo(() => {
    const all = (messages as any[]).flatMap((message) => extractEvidence(message))
    return all.reverse()
  }, [messages])

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Decision Tunnel</h2>
          <span className="text-xs text-muted-foreground">{status === "streaming" ? "Live" : "Ready"}</span>
        </div>

        <div className="mb-4 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <p>
            Tier: <span className="font-semibold text-foreground">{formatTierLabel(tier)}</span>
          </p>
          <p className="mt-1">
            {dailyLimit === null
              ? "Usage: Unlimited Decision Tunnel sessions."
              : `Usage: ${usedToday}/${dailyLimit} sessions used today (${remaining ?? 0} remaining).`}
          </p>
        </div>

        <div className="space-y-3">
          {(messages as any[]).map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "ml-auto w-fit max-w-[90%]" : "mr-auto w-fit max-w-[90%]"}
            >
              <div
                className={
                  message.role === "user"
                    ? "rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                }
              >
                {messageText(message) || "..."}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submitMessage} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for project screening, price reality, area risk, or a full memo"
          />
          <Button type="submit" disabled={status !== "ready" || input.trim().length === 0 || chatBlocked}>
            Send
          </Button>
        </form>

        {chatBlocked ? (
          <p className="mt-3 text-sm text-amber-600">
            Free plan daily limit reached. Upgrade to Pro for unlimited decision sessions.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-500">{error.message}</p> : null}
      </section>

      <aside className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Evidence Drawer</h3>
          <span className="text-xs text-muted-foreground">{evidenceItems.length} analysis steps</span>
        </div>

        <div className="space-y-2">
          {evidenceItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Evidence appears here after your first query.</p>
          ) : (
            evidenceItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/60 bg-background/70 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatEvidenceLabel(item.toolName)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Step: {item.state}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-foreground">Inputs</summary>
                  <pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">
                    {JSON.stringify(item.args ?? {}, null, 2)}
                  </pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-foreground">Evidence</summary>
                  <pre className="mt-1 max-h-48 overflow-auto text-xs text-muted-foreground">
                    {JSON.stringify(item.result ?? {}, null, 2)}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
