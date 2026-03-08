import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GridBackground } from "@/components/grid-background"
import { ScrollToTop } from "@/components/scroll-to-top"

const sections = [
  {
    title: "Cookie policy overview",
    content:
      "Entrestate uses cookies and similar technologies to keep sessions secure, remember preferences, improve performance, and understand aggregate product usage.",
  },
  {
    title: "Essential cookies",
    content:
      "These cookies are required for core platform functionality such as authentication, security controls, and session continuity. They cannot be disabled without impacting service operation.",
  },
  {
    title: "Analytics cookies",
    content:
      "Analytics cookies help us measure traffic patterns and product performance in aggregate form. We use these signals to improve reliability, UX, and feature quality.",
  },
  {
    title: "Preference cookies",
    content:
      "Preference cookies store user-selected options such as UI settings and interaction preferences to provide a consistent experience across sessions.",
  },
  {
    title: "Managing cookies",
    content:
      "You can control or clear cookies through browser settings. Disabling essential cookies may affect login and account workflows. For policy questions, contact support through the platform contact page.",
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <GridBackground />

      <div className="relative pb-24 pt-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-3 text-4xl font-bold text-foreground md:text-5xl">Cookie Policy</h1>
            <p className="mb-10 text-sm text-muted-foreground">
              How Entrestate uses cookies and related browser storage technologies.
            </p>

            <div className="rounded-xl border border-border/50 bg-card/50 p-8 md:p-10">
              <div className="space-y-8">
                {sections.map((section) => (
                  <section key={section.title} className="border-b border-border/40 pb-8 last:border-0 last:pb-0">
                    <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
                    <p className="leading-relaxed text-muted-foreground">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
