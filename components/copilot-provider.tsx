"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { useChat, type UseChatHelpers } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

type CopilotContextValue = UseChatHelpers<any> & {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

export function CopilotProvider({ children, initialId }: { children: ReactNode; initialId?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Initialize the global chat instance
  const chatHelpers = useChat({
    id: initialId,
    transport: new DefaultChatTransport({
      api: "/api/copilot",
      body: { id: initialId },
    }),
    onError: (error) => {
      console.error("Copilot error:", error)
    },
  })

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

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
