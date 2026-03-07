"use client"

import { useSyncExternalStore } from "react"

export type MessageRole = "user" | "assistant" | "system"

export interface DataCard {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "flat"
  trendValue?: string
}

export interface SmartChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  suggestions?: string[]
  dataCards?: DataCard[]
}

export interface SmartChatState {
  messages: SmartChatMessage[]
  isOpen: boolean
  isMinimized: boolean
  isTyping: boolean
}

const STORAGE_KEY = "entrestate.smart-chat.v1"

let state: SmartChatState = {
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
    const parsed = JSON.parse(raw) as Partial<SmartChatState>
    if (Array.isArray(parsed.messages)) {
      state = {
        messages: parsed.messages as SmartChatMessage[],
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

const setState = (partial: Partial<SmartChatState>) => {
  state = { ...state, ...partial }
  persist()
  notify()
}

export const setSmartChatState = (partial: Partial<SmartChatState>) => {
  setState(partial)
}

export const setSmartChatMessages = (
  updater: SmartChatMessage[] | ((messages: SmartChatMessage[]) => SmartChatMessage[]),
) => {
  const nextMessages = typeof updater === "function" ? updater(state.messages) : updater
  setState({ messages: nextMessages })
}

export const useSmartChatStore = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    ...snapshot,
    setSmartChatState,
    setSmartChatMessages,
  }
}

async function fetchChatResponse(
  query: string,
  context?: { city?: string; area?: string },
): Promise<{ content: string; dataCards?: DataCard[]; suggestions?: string[] }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  return res.json()
}

export async function sendSmartChatMessage(options: {
  query: string
  quickSuggestions: string[]
  context?: { city?: string; area?: string }
}) {
  const trimmed = options.query.trim()
  if (!trimmed) return

  const userMessage: SmartChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
  }

  setSmartChatMessages((prev) => [...prev, userMessage])
  setSmartChatState({ isOpen: true, isMinimized: false, isTyping: true })

  try {
    const response = await fetchChatResponse(trimmed, options.context)
    const assistantMessage: SmartChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      dataCards: response.dataCards,
      suggestions: response.suggestions ?? options.quickSuggestions.slice(0, 3),
    }
    setSmartChatMessages((prev) => [...prev, assistantMessage])
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    const isLimitError = status === 429
    const assistantMessage: SmartChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: isLimitError
        ? "You have finished your daily limit for your current plan. Subscribe to continue: /pricing"
        : "I could not process this request right now. Please try again.",
      timestamp: new Date().toISOString(),
      suggestions: options.quickSuggestions.slice(0, 3),
    }
    setSmartChatMessages((prev) => [...prev, assistantMessage])
  } finally {
    setSmartChatState({ isTyping: false })
  }
}
