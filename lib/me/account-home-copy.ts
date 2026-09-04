/**
 * THE WORDS ON THE ACCOUNT HOME — and the words that are never on it.
 *
 * The owner, looking at the old /me: "we're telling someone who doesn't even
 * know what Entrestate is about 'the Terminal' and 'the Business' as if he
 * knows us and lives with us." He was right. This page greets a stranger.
 * So it speaks in nouns a stranger owns — the market, areas, developers,
 * projects, alerts, apps, your workspace — and never in ours.
 *
 * The banned words are listed here, next to the copy, and a test reads both
 * (tests/account-home.test.ts): "Terminal", "business account", "App Store",
 * "discovery member", "read surface", "paid layer", and the standing ban on
 * "free" on any selling surface. The product is called Entrestate. The chat
 * is "ask". The place a brokerage runs is "your workspace".
 *
 * English only, like the rest of /me today; the shape is one flat object so
 * the Arabic can follow as a second object without touching the page.
 */
export const ACCOUNT_HOME_INSIDER_WORDS: readonly RegExp[] = [
  /\bterminal\b/i,
  /\bbusiness account\b/i,
  /\bapp store\b/i,
  /\bdiscovery member\b/i,
  /\bread surface\b/i,
  /\bpaid layer\b/i,
  /\bconnection layer\b/i,
  /\blistings layer\b/i,
  /\bapi layer\b/i,
  /\bfree\b/i,
]

export const ACCOUNT_HOME_COPY = {
  /** {name} is the first name. */
  title: "What do you want to know about Dubai property, {name}?",
  placeholder: "Ask anything — an area, a project, a developer, a price…",
  starters: "Try one",

  pulseTitle: "The market right now",
  pulseSub: "Scored inventory across Dubai.",
  pulseProjects: "Projects scored",
  pulseYield: "Average yield",
  pulsePrice: "Average price",
  pulseBuy: "Buy signals",
  pulseBasis: "Averages across scored inventory, not a single listing.",

  yoursTitle: "Yours",
  yoursSub: "What you have saved, watching, and added to this account.",
  yoursEmpty: "Nothing here yet. Save an area from any search, or add an app below.",
  yoursSavedAreas: "Saved areas",
  yoursWatched: "Watched projects",
  yoursListings: "Your listings",
  yoursAlerts: "Alerts",
  yoursApps: "Apps on this account",
  yoursWallet: "Ads wallet",
  yoursWorkspace: "Your workspace",
  yoursProTag: "Pro",
  yoursOpen: "Open",
  yoursSeePlans: "See plans",

  doors: {
    market: {
      label: "Market",
      s: [
        { t: "What is selling in Dubai this month?", s: "Transactions by area and type, from the land department’s own records" },
        { t: "Where are prices moving fastest?", s: "Price per square metre, this quarter against last" },
        { t: "Compare two areas for yield", s: "Rent against price, side by side" },
      ],
    },
    areas: {
      label: "Areas",
      s: [
        { t: "Which areas give the best rental yield right now?", s: "Ranked, with how many transactions stand behind each" },
        { t: "Which areas cooled since spring?", s: "Volume and price, area by area" },
        { t: "Show me one area in full", s: "Price, yield, supply and what changed" },
      ],
    },
    developers: {
      label: "Developers",
      s: [
        { t: "Which developers deliver on time?", s: "Track record from completed projects" },
        { t: "Check one developer for me", s: "Delivery, pricing and what they have launched" },
        { t: "Who launched this year?", s: "New projects by developer" },
      ],
    },
    projects: {
      label: "Projects",
      s: [
        { t: "Screen a project I am considering", s: "The verdict, and the evidence it rests on" },
        { t: "Off-plan or ready — which is cheaper per square metre here?", s: "Same area, both sides of the market" },
        { t: "Which projects carry a buy signal today?", s: "Only the ones the evidence supports" },
      ],
    },
    alerts: {
      label: "Alerts",
      s: [
        { t: "Watch an area for me", s: "A note when its price or volume moves" },
        { t: "Watch a project", s: "A note when its verdict changes" },
        { t: "Open my alerts", s: "Everything that moved on what you watch" },
      ],
    },
    apps: {
      label: "Apps",
      /** Real products come from the store; this is the fallback when it is unreachable. */
      s: [
        { t: "Run ads that bring buyers", s: "Campaigns, landing pages and leads, on this account" },
        { t: "Call and follow up every lead", s: "A desk that never forgets a callback" },
        { t: "See every app", s: "Add the selling work to this same account" },
      ],
      add: "Add to your account",
      inBuild: "Being built",
      seeAll: "See every app",
    },
    workspace: {
      label: "Your workspace",
      open: "Open {company}",
      openSub: "Inventory, campaigns, leads and the team — on your own address",
      create: "Create your workspace",
      createSub: "Your own address and brand. Opens with this account — no second sign-in",
      full: "A complete system for a brokerage",
      fullSub: "Team, campaigns, calling, finance — everything, on your own address",
    },
  },

  proNudge: "Your own listings, portal connections and alerts come with Pro.",
  proCta: "See plans",
} as const

export type AccountHomeDoorId = keyof typeof ACCOUNT_HOME_COPY.doors
export const ACCOUNT_HOME_DOOR_IDS = Object.keys(ACCOUNT_HOME_COPY.doors) as AccountHomeDoorId[]
