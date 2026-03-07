"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ArrowRight } from "lucide-react"
import { AccountMenu } from "@/components/account-menu"
import { MarketPulsePopover } from "@/components/market-pulse-popover"
import { LlmSidebar } from "@/components/llm-search/sidebar"
import { useCopilot } from "@/components/copilot-provider"
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
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSidebar, openSidebar } = useCopilot()

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

  return (
    <>
      <header
        className="app-header fixed top-0 left-0 right-0 z-50 animate-navbar-slide backdrop-blur-md bg-background/90 border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="w-3 h-3 rounded-sm bg-foreground" />
                <div className="w-3 h-3 rounded-sm bg-foreground/60" />
                <div className="w-3 h-3 rounded-sm bg-accent" />
              </div>
              <span className="text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
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

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="hidden md:flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Copilot
              </button>
              <Link
                href="/contact"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Talk to us
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <MarketPulsePopover />
              <AccountMenu />

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden relative z-50 p-2 text-foreground"
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
        className={`fixed inset-0 z-40 md:hidden transition-all duration-400 ease-out ${
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
            <button
              onClick={() => {
                openSidebar()
                setIsMobileMenuOpen(false)
              }}
              className="text-3xl font-medium text-foreground hover:text-accent transition-all duration-500 py-2 opacity-100 translate-y-0"
            >
              Chat
            </button>
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
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-6 py-3 text-base font-medium bg-primary text-primary-foreground rounded-md"
            >
              Talk to us
              <ArrowRight className="w-4 h-4" />
            </Link>
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
      <LlmSidebar />
    </>
  )
}
