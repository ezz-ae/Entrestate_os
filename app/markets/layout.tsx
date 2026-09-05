import type { Metadata } from "next"

export const metadata: Metadata = {
  // The page names itself ("Market Explorer"); the root template adds the
  // brand once. A title here rendered "Explorer - Entrestate | Entrestate".
  title: "Market Explorer",
  description:
    "Explore market signals, price tiers, and decision-ready views for real estate.",
}

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children
}
