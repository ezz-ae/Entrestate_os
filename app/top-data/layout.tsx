import type { Metadata } from "next"

/**
 * No `title` here: a layout title beside a page title that already carried
 * "| Entrestate" rendered "… | Entrestate | Entrestate" in the tab. The page
 * names itself; the root template adds the brand once.
 */
export const metadata: Metadata = {
  description:
    "Curated market intelligence and focused requests for real estate decision makers.",
}

export default function TopDataLayout({ children }: { children: React.ReactNode }) {
  return children
}
