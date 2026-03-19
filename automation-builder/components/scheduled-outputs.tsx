"use client"

import React from "react"
import { Calendar, Clock, FileText, MoreVertical, Play, Pause, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"

const SCHEDULES = [
  {
    id: "1",
    name: "Weekly Portfolio Brief",
    agent: "Investment Analysis Agent",
    schedule: "Every Monday at 08:00",
    lastRun: "2024-03-11 08:00",
    status: "active",
    outputs: "PDF Memo",
  },
  {
    id: "2",
    name: "Daily Lead Qualification",
    agent: "Lead Qualifier Pro",
    schedule: "Daily at 09:00, 18:00",
    lastRun: "2024-03-18 18:00",
    status: "active",
    outputs: "CRM Sync",
  },
  {
    id: "3",
    name: "Monthly Market Scan",
    agent: "Macro Trend Bot",
    schedule: "1st of every month",
    lastRun: "2024-03-01 00:00",
    status: "paused",
    outputs: "Excel Report",
  },
]

export function ScheduledOutputs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Scheduled Outputs</h2>
          <p className="text-sm text-muted-foreground">Manage recurring automation tasks and delivery schedules.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Calendar className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4">Automation Name</th>
              <th className="px-6 py-4">Agent</th>
              <th className="px-6 py-4">Frequency</th>
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SCHEDULES.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary/60" />
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{s.agent}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {s.schedule}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{s.lastRun}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    s.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {s.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {s.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
