"use client"

import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useLocale } from "next-intl"
import { normalizeLocale } from "@/i18n/locale"

type ChatHelpers = ReturnType<typeof useChat>

type CopilotContextValue = ChatHelpers & {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

export function CopilotProvider({ children, initialId }: { children: ReactNode; initialId?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const locale = normalizeLocale(useLocale())

  // Memoize transport so it's not recreated on every render.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/copilot",
        body: initialId != null ? { id: initialId } : {},
        headers: {
          "x-entrestate-locale": locale,
        },
      }),
    [initialId, locale],
  )

  // Only include `id` when it's defined — passing `id: undefined` triggers
  // shouldRecreateChat in @ai-sdk/react on every render, resetting the chat.
  const chatHelpers = useChat({
    ...(initialId != null ? { id: initialId } : {}),
    transport,
    onError: (error) => {
      console.error("Copilot error:", error)
    },
  })

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])
  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

  return (
    <CopilotContext.Provider
      value={{
        ...chatHelpers,
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </CopilotContext.Provider>
  )
}

export function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error("useCopilot must be used within a CopilotProvider")
  }
  return context
}
