"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MarqueePrompts } from "@/components/marketing/marquee-prompts"
import { MarketingLLMInput } from "@/components/marketing/marketing-llm-input"
import { Sparkles, ArrowRight, Command, Scale, Search, FileText, SlidersHorizontal, Gauge, ShieldAlert, BarChart3, Database, History, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

const commands = [
  { id: "screen", title: "/screen", desc: "Find ranked projects with constraints", icon: Search },
  { id: "compare", title: "/compare", desc: "Direct area or project comparison", icon: Scale },
  { id: "memo", title: "/memo", desc: "Generate full investor memo", icon: FileText },
  { id: "risk", title: "/risk", desc: "Real V1 stress breakdown", icon: SlidersHorizontal },
  { id: "price", title: "/price", desc: "Price reality check", icon: Gauge },
  { id: "risk", title: "/risk", desc: "Area-level risk brief", icon: ShieldAlert },
  { id: "pulse", title: "/pulse", desc: "Live DLD market pulse", icon: BarChart3 },
  { id: "bench", title: "/bench", desc: "DLD area benchmark", icon: Database },
  { id: "history", title: "/history", desc: "DLD transaction search", icon: History },
]

const examples = [
  "Find 2BR projects under AED 2M with BUY timing label",
  "Compare Dubai Marina vs JBR on price and yield",
  "What are the top 5 emerging areas for investment?",
  "Show the V1 stress profile for a Dubai Marina project",
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

export default function ChatLandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '2s' }} />
      </div>

      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground/90 hover:text-foreground transition-colors">
              Entrestate
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/chat" className="text-sm font-bold text-primary relative group">
                Chat
                <span className="absolute -bottom-1 left-0 w-full h-px bg-primary" />
              </Link>
              {["Platform", "Intelligence", "Enterprise", "Pricing"].map((item) => (
                <Link key={item} href="#" className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 font-medium shadow-xl shadow-foreground/10">
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center pt-32 pb-32 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="container max-w-6xl mx-auto px-6 flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-full border border-primary/10 backdrop-blur-sm shadow-inner cursor-default group">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="tracking-wide">ENTRESTATE INTELLIGENCE V4.2</span>
              <div className="h-3 w-px bg-primary/20 mx-1" />
              <span className="text-primary/60 font-medium">GPT-4o OPTIMIZED</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[1.05] tracking-tight mb-8">
            The future of real estate
            <br />
            <span className="text-muted-foreground/40 italic">is intelligent.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-muted-foreground/80 max-w-3xl mb-12 font-medium leading-relaxed">
            Move beyond data. Access professional-grade market intelligence, 
            automated risk benchmarks, and verified execution.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6 mb-24">
            <Button size="lg" className="h-14 rounded-full px-10 gap-3 text-lg bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]">
              Start Intelligence Session
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link href="#" className="group text-sm font-semibold flex items-center gap-2.5 hover:text-primary transition-colors">
              Explore Enterprise Solutions
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Moving Blocks - "Amazing Motion" */}
          <motion.div variants={itemVariants} className="w-full mb-16 select-none">
            <MarqueePrompts />
          </motion.div>

          {/* Example Questions Section */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 mb-24 max-w-4xl">
            {examples.map((example, i) => (
              <button key={i} className="px-5 py-2.5 bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
                {example}
              </button>
            ))}
          </motion.div>

          {/* LLM Input */}
          <motion.div variants={itemVariants} className="w-full mb-32">
            <MarketingLLMInput />
          </motion.div>

          {/* Available Commands Section */}
          <motion.div variants={itemVariants} className="w-full max-w-6xl">
            <div className="flex items-center gap-3 mb-12 justify-center text-muted-foreground/40">
              <div className="h-px w-12 bg-border/40" />
              <Command className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Advanced Neural Commands</span>
              <div className="h-px w-12 bg-border/40" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-5">
              {commands.map((cmd) => (
                <motion.div 
                  key={cmd.id} 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group p-5 bg-card/30 backdrop-blur-sm border border-border/40 rounded-2xl hover:border-primary/40 transition-all text-center flex flex-col items-center justify-between min-h-[160px] shadow-sm hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="mx-auto w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <cmd.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="font-mono text-[11px] font-bold mb-1.5 text-primary/80 group-hover:text-primary transition-colors tracking-tight">{cmd.title}</div>
                    <div className="text-[10px] text-muted-foreground/60 font-medium leading-snug px-1 group-hover:text-muted-foreground transition-colors">{cmd.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Writes, brainstorms... text */}
          <motion.div 
            variants={itemVariants}
            className="mt-40 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-foreground/90 leading-tight mb-8">
              Intelligence that <span className="text-primary italic">thinks</span> with you.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              The platform doesn't just return rows. It analyzes context, benchmarks risks, and drafts professional insights using the same logic as the world's top real estate analysts.
            </p>
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4">
              Explore the Knowledge Engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
