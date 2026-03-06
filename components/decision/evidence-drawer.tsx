"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type EvidenceDrawerProps = {
  sources?: unknown
  exclusions?: unknown
  assumptions?: unknown
  title?: string
}

export function EvidenceDrawer({ sources, exclusions, assumptions, title = "Evidence Drawer" }: EvidenceDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Sources</p>
            <pre className="mt-1 overflow-auto rounded-lg bg-background/70 p-2">{JSON.stringify(sources ?? [], null, 2)}</pre>
          </div>
          <div>
            <p className="font-medium text-foreground">Exclusions</p>
            <pre className="mt-1 overflow-auto rounded-lg bg-background/70 p-2">{JSON.stringify(exclusions ?? [], null, 2)}</pre>
          </div>
          <div>
            <p className="font-medium text-foreground">Assumptions</p>
            <pre className="mt-1 overflow-auto rounded-lg bg-background/70 p-2">{JSON.stringify(assumptions ?? [], null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </div>
  )
}

