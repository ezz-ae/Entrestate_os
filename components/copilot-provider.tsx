"use client"

import { createContext, useContext, ReactNode, useState } from "react"
import { useChat, type Message } from "@ai-sdk/react"

// Manually define the context value type for stability
type CopilotContextValue = {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  append: (message: Message | Omit<Message, "id">) => Promise<string | null | undefined>
  isLoading: boolean
  status: "idle" | "streaming" | "submitted" | "ready"
  error: Error | undefined
  id: string | undefined
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

export function CopilotProvider({ children, initialId }: { children: ReactNode; initialId?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Initialize the global chat instance
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    append,
    isLoading, 
    status, 
    error, 
    id 
  } = useChat({
    id: initialId,
    api: "/api/copilot",
    body: { id: initialId }, // Pass the session ID to the backend
    onError: (error) => {
      console.error("Copilot Provider Error:", error)
    },
  })

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <CopilotContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        append,
        isLoading,
        status,
        error,
        id,
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
