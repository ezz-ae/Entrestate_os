import { cn } from "@/lib/utils"

function baseClassName(colorClass: string) {
  return cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", colorClass)
}

export function TimingSignalBadge({ signal }: { signal: string | null | undefined }) {
  const value = (signal ?? "UNKNOWN").toUpperCase()
  const tone =
    value === "BUY"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : value === "HOLD"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
        : "border-red-500/50 bg-red-500/10 text-red-300"

  return <span className={baseClassName(tone)}>{value}</span>
}

export function StressGradeBadge({ grade }: { grade: string | null | undefined }) {
  const value = (grade ?? "N/A").toUpperCase()
  const tone =
    value === "A"
      ? "border-emerald-600/50 bg-emerald-600/10 text-emerald-300"
      : value === "B"
        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
        : value === "C"
          ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
          : value === "D"
            ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
            : "border-red-500/50 bg-red-500/10 text-red-300"

  return <span className={baseClassName(tone)}>Grade {value}</span>
}

export function ConfidenceBadge({ confidence }: { confidence: string | null | undefined }) {
  const value = (confidence ?? "UNKNOWN").toUpperCase()
  const tone =
    value === "HIGH"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : value === "MEDIUM"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
        : "border-slate-500/50 bg-slate-500/10 text-slate-300"

  return <span className={baseClassName(tone)}>{value}</span>
}

