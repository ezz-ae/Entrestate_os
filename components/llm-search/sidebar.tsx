import { useState, useEffect, useRef } from "react"
import { useCopilot } from "@/components/copilot-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Clock,
  Compass,
  TrendingUp,
  Pin,
  Send,
  Sparkles,
  MessageSquare,
  X,
} from "lucide-react"
import Image from "next/image"
import { UpgradeModal } from "./upgrade-modal"
import { AccountMenu } from "./account-menu"

// A new, polished message bubble component
function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user'
  return (
    <div 
      key={message.id} 
      className={`flex items-start gap-2.5 animate-in slide-in-from-bottom-2 fade-in-0 duration-300 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
        isUser 
          ? 'bg-primary text-primary-foreground rounded-tr-md' 
          : 'bg-muted/60 text-foreground rounded-tl-md'
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

export function LlmSidebar() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, isSidebarOpen, closeSidebar, toggleSidebar, id: currentId, openSidebar } = useCopilot()
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [pinnedPanel, setPinnedPanel] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle auto-open and session loading from URL
  useEffect(() => {
    if (searchParams.get("openChat") === "true") {
      openSidebar()
    }
    const sessionId = searchParams.get("id")
    if (sessionId && sessionId !== currentId) {
      openSidebar()
    }
  }, [searchParams, currentId, openSidebar])

  // Load history from API
  useEffect(() => {
    if (openPanel === "history" || pinnedPanel === "history" || (isSidebarOpen && historyItems.length === 0)) {
      loadHistory()
    }
  }, [openPanel, pinnedPanel, isSidebarOpen, historyItems.length])

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

  // If the global sidebar is open, force the panel open
  const effectiveOpenPanel = isSidebarOpen ? "chat" : openPanel

  const sidebarContent = (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex h-full border-r border-border bg-background transition-all duration-300 ease-in-out md:static ${
        effectiveOpenPanel ? "w-[420px]" : "w-[72px]"
      } ${!effectiveOpenPanel && "md:w-[72px]"}`}
      onMouseLeave={() => {
        if (!pinnedPanel && !isSidebarOpen) {
          setOpenPanel(null)
        }
      }}
    >
      {/* Navigation Rail */}
      <div className="flex flex-col h-full w-[72px] shrink-0 items-center border-r border-border bg-card/50">
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
            Copilot
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
              onMouseEnter={() => !isSidebarOpen && handlePanelChange("discover")}
              className="h-12 w-12 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Compass className="h-5 w-5" />
            </Button>
            <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
              Discover
            </span>
          </div>

          <div className="group relative flex justify-center">
            <Button
              variant="ghost"
              onMouseEnter={() => !isSidebarOpen && handlePanelChange("markets")}
              className="h-12 w-12 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <TrendingUp className="h-5 w-5" />
            </Button>
            <span className="absolute left-full ml-4 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50 pointer-events-none whitespace-nowrap">
              Markets
            </span>
          </div>
        </nav>

        <div className="flex flex-col gap-2 pb-4 items-center w-full px-2">
          <Button
            variant="ghost"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="h-12 w-12 shrink-0 p-0 rounded-full overflow-hidden"
          >
            <Image src="/avatars/avatar-01.svg" alt="Profile" width={36} height={36} className="object-cover" />
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      {effectiveOpenPanel && (
        <div className="flex flex-1 flex-col h-full bg-background min-w-0">
          
          {/* Chat Panel (Copilot) */}
          {isSidebarOpen ? (
            <div className="flex flex-col h-full animate-in slide-in-from-left-5 duration-300">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Copilot</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeSidebar}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 -mt-8 animate-in fade-in-5 duration-500">
                    <div className="bg-primary/10 p-4 rounded-full mb-4 shadow-inner">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-base font-semibold text-foreground">How can I help you today?</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 w-full text-xs text-muted-foreground">
                      <div className="p-3 rounded-lg bg-muted/50 text-left">Compare areas</div>
                      <div className="p-3 rounded-lg bg-muted/50 text-left">Screen deals</div>
                      <div className="p-3 rounded-lg bg-muted/50 text-left">Draft memos</div>
                      <div className="p-3 rounded-lg bg-muted/50 text-left">Check prices</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
                    {isLoading && (
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
              </ScrollArea>

              <div className="p-4 border-t border-border bg-card/20">
                <form onSubmit={handleSubmit} className="relative">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask anything..."
                    className="min-h-[88px] w-full resize-none rounded-xl border-border bg-background shadow-inner pr-12 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:ring-offset-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e as any)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="absolute bottom-3 right-3 h-10 w-10 rounded-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* Other Panels (History, Discover, etc.) */
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold capitalize">{openPanel}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 transition-colors ${pinnedPanel === openPanel ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle(openPanel!)}
                >
                  <Pin className={`h-4 w-4 transition-transform ${pinnedPanel === openPanel ? "rotate-45" : ""}`} />
                </Button>
              </div>
              
              {openPanel === "history" && (
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
                    <ScrollArea className="flex-1 p-2">
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
                    </ScrollArea>
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
      <div className="hidden md:flex">
        {sidebarContent}
      </div>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-300" onClick={closeSidebar} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 ease-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>
      <AccountMenu isOpen={showAccountMenu} onClose={() => setShowAccountMenu(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  )
}