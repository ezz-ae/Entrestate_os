import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Mail, PhoneCall, ArrowRight, FileText } from "lucide-react"

const supportChannels = [
  {
    title: "Email support",
    description: "Reach our operations team for dashboard, data, or advisor workflow questions.",
    icon: Mail,
    action: "support@entrestate.ai",
  },
  {
    title: "Direct hotline",
    description: "Priority support for active broker teams and enterprise accounts.",
    icon: PhoneCall,
    action: "+971 55 000 0000",
  },
  {
    title: "Documentation",
    description: "Read market methodology notes and workflow guides.",
    icon: FileText,
    action: "Browse docs",
  },
]

export default function SupportPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Support</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Talk to the Entrestate team
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              We respond with operational guidance, not generic helpdesk scripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {supportChannels.map((channel) => (
              <div key={channel.title} className="p-6 bg-card border border-border rounded-lg">
                <channel.icon className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground mt-4">{channel.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{channel.description}</p>
                <p className="text-sm font-medium text-foreground mt-4">{channel.action}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Contact form
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:border-accent/40 hover:text-foreground transition-colors"
            >
              System status
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
