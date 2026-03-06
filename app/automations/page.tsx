import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Bot, MessageCircle, Megaphone } from "lucide-react"

const automationCards = [
  {
    title: "WhatsApp Lead Desk",
    detail: "Lead qualification and follow-up sequences.",
    icon: MessageCircle,
  },
  {
    title: "IG DM Lead Desk",
    detail: "Instant intake and investor matching in DMs.",
    icon: Bot,
  },
  {
    title: "Ads Workflow",
    detail: "Campaign briefs tied to Time Tables and notes.",
    icon: Megaphone,
  },
]

export default function AutomationsPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Execution</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">Workflows that execute the decision.</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Workflows inherit the evidence trail so outbound activity stays aligned with market data.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {automationCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                <card.icon className="h-5 w-5 text-accent" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
