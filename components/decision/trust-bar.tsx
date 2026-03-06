type TrustBarProps = {
  verifiedRows?: number
  highConfidencePct?: number
  updatedAt?: string | null
}

export function TrustBar({ verifiedRows, highConfidencePct, updatedAt }: TrustBarProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4">
        <span>Verify the Math</span>
        <span>Verified rows: {verifiedRows?.toLocaleString() ?? "—"}</span>
        <span>
          High confidence: {typeof highConfidencePct === "number" && Number.isFinite(highConfidencePct) ? `${highConfidencePct.toFixed(1)}%` : "—"}
        </span>
        <span>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</span>
      </div>
    </div>
  )
}

