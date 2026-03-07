"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Building2,
  TrendingUp,
  MapPin,
  Search,
  Sparkles,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import {
  sendSmartChatMessage,
  useSmartChatStore,
  type SmartChatMessage,
} from "@/lib/smart-chat-store"

const routeSuggestions: { matcher: (path: string) => boolean; suggestions: string[] }[] = [
  {
    matcher: (path) => path.startsWith("/markets"),
    suggestions: [
      "Best yield under AED 2M in Dubai",
      "Compare Marina vs JBR for 2BR",
      "Projects delivering in 2025 with proven demand",
      "Studios under AED 800K in Business Bay",
    ],
  },
  {
    matcher: (path) => path.startsWith("/market-score"),
    suggestions: [
      "Show conservative-ready inventory mix",
      "Highest safety band areas in Dubai",
      "Which assets are Capital Safe under AED 2M?",
      "Average score by status band",
    ],
  },
  {
    matcher: (path) => path.startsWith("/agent-runtime"),
    suggestions: [
      "Balanced 1-2yr under AED 2M",
      "Ready inventory for conservative buyers",
      "2BR investment options in Marina",
      "Best liquidity projects under AED 3M",
    ],
  },
  {
    matcher: (path) => path.startsWith("/workspace/data-scientist"),
    suggestions: [
      "Top 10 areas by liquidity this quarter",
      "Average price by status band",
      "Which developers lead on delivery?",
      "Rental vs transaction trend in Dubai",
    ],
  },
  {
    matcher: (path) => path.startsWith("/workspace/daas"),
    suggestions: [
      "What data fields are included in the export?",
      "Show market coverage by city",
      "Explain how updates are delivered",
    ],
  },
  {
    matcher: (path) => path.startsWith("/agents"),
    suggestions: [
      "Create a project marketing video",
      "Storyboard a 60-second launch narrative",
      "Build social image pack for Dubai Marina",
    ],
  },
]

const defaultSuggestions = [
  "Apartments with large balconies in Dubai Marina",
  "Price trends in Downtown Dubai last 6 months",
  "Compare JBR vs Palm Jumeirah 2BR units",
  "Available studios under AED 800K in Business Bay",
  "Which areas in Abu Dhabi are rising fastest?",
]

function buildWelcomeMessage(suggestions: string[]): SmartChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to the Entrestate market desk. I can help you explore areas, price behavior, unit availability, and comparisons. What would you like to study?",
    timestamp: new Date().toISOString(),
    suggestions: suggestions.slice(0, 3),
  }
}

export function SmartChat() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isExplorer = pathname.startsWith("/markets")
  const hideSmartChat =
    isExplorer ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/copilot") ||
    pathname.startsWith("/top-data") ||
    pathname.startsWith("/workspace/data-scientist") ||
    pathname.startsWith("/apps/lead-agent")
  const quickQueries = useMemo(() => {
    const match = routeSuggestions.find((item) => item.matcher(pathname))
    return match?.suggestions ?? defaultSuggestions
  }, [pathname])

  const {
    messages,
    isOpen,
    isMinimized,
    isTyping,
    setSmartChatState,
    setSmartChatMessages,
  } = useSmartChatStore()

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasConversation = messages.some((msg) => msg.role === "user")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const nextOffset = !hideSmartChat && isOpen && !isMinimized ? "460px" : "0px"
    document.documentElement.style.setProperty("--chat-offset", nextOffset)
    return () => {
      document.documentElement.style.setProperty("--chat-offset", "0px")
    }
  }, [hideSmartChat, isOpen, isMinimized])

  useEffect(() => {
    if (messages.length === 0) {
      setSmartChatMessages([buildWelcomeMessage(quickQueries)])
    }
  }, [messages.length, quickQueries, setSmartChatMessages])

  useEffect(() => {
    if (messages.length === 1 && messages[0]?.id === "welcome") {
      const nextSuggestions = quickQueries.slice(0, 3)
      const currentSuggestions = messages[0].suggestions ?? []
      const shouldUpdate = currentSuggestions.join("|") !== nextSuggestions.join("|")
      if (shouldUpdate) {
        setSmartChatMessages([{ ...messages[0], suggestions: nextSuggestions }])
      }
    }
  }, [messages, quickQueries, setSmartChatMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])


  const handleSend = (text?: string) => {
    const query = text || input.trim()
    if (!query) return
    setInput("")
    void sendSmartChatMessage({ query, quickSuggestions: quickQueries })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const launcherPosition = isExplorer
    ? "fixed right-4 top-1/2 -translate-y-1/2"
    : "fixed bottom-6 right-6"

  if (!mounted || hideSmartChat) {
    return null
  }

  if (!isOpen) {
    if (isExplorer && !hasConversation) {
      return null
    }
    return (
      <button
        onClick={() => setSmartChatState({ isOpen: true, isMinimized: false })}
        className={`${launcherPosition} z-50 flex items-center gap-2.5 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
        aria-label="Open market chat"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Market Intelligence</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-subtle" />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <div className={`${launcherPosition} z-50`}>
        <button
          onClick={() => setSmartChatState({ isMinimized: false })}
          className="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle" />
          <span className="text-sm font-medium text-foreground">Market Chat</span>
          <span className="text-xs text-muted-foreground">{Math.max(messages.length - 1, 0)} messages</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed right-0 top-[var(--app-header-height)] z-50 flex h-[calc(100vh-var(--app-header-height))] w-full max-w-[460px] flex-col bg-card border-l border-border shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Market Intelligence</h3>
            <p className="text-xs text-muted-foreground">UAE real estate data</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSmartChatState({ isMinimized: true })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            aria-label="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSmartChatState({ isOpen: false, isMinimized: false })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[90%]">
              {msg.role === "user" ? (
                <div className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg rounded-br-sm">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-secondary rounded-lg rounded-bl-sm">
                    <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Data Cards */}
                  {msg.dataCards && msg.dataCards.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {msg.dataCards.map((card, i) => (
                        <div
                          key={i}
                          className="px-3 py-2.5 bg-background border border-border rounded-md hover:border-accent/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {card.type === "stat" && <BarChart3 className="w-3 h-3 text-accent" />}
                            {card.type === "area" && <MapPin className="w-3 h-3 text-accent" />}
                            {card.type === "project" && <Building2 className="w-3 h-3 text-accent" />}
                            <span className="text-xs text-muted-foreground truncate">{card.title}</span>
                          </div>
                          <p className="text-sm font-mono font-medium text-foreground">{card.value}</p>
                          {card.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
                          )}
                          {card.trend && card.trendValue && (
                            <div className="flex items-center gap-1 mt-1">
                              <TrendingUp
                                className={`w-3 h-3 ${
                                  card.trend === "up"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : card.trend === "down"
                                      ? "text-red-600 dark:text-red-400 rotate-180"
                                      : "text-muted-foreground"
                                }`}
                              />
                              <span className="text-xs text-muted-foreground">{card.trendValue}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground bg-background border border-border rounded-md hover:border-accent/40 hover:text-foreground transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 bg-secondary rounded-lg rounded-bl-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">Querying market data...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Queries (shown when few messages) */}
      {messages.length <= 1 && (
        <div className="px-5 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-secondary border border-border rounded-md hover:text-foreground hover:border-accent/30 transition-colors"
              >
                <ArrowUpRight className="w-3 h-3 text-accent" />
                <span className="truncate max-w-[200px]">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about UAE markets, areas, prices..."
            className="flex-1 px-3 py-2.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Connected to live UAE inventory feeds
        </p>
      </div>
    </div>
  )
}
