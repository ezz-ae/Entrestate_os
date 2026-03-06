"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth/client"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      router.replace("/workspace")
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    const { error } = await authClient.signIn.email({ email, password })
    setIsLoading(false)

    if (error) {
      setFormError(error.message || "Unable to sign in. Please try again.")
      return
    }

    router.push("/workspace")
  }

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Left side - Branding */}
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
          <blockquote className="text-2xl font-serif text-primary-foreground leading-relaxed">
            {"\"This platform gave us clarity on pricing behavior we couldn't see anywhere else. We made better decisions, faster.\""}
          </blockquote>
          <div className="mt-6">
            <p className="text-primary-foreground font-medium">Ahmed Al-Rashid</p>
            <p className="text-primary-foreground/60 text-sm">Investment Director, Gulf Capital Partners</p>
          </div>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-serif text-primary-foreground">8</p>
            <p className="text-sm text-primary-foreground/60 mt-1">Markets</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">200+</p>
            <p className="text-sm text-primary-foreground/60 mt-1">Areas Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">1,400+</p>
            <p className="text-sm text-primary-foreground/60 mt-1">Projects</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
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
              <h1 className="text-2xl font-serif text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-2 text-sm">Sign in to your Entrestate account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
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
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
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
                disabled={isLoading || isPending}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              {formError && <p className="text-sm text-rose-300">{formError}</p>}
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/signup" className="text-accent hover:underline font-medium">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
