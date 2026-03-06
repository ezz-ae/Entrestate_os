import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Shield, Eye, Scale, BookOpen } from "lucide-react"

const principles = [
  {
    icon: Eye,
    title: "Clarity over persuasion",
    description: "We show data and analysis. We do not recommend, persuade, or guide decisions. Users think for themselves.",
  },
  {
    icon: Shield,
    title: "Structure over speed",
    description: "Every contract, session, and transaction follows defined rules. Execution is handled by verified professionals.",
  },
  {
    icon: Scale,
    title: "Fairness through separation",
    description: "Users study. Advisors execute. The platform connects the two without conflicts of interest.",
  },
  {
    icon: BookOpen,
    title: "Knowledge is signed",
    description: "Every report and insight in the Library is researched, written, and signed by Entrestate analysts. We stand behind what we publish.",
  },
]

const stats = [
  { value: "8", label: "Markets" },
  { value: "200+", label: "Areas Tracked" },
  { value: "1,400+", label: "Projects" },
  { value: "48", label: "Published Reports" },
]

export default function AboutPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <div className="max-w-2xl mb-20">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">About</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              A real estate market research and decision firm
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              Entrestate builds professional workflows for understanding real estate markets and executing decisions
              through verified advisors. We do not sell properties, list units, or broker deals directly. We focus on
              market clarity and structured execution.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 bg-card border border-border rounded-lg text-center">
                <p className="text-3xl md:text-4xl font-serif text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            <div className="p-8 md:p-10 bg-primary rounded-lg">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">Mission</p>
              <h2 className="text-2xl md:text-3xl font-serif text-primary-foreground leading-tight mb-4">
                Make real estate markets understandable and actionable
              </h2>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">
                Real estate decisions are often made with incomplete information, opaque pricing, and unclear
                processes. Entrestate exists to change that. We bring data, analysis, and professional execution into
                one platform. Users get market clarity. Advisors get structure. Both get transparency.
              </p>
            </div>
            <div className="p-8 md:p-10 bg-card border border-border rounded-lg flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Approach</p>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground leading-tight mb-4">
                  Evidence first, opinion never
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We provide market dashboards, search tools, calculators, and comparison workflows. We publish
                  reports and insights. But we never tell users what to buy, sell, or hold. The platform provides
                  understanding. Users make their own decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Principles */}
          <div className="mb-20">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Principles</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight text-balance">
                What we believe
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle) => (
                <div key={principle.title} className="p-8 bg-card border border-border rounded-lg">
                  <div className="p-2.5 bg-secondary rounded-md w-fit mb-4">
                    <principle.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-2">{principle.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 md:p-12 bg-card border border-border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-2">Explore Entrestate</h2>
              <p className="text-sm text-muted-foreground">Start with Markets, review the Library, or open the Decision Tunnel.</p>
            </div>
            <Link
              href="/markets"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors w-fit"
            >
              Explore Markets
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
