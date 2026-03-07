"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { AccountMenu } from "@/components/account-menu"
import { LlmSidebar } from "@/components/llm-search/sidebar"
import { useCopilot } from "@/components/copilot-provider"
import { authClient } from "@/lib/auth/client"
import { MessageSquare } from "lucide-react"

const navLinks = [
  { label: "Overview", href: "/overview" },
  { label: "Market Data", href: "/top-data" },
  { label: "Areas", href: "/areas" },
  { label: "Developers", href: "/developers" },
  { label: "Properties", href: "/properties" },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasOpenChatIntent, setHasOpenChatIntent] = useState(false)
  const pathname = usePathname()
  const isChatPage = pathname.startsWith("/chat")
  const router = useRouter()
  const { toggleSidebar, openSidebar, isSidebarOpen } = useCopilot()
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)
  const shouldRenderSidebar = !isChatPage && (isAuthenticated || isSidebarOpen || hasOpenChatIntent)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setHasOpenChatIntent(params.get("openChat") === "true")
  }, [pathname])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      const hash = href.substring(1)
      if (pathname === "/") {
        e.preventDefault()
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: "smooth" })
      } else {
        e.preventDefault()
        router.push("/")
        setTimeout(() => {
          const el = document.querySelector(hash)
          if (el) el.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
    setIsMobileMenuOpen(false)
  }

  const handleCopilotClick = () => {
    if (isAuthenticated) {
      toggleSidebar()
      return
    }

    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches
    if (isMobileViewport) {
      openSidebar()
      setIsMobileMenuOpen(false)
      return
    }

    router.push("/chat")
  }

  return (
    <>
      <header
        className="app-header fixed top-0 left-0 right-0 z-50 animate-navbar-slide backdrop-blur-md bg-background/90 border-b border-border/50"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="w-3 h-3 rounded-sm bg-foreground" />
                <div className="w-3 h-3 rounded-sm bg-foreground/60" />
                <div className="w-3 h-3 rounded-sm bg-accent" />
              </div>
              <span className="text-base sm:text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>

            <div className="hidden lg:flex items-center gap-5 xl:gap-8">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`nav-link-underline text-sm transition-colors ${
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {!isChatPage && !isAuthenticated ? (
                <button
                  onClick={handleCopilotClick}
                  className="hidden md:flex items-center rounded-full border border-border bg-secondary p-2 text-foreground hover:bg-secondary/80 transition-colors"
                  aria-label="Open assistant"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              ) : null}
              <AccountMenu />

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative z-50 p-2 text-foreground"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <div className="relative w-5 h-5">
                  <Menu
                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                      isMobileMenuOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                    }`}
                  />
                  <X
                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                      isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-400 ease-out ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-background transition-opacity duration-400 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative h-full flex flex-col justify-center items-center px-6">
          <nav className="flex flex-col items-center gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-3xl font-medium text-foreground hover:text-accent transition-all duration-500 py-2 ${
                  isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${120 + i * 60}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div
            className={`mt-10 flex flex-col items-center gap-4 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "400ms" : "0ms" }}
          >
            <Link
              href="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              Account
            </Link>
          </div>
        </div>
      </div>
      {shouldRenderSidebar ? (
        <Suspense fallback={null}>
          <LlmSidebar authenticated={isAuthenticated} />
        </Suspense>
      ) : null}
    </>
  )
}
