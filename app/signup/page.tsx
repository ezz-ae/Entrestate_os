"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth/client"

export default function SignUpPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const toFriendlyAuthError = (message?: string | null) => {
    const normalized = (message ?? "").toLowerCase()
    if (normalized.includes("invalid origin")) {
      return "Auth domain is not trusted. Add this site URL to Neon Auth trusted origins, then retry."
    }
    return message || "Unable to create account. Please try again."
  }

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  useEffect(() => {
    if (session?.user) {
      router.replace("/workspace")
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const { data, error } = await withTimeout(
        authClient.signUp.email({ email, password, name }),
        15000,
        "Registration timed out. Check Neon Auth settings and try again.",
      )

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
        return
      }

      if (data?.token) {
        router.push("/workspace")
        return
      }

      setSuccessMessage("Check your email to verify your account, then sign in.")
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-primary">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-sm bg-primary-foreground" />
            <div className="w-3 h-3 rounded-sm bg-primary-foreground/60" />
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          <span className="text-lg font-medium tracking-tight text-primary-foreground">entrestate</span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-serif text-primary-foreground leading-tight mb-4">
            A professional platform for studying markets and operating decisions.
          </h2>
          <p className="text-primary-foreground/60 leading-relaxed">
            Explore market data, analyze price behavior, compare scenarios, and work with verified advisors when you are ready to act.
          </p>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-serif text-primary-foreground">Free</p>
            <p className="text-sm text-primary-foreground/60 mt-1">To explore</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">Verified</p>
            <p className="text-sm text-primary-foreground/60 mt-1">Advisors</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">Signed</p>
            <p className="text-sm text-primary-foreground/60 mt-1">Reports</p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="w-3 h-3 rounded-sm bg-foreground" />
                <div className="w-3 h-3 rounded-sm bg-foreground/60" />
                <div className="w-3 h-3 rounded-sm bg-accent" />
              </div>
              <span className="text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-serif text-foreground">Request access</h1>
              <p className="text-muted-foreground mt-2 text-sm">Create your Entrestate account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 pr-11 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              {isPending && !isLoading ? <p className="text-xs text-muted-foreground">Checking session status…</p> : null}
              {formError && <p className="text-sm text-rose-300">{formError}</p>}
              {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}
            </form>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              {"By signing up, you agree to our "}
              <Link href="/terms" className="text-accent hover:underline">Terms</Link>
              {" and "}
              <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Already have an account? "}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
