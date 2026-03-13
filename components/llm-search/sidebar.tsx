import React, { type FormEvent, type KeyboardEvent, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useCopilot } from "@/components/copilot-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Clock,
  Pin,
  BookOpen,
  LayoutGrid,
  Database,
  Bot,
  BarChart3,
  Send,
  Sparkles,
  MessageSquare,
  Menu,
  X,
} from "lucide-react"
import Image from "next/image"
import { UpgradeModal } from "./upgrade-modal"
import { authClient } from "@/lib/auth/client"

function getMessageText(message: any): string {
  if (typeof message?.content === "string") {
    return message.content
  }

  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim()
  }

  return ""
}

// ── Inline markdown renderer ─────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-background/80 px-1 py-0.5 text-[11px] font-mono text-primary/90 border border-border/40">{part.slice(1, -1)}</code>
    if (part.startsWith("~~") && part.endsWith("~~"))
      return <s key={i} className="text-muted-foreground">{part.slice(2, -2)}</s>
    return part
  })
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-lg bg-background/80 border border-border/60 p-3 text-[11px] font-mono text-foreground/90 leading-relaxed">
          <code>{codeLines.join("\n")}</code>
        </pre>
      )
      i++
      continue
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) { elements.push(<p key={key++} className="mt-3 mb-0.5 text-sm font-semibold text-foreground/90">{inlineFormat(h3[1])}</p>); i++; continue }
    if (h2) { elements.push(<p key={key++} className="mt-3 mb-1 text-sm font-bold text-foreground">{inlineFormat(h2[1])}</p>); i++; continue }
    if (h1) { elements.push(<p key={key++} className="mt-3 mb-1 text-base font-bold text-foreground">{inlineFormat(h1[1])}</p>); i++; continue }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      elements.push(<hr key={key++} className="my-2 border-border/50" />)
      i++
      continue
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
      }
      elements.push(
        <ul key={key++} className="my-1.5 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-primary mt-1 shrink-0 text-[10px]">▸</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol key={key++} className="my-1.5 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-primary/60 shrink-0 font-mono text-[11px] mt-0.5 w-4 text-right">{idx + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <div key={key++} className="my-1.5 border-l-2 border-primary/40 pl-3 italic text-sm text-muted-foreground leading-relaxed">
          {inlineFormat(line.slice(2))}
        </div>
      )
      i++
      continue
    }

    // Empty line
    if (line.trim() === "") { i++; continue }

    // Paragraph
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">{inlineFormat(line)}</p>
    )
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isUser = message.role === "user"
  const content = getMessageText(message)
  const isLong = isUser && content.length > 300

  return (
    <div
      className={`flex items-start gap-2.5 animate-in slide-in-from-bottom-2 fade-in-0 duration-300 ${
        isUser ? "justify-end" : ""
      }`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={`relative max-w-[88%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm text-sm"
            : "bg-muted/50 text-foreground rounded-tl-sm border border-border/40"
        }`}
      >
        {isUser ? (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {isLong && !isExpanded ? `${content.substring(0, 300)}…` : content}
            </p>
            {isLong && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-[11px] text-primary-foreground/70 hover:text-primary-foreground underline-offset-2 hover:underline"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <MarkdownContent content={content} />
        )}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-foreground mt-0.5">
          <UserIcon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  )
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

export function LlmSidebar({ authenticated = true }: { authenticated?: boolean }) {
  const { messages, sendMessage, clearError, status, error, stop, isSidebarOpen, closeSidebar, toggleSidebar, id: currentId, openSidebar } = useCopilot()
  const [input, setInput] = useState("")
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [pinnedPanel, setPinnedPanel] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialPromptRef = useRef<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasOpenChatQuery = searchParams?.get("openChat") === "true"
  const querySessionId = searchParams?.get("id")
  const promptParam = searchParams?.get("prompt") ?? searchParams?.get("q")
  const { data: session } = authClient.useSession()

  const user = session?.user
  const displayName = user?.name || user?.email || "Entrestate Member"
  const displayEmail = user?.email || "account@entrestate.com"
  const avatar = user?.image || "/avatars/avatar-01.svg"

  const workspaceLinks = [
    { label: "Notebook", href: "/notebook", icon: BookOpen, description: "Decision notebooks" },
    { label: "Data Dashboard", href: "/dashboard", icon: LayoutGrid, description: "KPIs and activity" },
    { label: "Data Science Dashboard", href: "/workspace/data-scientist", icon: Database, description: "EDA + modeling" },
    { label: "Market Data", href: "/top-data", icon: BarChart3, description: "Signals + timing" },
    { label: "Agent Builder", href: "/apps/agent-builder", icon: Bot, description: "Automation builder" },
  ]

  // Handle auto-open and session loading from URL
  useEffect(() => {
    const shouldOpenFromQuery = hasOpenChatQuery || (querySessionId && querySessionId !== currentId)
    if (!shouldOpenFromQuery) {
      return
    }

    if (openPanel !== "chat") {
      setOpenPanel("chat")
    }

    if (!isSidebarOpen) {
      openSidebar()
    }
  }, [hasOpenChatQuery, querySessionId, currentId, openPanel, isSidebarOpen, openSidebar])

  // Load history from API
  useEffect(() => {
    if (openPanel === "history" || pinnedPanel === "history") {
      loadHistory()
    }
  }, [openPanel, pinnedPanel])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/copilot/sessions")
      if (res.ok) {
        const data = await res.json()
        setHistoryItems(data.sessions || [])
      }
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadSession = (sessionId: string) => {
    router.push(`/chat?id=${sessionId}`)
    openSidebar()
  }

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isSidebarOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isSidebarOpen])

  const handlePanelChange = (panel: string) => {
    setOpenPanel(panel)
    if (!isDesktopViewport) {
      setIsMobileMenuOpen(false)
      openSidebar()
    }
  }

  const handleCloseSidebar = () => {
    setIsMobileMenuOpen(false)
    closeSidebar()
    if (!isDesktopViewport) {
      setOpenPanel("chat")
      // Clear ?openChat and ?id from URL so the re-open effect doesn't fire again
      const url = new URL(window.location.href)
      url.searchParams.delete("openChat")
      url.searchParams.delete("id")
      url.searchParams.delete("prompt")
      url.searchParams.delete("q")
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""), { scroll: false })
    }
  }

  const handlePinToggle = (panel: string) => {
    if (pinnedPanel === panel) {
      setPinnedPanel(null)
      setOpenPanel(null)
    } else {
      setPinnedPanel(panel)
      setOpenPanel(panel)
    }
  }

  const isBusy = status === "submitted" || status === "streaming"

  const sendPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      return false
    }

    if (isBusy) {
      stop()
      await new Promise((resolve) => window.setTimeout(resolve, 80))
    }

    setLocalError(null)
    clearError()
    try {
      await sendMessage({ text: trimmedPrompt })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send message."
      setLocalError(message)
      return false
    }
  }

  useEffect(() => {
    if (!promptParam || !isDesktopViewport) {
      return
    }
    if (initialPromptRef.current === promptParam) {
      return
    }
    initialPromptRef.current = promptParam

    if (openPanel !== "chat") {
      setOpenPanel("chat")
    }

    if (!isSidebarOpen) {
      openSidebar()
    }

    setInput(promptParam)
    void sendPrompt(promptParam).then((sent) => {
      if (sent) {
        setInput("")
      }
    })
  }, [promptParam, isDesktopViewport, openPanel, isSidebarOpen, openSidebar, sendPrompt])

  const submitMessage = async (event?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLTextAreaElement>) => {
    event?.preventDefault()

    const submitted = await sendPrompt(input)
    if (submitted) {
      setInput("")
    }
  }

  // If the global sidebar is open, force the panel open.
  const effectiveOpenPanel = authenticated
    ? (isSidebarOpen ? (openPanel ?? "chat") : openPanel)
    : (isSidebarOpen ? openPanel ?? "chat" : null)
  const sidebarWidthClass = authenticated
    ? (effectiveOpenPanel ? "w-screen md:w-[420px]" : "w-[72px]")
    : "w-screen md:w-[420px]"

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")

    const syncDesktopState = () => {
      setIsDesktopViewport(mediaQuery.matches)
    }

    syncDesktopState()
    mediaQuery.addEventListener("change", syncDesktopState)

    return () => {
      mediaQuery.removeEventListener("change", syncDesktopState)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const leftOffset = isDesktopViewport && authenticated ? (effectiveOpenPanel ? 420 : 72) : 0

    root.style.setProperty("--copilot-left-offset", `${leftOffset}px`)

    return () => {
      root.style.setProperty("--copilot-left-offset", "0px")
    }
  }, [effectiveOpenPanel, isDesktopViewport])

  useEffect(() => {
    if (isDesktopViewport) {
      setIsMobileMenuOpen(false)
    }
  }, [isDesktopViewport])

  const sidebarContent = (
    <div
      className={`flex h-full bg-background transition-all duration-300 ease-in-out md:border-r md:border-border ${sidebarWidthClass}`}
      onMouseLeave={() => {
        if (!isDesktopViewport) {
          return
        }
        if (!pinnedPanel && !isSidebarOpen) {
          setOpenPanel(null)
        }
      }}
    >
      {/* Navigation Rail */}
      <div className={`${authenticated ? "hidden md:flex" : "hidden"} flex-col h-full w-[72px] shrink-0 items-center border-r border-border bg-card/50`}>
        <Button variant="ghost" size="icon" className="my-4 h-12 w-12 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center">
            <Image src="/icon.svg" alt="Entrestate" width={32} height={32} className="object-contain" />
          </div>
        </Button>

        <Button
          onClick={toggleSidebar}
          className={`group relative mb-6 h-12 w-12 shrink-0 rounded-xl transition-all ${
            isSidebarOpen ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
            Chat
          </span>
        </Button>

        <nav className="flex flex-1 flex-col gap-2 w-full px-2">
          <div className="group relative flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handlePanelChange("history")}
              onMouseEnter={() => !isSidebarOpen && handlePanelChange("history")}
              className={`h-12 w-12 shrink-0 transition-colors ${
                effectiveOpenPanel === "history" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Clock className="h-5 w-5" />
            </Button>
            <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
              History
            </span>
          </div>

          <div className="group relative flex justify-center">
            <Button
              variant="ghost"
              onClick={() => handlePanelChange("workspace")}
              onMouseEnter={() => !isSidebarOpen && handlePanelChange("workspace")}
              className={`h-12 w-12 shrink-0 transition-colors ${
                effectiveOpenPanel === "workspace" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
              Workspace
            </span>
          </div>
        </nav>

        <div className="flex flex-col gap-2 pb-4 items-center w-full px-2">
          <div className="group relative flex justify-center">
            <Link
              href="/account/profile"
              onClick={handleCloseSidebar}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border/60 bg-background"
            >
              <Image src={avatar} alt={displayName} width={36} height={36} className="object-cover" />
            </Link>
            <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
              Profile
            </span>
          </div>
        </div>
      </div>

      {/* Panel Content */}
      {effectiveOpenPanel && (
        <div className="flex flex-1 flex-col h-full bg-background min-w-0">
          
          {/* Chat Panel */}
          {effectiveOpenPanel === "chat" ? (
            <div className="flex flex-col h-full animate-in slide-in-from-left-5 duration-300">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  {!isDesktopViewport && authenticated ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                      aria-label="Toggle chat menu"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Chat</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8" onClick={handleCloseSidebar}>
                  <X className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </div>

              {!isDesktopViewport && authenticated ? (
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isMobileMenuOpen ? "max-h-64 border-b border-border" : "max-h-0"
                  }`}
                >
                  <div className="space-y-2 bg-card/30 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Workspace</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={effectiveOpenPanel === "chat" ? "default" : "secondary"}
                        onClick={() => handlePanelChange("chat")}
                        className="justify-start"
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                        Chat
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveOpenPanel === "history" ? "default" : "secondary"}
                        onClick={() => handlePanelChange("history")}
                        className="justify-start"
                      >
                        <Clock className="mr-1.5 h-4 w-4" />
                        History
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveOpenPanel === "workspace" ? "default" : "secondary"}
                        onClick={() => handlePanelChange("workspace")}
                        className="justify-start"
                      >
                        <LayoutGrid className="mr-1.5 h-4 w-4" />
                        Workspace
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {workspaceLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={handleCloseSidebar}
                          className="flex items-center justify-between rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs text-foreground hover:bg-accent/50"
                        >
                          <span className="flex items-center gap-2">
                            <link.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {link.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{link.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 -mt-8 animate-in fade-in-5 duration-500">
                    <div className="relative mb-5">
                      <div className="bg-primary/10 p-4 rounded-full shadow-inner">
                        <Sparkles className="h-7 w-7 text-primary" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
                    </div>
                    <p className="text-base font-semibold text-foreground tracking-tight">Decision Intelligence</p>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">Ask about any area, project, or developer in the UAE market.</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 w-full">
                      {[
                        { label: "Compare areas", prompt: "Compare the top performing areas in Dubai by yield and price appreciation. Which areas offer the best investment potential right now?" },
                        { label: "Screen deals", prompt: "Screen the best off-plan deals available now. I'm looking for projects with strong developer track record, good yield potential, and favorable payment plans." },
                        { label: "Market overview", prompt: "Give me a current overview of the Dubai real estate market — key trends, pricing momentum, and where the smart money is moving." },
                        { label: "Investment roadmap", prompt: "Help me build an investment roadmap for Dubai real estate. I want to understand the best entry strategy, areas to target, and expected returns." },
                      ].map(({ label, prompt }) => (
                        <button
                          key={label}
                          onClick={() => { void sendPrompt(prompt) }}
                          className="p-3 rounded-xl bg-muted/40 border border-border/50 text-left text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:border-border transition-all duration-150"
                        >
                          <span className="block font-medium text-foreground/80 mb-0.5">{label}</span>
                          <span className="text-[10px] text-muted-foreground/60 line-clamp-2">{prompt.substring(0, 55)}…</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
                    {isBusy && (
                      <div className="flex justify-start">
                        <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
                          <div className="flex gap-1.5 items-center">
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-card/20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {messages.length > 0 && messages[messages.length - 1].role !== "user" && !isBusy && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {["Tell me more", "What are the risks?", "Summarize", "Generate a report"].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => { void sendPrompt(prompt) }}
                        className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(event) => {
                    void submitMessage(event)
                  }}
                  className="relative"
                >
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask anything..."
                    className="min-h-[88px] w-full resize-none rounded-xl border-border bg-background shadow-inner pr-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:ring-offset-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void submitMessage(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim()}
                    className="absolute bottom-3 right-3 h-10 w-10 rounded-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {localError || error ? (
                  <p className="mt-2 text-xs text-amber-600">
                    {localError ?? error?.message}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            /* Other Panels (History, Workspace) */
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold capitalize">{effectiveOpenPanel}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 transition-colors ${pinnedPanel === effectiveOpenPanel ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle(effectiveOpenPanel)}
                >
                  <Pin className={`h-4 w-4 transition-transform ${pinnedPanel === effectiveOpenPanel ? "rotate-45" : ""}`} />
                </Button>
              </div>
              
              {effectiveOpenPanel === "workspace" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                    <Image src={avatar} alt={displayName} width={40} height={40} className="rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                    </div>
                    <Link
                      href="/account/profile"
                      onClick={handleCloseSidebar}
                      className="ml-auto inline-flex items-center rounded-lg border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      View
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
                    <div className="space-y-1">
                      {workspaceLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={handleCloseSidebar}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/50"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                            <link.icon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-medium">{link.label}</span>
                            <span className="text-xs text-muted-foreground">{link.description}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {effectiveOpenPanel === "history" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No recent sessions found.
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="space-y-1">
                        {historyItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => loadSession(item.id)}
                            className={`group w-full text-left px-3 py-2.5 text-[13px] hover:bg-accent rounded-lg truncate transition-colors ${
                              currentId === item.id ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            <p className="truncate mb-1">{item.title || "Untitled Session"}</p>
                            <p className="text-[10px] text-muted-foreground/70 group-hover:text-foreground/80">
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {authenticated ? (
        <div className="fixed inset-y-0 left-0 z-50 hidden md:flex">
          {sidebarContent}
        </div>
      ) : null}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-300" onClick={handleCloseSidebar} />
      )}
      <div className={`fixed inset-y-0 left-0 z-[60] h-full transition-transform duration-300 ease-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}>
        {sidebarContent}
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}
