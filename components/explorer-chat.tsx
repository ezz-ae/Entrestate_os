"use client"

import { ChatMarkdown } from "@/components/chat-markdown"
import type React from "react"
import { useEffect, useRef, useState } from "react"
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
  Check,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react"
import {
  sendExplorerChatMessage,
  useExplorerChatStore,
  type ExplorerChatMessage,
  type ExplorerChatStep,
} from "@/lib/explorer-chat-store"
import { TransactionNotification } from "@/components/dld/transaction-notification"

const explorerSuggestions = [
  "Best yield under AED 2M in Dubai",
  "Compare Marina vs JBR for 2BR",
  "Projects delivering in 2025 with proven demand",
  "Studios under AED 800K in Business Bay",
  "Townhouses under AED 2M in Dubai Hills",
]

/**
 * THE WORK, NARRATED. While the assistant searches, the person reads what it
 * is doing — "جاري البحث في المخزون المصنّف… تم إدراج ٤ من المشاريع للتحليل" —
 * and any step opens to show its one-line human detail. This replaces the
 * silent spinner the owner rejected; nothing here ever prints a tool name,
 * a table, or a payload.
 */
function StepTimeline({ steps, streaming }: { steps: ExplorerChatStep[]; streaming?: boolean }) {
  const [openStep, setOpenStep] = useState<string | null>(null)
  if (steps.length === 0) return null

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <ol className="space-y-1.5">
        {steps.map((step) => {
          const expandable = Boolean(step.detail)
          const isOpen = openStep === step.id
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!expandable}
                onClick={() => setOpenStep(isOpen ? null : step.id)}
                className={`flex w-full items-center gap-2 text-left text-xs ${expandable ? "cursor-pointer" : "cursor-default"}`}
              >
                {step.status === "done" ? (
                  <Check className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-accent" />
                )}
                <span className={step.status === "done" ? "text-muted-foreground" : "text-foreground"}>
                  {step.label}
                </span>
                {expandable ? (
                  <ChevronDown
                    className={`ml-auto h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                ) : null}
              </button>
              {isOpen && step.detail ? (
                <p className="mt-1 pl-5 text-[11px] leading-relaxed text-muted-foreground">{step.detail}</p>
              ) : null}
            </li>
          )
        })}
        {streaming && steps.every((step) => step.status === "done") ? (
          <li className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            <span>…</span>
          </li>
        ) : null}
      </ol>
    </div>
  )
}

/**
 * The bubble shows the CONCLUSION; the organized statement opens as a report.
 * Splitting on the first blank line needs no protocol with the model — the
 * prompt asks for "conclusion first, then the detail", and whatever arrives,
 * the first paragraph is the most conclusion-like thing in it.
 */
function splitAnswer(content: string): { conclusion: string; report: string | null } {
  const trimmed = content.trim()
  const gap = trimmed.search(/\n\s*\n/)
  if (gap === -1) return { conclusion: trimmed, report: null }
  return { conclusion: trimmed.slice(0, gap).trim(), report: trimmed }
}

function ReportModal({
  content,
  isArabic,
  onClose,
}: {
  content: string
  isArabic: boolean
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">{isArabic ? "نتيجة البحث" : "Search result"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-foreground">
          <ChatMarkdown text={content} />
        </div>
      </div>
    </div>
  )
}

function buildWelcomeMessage(suggestions: string[]): ExplorerChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to Explorer. Ask about areas, price momentum, delivery windows, or yield comparisons and I will pull the live market facts.",
    timestamp: new Date().toISOString(),
    suggestions: suggestions.slice(0, 3),
  }
}

export function ExplorerChat() {
  const [mounted, setMounted] = useState(false)
  const {
    messages,
    isOpen,
    isMinimized,
    isTyping,
    setExplorerChatState,
    setExplorerChatMessages,
  } = useExplorerChatStore()

  const [input, setInput] = useState("")
  const [openReportId, setOpenReportId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasConversation = messages.some((msg) => msg.role === "user")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (messages.length === 0) {
      setExplorerChatMessages([buildWelcomeMessage(explorerSuggestions)])
    }
  }, [messages.length, setExplorerChatMessages])

  useEffect(() => {
    if (messages.length === 1 && messages[0]?.id === "welcome") {
      const nextSuggestions = explorerSuggestions.slice(0, 3)
      const currentSuggestions = messages[0].suggestions ?? []
      const shouldUpdate = currentSuggestions.join("|") !== nextSuggestions.join("|")
      if (shouldUpdate) {
        setExplorerChatMessages([{ ...messages[0], suggestions: nextSuggestions }])
      }
    }
  }, [messages, setExplorerChatMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (typeof document === "undefined") return
    const nextOffset = isOpen && !isMinimized ? "460px" : "0px"
    document.documentElement.style.setProperty("--chat-offset", nextOffset)
    return () => {
      document.documentElement.style.setProperty("--chat-offset", "0px")
    }
  }, [isOpen, isMinimized])

  const handleSend = (text?: string) => {
    const query = text || input.trim()
    if (!query) return
    setInput("")
    void sendExplorerChatMessage({ query, quickSuggestions: explorerSuggestions })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mounted) {
    return null
  }

  if (!isOpen) {
    if (!hasConversation) {
      return null
    }
    return (
      <button
        onClick={() => setExplorerChatState({ isOpen: true, isMinimized: false })}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        aria-label="Open Explorer chat"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Explorer Chat</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-subtle" />
      </button>
    )
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setExplorerChatState({ isMinimized: false })}
          className="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle" />
          <span className="text-sm font-medium text-foreground">Explorer Chat</span>
          <span className="text-xs text-muted-foreground">{Math.max(messages.length - 1, 0)} messages</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed right-0 top-[var(--app-header-height)] z-50 flex h-[calc(100vh-var(--app-header-height))] w-full max-w-[460px] flex-col bg-card border-l border-border shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Explorer Desk</h3>
            <p className="text-xs text-muted-foreground">Live UAE market facts</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExplorerChatState({ isMinimized: true })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            aria-label="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExplorerChatState({ isOpen: false, isMinimized: false })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

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
                  {msg.steps && msg.steps.length > 0 ? (
                    <StepTimeline steps={msg.steps} streaming={msg.streaming} />
                  ) : null}

                  {msg.streaming && !msg.content && (!msg.steps || msg.steps.length === 0) ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-lg rounded-bl-sm text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      <span>…</span>
                    </div>
                  ) : null}

                  {msg.content ? (() => {
                    const isArabicAnswer = /[\u0600-\u06FF]/.test(msg.content)
                    const { conclusion, report } = splitAnswer(msg.content)
                    return (
                      <div className="px-4 py-3 bg-secondary rounded-lg rounded-bl-sm text-foreground" dir={isArabicAnswer ? "rtl" : "ltr"}>
                        {/* While streaming the whole text runs in the bubble;
                            once final, the bubble keeps the conclusion and the
                            organized statement opens as a report. */}
                        <ChatMarkdown text={msg.streaming ? msg.content : conclusion} />
                        {!msg.streaming && report ? (
                          <button
                            type="button"
                            onClick={() => setOpenReportId(msg.id)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {isArabicAnswer ? "عرض التقرير الكامل" : "View the full report"}
                          </button>
                        ) : null}
                      </div>
                    )
                  })() : null}

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

                  {msg.notifications && msg.notifications.length > 0 && (
                    <div className="space-y-2">
                      {msg.notifications.map((txn, index) => (
                        <TransactionNotification key={`${msg.id}-txn-${index}-${txn.headline}`} txn={txn} />
                      ))}
                    </div>
                  )}

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

      {openReportId ? (() => {
        const message = messages.find((entry) => entry.id === openReportId)
        if (!message?.content) return null
        return (
          <ReportModal
            content={message.content}
            isArabic={/[\u0600-\u06FF]/.test(message.content)}
            onClose={() => setOpenReportId(null)}
          />
        )
      })() : null}

      {messages.length <= 1 && (
        <div className="px-5 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {explorerSuggestions.map((q, i) => (
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

      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about areas, prices, yield, or delivery"
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
