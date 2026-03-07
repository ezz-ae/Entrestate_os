"use client"

import { useState, useMemo } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, PlayCircle, BarChart3 } from "lucide-react"
import { ProjectCard } from "@/components/decision/project-card"
import { getSimulatedProjects } from "@/lib/profile/simulation"

export default function StrategicProfileEditor({ initialProfile, disabled }: { initialProfile: any; disabled?: boolean }) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)

  const simulatedProjects = useMemo(() => getSimulatedProjects(profile), [profile])

  const handleSave = async () => {
    if (disabled) return;
    setLoading(true)
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save strategic profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        {/* Risk Bias Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Risk Bias</Label>
            <Badge variant="outline" className="text-xs text-blue-400">
              {Math.round(profile.riskBias * 100)}% Market Weight
            </Badge>
          </div>
          <Slider
            value={[profile.riskBias * 100]}
            max={100}
            step={1}
            disabled={disabled}
            onValueChange={(val) => setProfile({ ...profile, riskBias: val[0] / 100 })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Aggressive (Data Density Priority)</span>
            <span>Conservative (Reliability Priority)</span>
          </div>
        </div>

        {/* Yield vs Safety Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Yield vs. Safety Bias</Label>
            <Badge variant="outline" className="text-xs text-emerald-400">
              {profile.yieldVsSafety > 0.5 ? "Yield Seeker" : "Safety Seeker"}
            </Badge>
          </div>
          <Slider
            value={[profile.yieldVsSafety * 100]}
            max={100}
            step={1}
            disabled={disabled}
            onValueChange={(val) => setProfile({ ...profile, yieldVsSafety: val[0] / 100 })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Capital Safety Priority</span>
            <span>Yield & Appreciation Priority</span>
          </div>
        </div>

        {/* Investment Horizon Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-foreground">Investment Horizon</Label>
          <div className="flex flex-wrap gap-2">
            {["Ready", "1-2yr", "3-5yr", "10yr+"].map((h) => (
              <button
                key={h}
                disabled={disabled}
                onClick={() => setProfile({ ...profile, horizon: h })}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  profile.horizon === h
                    ? "border-accent bg-accent/10 text-accent shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-8">
        <Button
          onClick={handleSave}
          disabled={loading || disabled}
          className="flex h-10 min-w-32 items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Strategy
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setSimulationMode(!simulationMode)}
          disabled={disabled}
          className="flex h-10 items-center gap-2"
        >
          {simulationMode ? <BarChart3 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
          {simulationMode ? "Hide Simulation" : "Simulate Impact"}
        </Button>
        {saved && (
          <span className="text-xs font-medium text-emerald-500 animate-in fade-in slide-in-from-left-2">
            Strategic profile updated and synchronized.
          </span>
        )}
      </div>

      {simulationMode && (
        <div className="rounded-xl border border-border bg-secondary/20 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-accent" />
              Live Match Simulation
            </h3>
            <span className="text-xs text-muted-foreground">
              See how your settings rank real-world project archetypes
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulatedProjects.map((project) => (
              <div key={project.slug} className="relative">
                <div className="absolute -top-3 right-4 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Match: {project.match_score}%
                </div>
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
