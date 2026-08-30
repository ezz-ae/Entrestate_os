"use client"

import { useSyncExternalStore } from "react"

function resolveChatLocaleHeader(): "en" | "ar" {
  if (typeof document === "undefined") return "en"
  const lang = document.documentElement.lang
  if (!lang) return "en"
  return lang.startsWith("ar") ? "ar" : "en"
}

export type ExplorerMessageRole = "user" | "assistant" | "system"

export interface ExplorerDataCard {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "flat"
  trendValue?: string
}

export interface ExplorerDldNotification {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

export interface ExplorerChatStep {
  id: string
  label: string
  status: "running" | "done"
  detail?: string | null
}

export interface ExplorerChatMessage {
  id: string
  role: ExplorerMessageRole
  content: string
  timestamp: string
  suggestions?: string[]
  dataCards?: ExplorerDataCard[]
  notifications?: ExplorerDldNotification[]
  /** The narrated work — "جاري البحث… تم إدراج ٤ مشاريع" — kept after the
   * answer lands so the person can reopen how it was reached. */
  steps?: ExplorerChatStep[]
  /** True while this assistant message is still being produced. */
  streaming?: boolean
}

export interface ExplorerChatState {
  messages: ExplorerChatMessage[]
  isOpen: boolean
  isMinimized: boolean
  isTyping: boolean
}

const STORAGE_KEY = "entrestate.explorer-chat.v1"

let state: ExplorerChatState = {
  messages: [],
  isOpen: false,
  isMinimized: false,
  isTyping: false,
}

let hydrated = false
const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const persist = () => {
  if (typeof window === "undefined") return
  const payload = {
    messages: state.messages,
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<ExplorerChatState>
    if (Array.isArray(parsed.messages)) {
      state = {
        messages: parsed.messages as ExplorerChatMessage[],
        isOpen: Boolean(parsed.isOpen),
        isMinimized: Boolean(parsed.isMinimized),
        isTyping: false,
      }
    }
  } catch {
    // ignore storage errors
  }
}

const getSnapshot = () => {
  hydrate()
  return state
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const setState = (partial: Partial<ExplorerChatState>) => {
  state = { ...state, ...partial }
  persist()
  notify()
}

export const setExplorerChatState = (partial: Partial<ExplorerChatState>) => {
  setState(partial)
}

export const setExplorerChatMessages = (
  updater: ExplorerChatMessage[] | ((messages: ExplorerChatMessage[]) => ExplorerChatMessage[]),
) => {
  const nextMessages = typeof updater === "function" ? updater(state.messages) : updater
  setState({ messages: nextMessages })
}

export const useExplorerChatStore = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    ...snapshot,
    setExplorerChatState,
    setExplorerChatMessages,
  }
}

type ExplorerFinalPayload = {
  content: string
  dataCards?: ExplorerDataCard[]
  notifications?: ExplorerDldNotification[]
  suggestions?: string[]
}

/**
 * THE CHAT NARRATES ITS WORK. The old transport was one JSON round trip: the
 * person asked, watched three dots for ten seconds, and received a wall. The
 * owner's spec is the opposite — say what you are doing while you do it
 * ("جاري البحث في المخزون… تم إدراج ٤ من المشاريع للتحليل…"), each step
 * expandable, then a written answer. The route streams NDJSON events when
 * asked with x-chat-stream: 1; this reader applies them to the placeholder
 * message as they arrive. If the server answers with plain JSON instead — an
 * old deployment, a proxy that buffered the stream away — the same code path
 * degrades to exactly the previous behaviour, so the chat can never be more
 * broken than it was.
 */
