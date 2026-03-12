"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Bot,
  Handshake,
  Briefcase,
  BarChart3,
  BookOpen,
  Database,
  Building2,
  Layers,
  Shield,
  Zap,
  Target,
  Search,
  FileText,
  Code,
  Globe,
} from "lucide-react"
import { platformDocsSections } from "@/lib/platform-docs"
import type { ComponentType } from "react"
import { Button } from "@/components/ui/button"

const sectionIcon: Record<string, ComponentType<{ className?: string }>> = {
  "partners-apis": Handshake,
  documentation: BookOpen,
  industry: Building2,
  "careers-intern": Briefcase,
  "investors-relations": BarChart3,
  "data-information": Database,
}

const keyNumbers = [
  { label: "Active Projects", value: "7,015", detail: "Tracked across UAE" },
  { label: "Canonical Developers", value: "481", detail: "Normalized & verified" },
  { label: "BUY Signals", value: "2,667", detail: "Evidence-backed" },
  { label: "Pipeline Phases", value: "10", detail: "Sequential data refinement" },
]

export default function DocsPage() {
  return (
    <div className="selection:bg-primary/20">
      {/* Hero */}
      <header className="mb-12 relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/40 backdrop-blur-xl p-8 md:p-16 shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full border border-primary/10 mb-6">
            <Globe className="w-3 h-3" />
            Knowledge Base v4.0
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-[1.1] tracking-tight max-w-3xl">
            The Intelligence OS for<br />
            <span className="text-muted-foreground/40 italic">UAE Real Estate</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
            Entrestate is <span className="text-foreground">decision infrastructure</span>. We transform raw market signals into defensible, institutional-grade outcomes through an auditable Pipeline-to-Tunnel architecture.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button variant="premium" size="lg" asChild className="h-12 px-8 shadow-xl">
              <Link href="/docs/investors-relations">
                Investor Package
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 px-8 rounded-full border-border/60">
              <Link href="/docs/documentation">
                Technical Spec
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {platformDocsSections.map((section) => {
          const Icon = sectionIcon[section.slug] || FileText
          return (
            <Link key={section.slug} href={`/docs/${section.slug}`} className="group">
              <div className="h-full p-8 rounded-[2rem] border border-border/60 bg-card/30 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-2xl hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{section.summary}</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all">
                  Browse Section <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Key Numbers */}
      <section className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {keyNumbers.map((item) => (
          <div key={item.label} className="rounded-3xl border border-border/40 bg-card/20 p-8 text-center backdrop-blur-sm">
            <p className="text-3xl font-serif font-bold text-foreground md:text-4xl mb-1">{item.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{item.label}</p>
            <p className="mt-2 text-xs text-muted-foreground font-medium">{item.detail}</p>
          </div>
        ))}
      </section>

      {/* Architecture Section */}
      <section className="rounded-[3rem] border border-border/70 bg-foreground text-background p-10 md:p-20 relative overflow-hidden shadow-2xl shadow-foreground/20">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-8">The One-System Model</h2>
          <p className="text-lg md:text-xl text-background/70 font-medium leading-relaxed mb-12">
            Entrestate replaces fragmented data silos with a unified <span className="text-background underline decoration-primary underline-offset-8">Pipeline-to-Tunnel</span> architecture. Every internal signal is inseparable from the final decision.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Supply Chain", desc: "Sequential data refinement across 10 distinct phases.", icon: Layers },
              { title: "Governance", desc: "Institutional-grade verification for every data object.", icon: Shield },
              { title: "The Tunnel", desc: "High-conviction investment outcomes and analysis.", icon: Target },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-background/10 bg-background/5">
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h4 className="text-sm font-bold uppercase tracking-widest mb-2">{feature.title}</h4>
                <p className="text-xs text-background/60 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