async function streamChatResponse(
  query: string,
  context: { city?: string; area?: string } | undefined,
  apply: (patch: {
    step?: { id: string; label: string; detail?: string | null; done: boolean }
    delta?: string
    final?: ExplorerFinalPayload
  }) => void,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-entrestate-locale": resolveChatLocaleHeader(),
      "x-chat-stream": "1",
    },
    body: JSON.stringify({ message: query, context }),
  })

  if (!res.ok) {
    let errorMessage = "Chat request failed"
    try {
      const payload = (await res.json()) as { error?: string }
      if (typeof payload.error === "string" && payload.error.trim().length > 0) {
        errorMessage = payload.error
      }
    } catch {
      // ignore parse errors
    }
    const error = new Error(errorMessage) as Error & { status?: number }
    error.status = res.status
    throw error
  }

  const contentType = res.headers.get("content-type") ?? ""

  if (!contentType.includes("x-ndjson") || !res.body) {
    // Legacy JSON — one shot, same shape as before.
    const payload = (await res.json()) as ExplorerFinalPayload
    apply({ final: payload })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let sawFinal = false

  const handleLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let event: Record<string, unknown>
    try {
      event = JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      return
    }
    if (event.type === "step" && typeof event.id === "string" && typeof event.label === "string") {
      apply({ step: { id: event.id, label: event.label, done: false } })
    } else if (event.type === "step-done" && typeof event.id === "string") {
      apply({
        step: {
          id: event.id,
          label: typeof event.label === "string" ? event.label : "",
          detail: typeof event.detail === "string" ? event.detail : null,
          done: true,
        },
      })
    } else if (event.type === "delta" && typeof event.text === "string") {
      apply({ delta: event.text })
    } else if (event.type === "final") {
      sawFinal = true
      apply({ final: event as unknown as ExplorerFinalPayload })
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    for (;;) {
      const newline = buffer.indexOf("\n")
      if (newline === -1) break
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      handleLine(line)
    }
  }
  if (buffer.trim()) handleLine(buffer)

  if (!sawFinal) {
    throw new Error("The stream ended without an answer.")
  }
}

export async function sendExplorerChatMessage(options: {
  query: string
  quickSuggestions: string[]
  context?: { city?: string; area?: string }
}) {
  const trimmed = options.query.trim()
  if (!trimmed) return

  const userMessage: ExplorerChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
  }

  // The assistant message exists from the first moment, empty, so the person
  // watches the steps land in it instead of staring at three dots.
  const assistantId = `assistant-${Date.now()}`
  const placeholder: ExplorerChatMessage = {
    id: assistantId,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
    steps: [],
    streaming: true,
  }

  setExplorerChatMessages((prev) => [...prev, userMessage, placeholder])
  setExplorerChatState({ isOpen: true, isMinimized: false, isTyping: true })

  const patchAssistant = (patch: (message: ExplorerChatMessage) => ExplorerChatMessage) => {
    setExplorerChatMessages((prev) =>
      prev.map((message) => (message.id === assistantId ? patch(message) : message)),
    )
  }

  try {
    await streamChatResponse(trimmed, options.context, ({ step, delta, final }) => {
      if (step) {
        patchAssistant((message) => {
          const steps = [...(message.steps ?? [])]
          const index = steps.findIndex((entry) => entry.id === step.id)
          const next: ExplorerChatStep = {
            id: step.id,
            label: step.label || steps[index]?.label || "",
            status: step.done ? "done" : "running",
            detail: step.detail ?? steps[index]?.detail ?? null,
          }
          if (index === -1) steps.push(next)
          else steps[index] = next
          return { ...message, steps }
        })
      }
      if (delta) {
        patchAssistant((message) => ({ ...message, content: message.content + delta }))
      }
      if (final) {
        patchAssistant((message) => ({
          ...message,
          content: final.content || message.content,
          dataCards: final.dataCards,
          notifications: final.notifications,
          suggestions: final.suggestions ?? options.quickSuggestions.slice(0, 3),
          streaming: false,
          steps: (message.steps ?? []).map((entry) => ({ ...entry, status: "done" as const })),
        }))
      }
    })
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    const isLimitError = status === 429
    patchAssistant((message) => ({
      ...message,
      content: isLimitError
        ? "Free usage is cooling down. Try again shortly, or upgrade for uninterrupted access: /pricing"
        : "I could not process this request right now. Please try again.",
      suggestions: options.quickSuggestions.slice(0, 3),
      streaming: false,
      steps: (message.steps ?? []).map((entry) => ({ ...entry, status: "done" as const })),
    }))
  } finally {
    setExplorerChatState({ isTyping: false })
  }
}
