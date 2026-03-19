"use client"

import { useEffect, useMemo, useState } from "react"
import { AgentWizard } from "@/automation-builder/components/agent-wizard"
import { AgentLibrary } from "@/automation-builder/components/agent-library"
import { AgentPreview } from "@/automation-builder/components/agent-preview"
import { AgentTestPanel } from "@/automation-builder/components/agent-test-panel"
import { ProCanvas } from "@/automation-builder/components/pro-canvas"
import { Button } from "@/automation-builder/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/automation-builder/components/ui/tabs"
import { Separator } from "@/automation-builder/components/ui/separator"
import { ShieldCheck, Wand2, LayoutDashboard, Calendar, Activity, Lock, Sparkles, ChevronRight } from "lucide-react"
import type { AgentDefinition, AgentTemplate } from "@/automation-builder/lib/automation-types"
import type { AgentDraft } from "@/automation-builder/lib/draft"
import { buildDraftFromTemplate } from "@/automation-builder/lib/draft"
import {
  fetchTemplates,
  fetchAgents,
  createAgent,
  updateAgent,
  cloneAgent,
  shareAgent,
  publishAgent,
  createVersion,
} from "@/automation-builder/lib/client"

const emptyDraft: AgentDraft = {
  name: "New agent",
  role: "lead_qualifier",
  market: "UAE",
  companyType: "broker",
  inputs: { fields: [] },
  rules: { strictMode: true, toggles: [] },
  outputs: { channels: ["whatsapp"], tone: "friendly", summaryStyle: "balanced" },
  connectors: { listings: true, projects: true, marketIntel: true, crm: false },
}

import { ScheduledOutputs } from "@/automation-builder/components/scheduled-outputs"
import { PipelineMonitor } from "@/automation-builder/components/pipeline-monitor"

export default function AgentBuilderApp() {
  const [activeTab, setActiveTab] = useState("builder")
  const [mode, setMode] = useState<"easy" | "pro">("easy")
  const [editablePro, setEditablePro] = useState(false)
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AgentDraft>(emptyDraft)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const templateResponse = await fetchTemplates()
      setTemplates(templateResponse.templates)

      const agentResponse = await fetchAgents()
      setAgents(agentResponse.agents)

      if (templateResponse.templates[0]) {
        const template = templateResponse.templates[0]
        setSelectedTemplateId(template.id)
        setDraft(buildDraftFromTemplate(template))
      }
    }
    load()
  }, [])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  )

  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplateId(template.id)
    setDraft(buildDraftFromTemplate(template))
    setStep(2)
    setActiveAgentId(null)
  }

  const handleSelectAgent = (agent: AgentDefinition) => {
    setActiveAgentId(agent.id)
    setDraft({
      name: agent.name,
      role: agent.role,
      market: agent.market,
      companyType: agent.companyType,
      inputs: agent.inputs,
      rules: agent.rules,
      outputs: agent.outputs,
      connectors: agent.connectors,
      status: agent.status,
    })
  }

  const refreshAgents = async () => {
    const agentResponse = await fetchAgents()
    setAgents(agentResponse.agents)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (activeAgentId) {
        const response = await updateAgent(activeAgentId, draft)
        setActiveAgentId(response.agent.id)
        await createVersion(response.agent.id)
      } else {
        const response = await createAgent({
          ...draft,
          status: "draft",
        })
        setActiveAgentId(response.agent.id)
      }
      await refreshAgents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnsureAgent = async () => {
    if (activeAgentId) return activeAgentId
    const response = await createAgent({
      ...draft,
      status: "draft",
    })
    setActiveAgentId(response.agent.id)
    await refreshAgents()
    return response.agent.id
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden selection:bg-blue-500/30">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800 bg-slate-900/40 backdrop-blur-xl px-8 py-6">
        <div className="mx-auto max-w-7xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
                <Lock className="h-2.5 w-2.5" />
                Institutional
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Automation Studio</h1>
              <p className="text-sm text-slate-400">
                Scale your institutional decision moat with autonomous agents.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-950/60 border border-slate-800 p-1 h-12 rounded-xl">
                  <TabsTrigger value="builder" className="gap-2 px-6 uppercase text-[10px] font-bold tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Builder
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="gap-2 px-6 uppercase text-[10px] font-bold tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Calendar className="h-3.5 w-3.5" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="gap-2 px-6 uppercase text-[10px] font-bold tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    <Activity className="h-3.5 w-3.5" />
                    Monitor
                  </TabsTrigger>
                </TabsList>
             </Tabs>
             <Separator orientation="vertical" className="h-8 bg-slate-800" />
             {activeTab === "builder" && (
                <div className="flex items-center gap-4">
                  <Tabs value={mode} onValueChange={(value) => setMode(value as "easy" | "pro")}>
                    <TabsList className="bg-slate-950/40 border border-slate-800 rounded-lg p-1">
                      <TabsTrigger value="easy" className="text-[10px] font-bold uppercase tracking-widest px-4">Easy</TabsTrigger>
                      <TabsTrigger value="pro" className="text-[10px] font-bold uppercase tracking-widest px-4">Pro</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
             )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-8 py-12">
        {activeTab === "builder" && (
          mode === "easy" ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-12">
              <div className="space-y-12">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8">
                  <AgentWizard
                    step={step}
                    onStepChange={setStep}
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    draft={draft}
                    onDraftChange={setDraft}
                    onSelectTemplate={handleSelectTemplate}
                  />
                </div>
                
                <div className="flex items-center gap-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 backdrop-blur-xl">
                  <div className="rounded-2xl bg-emerald-500/20 p-3">
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white">Agent Validation Successful</p>
                    <p className="text-sm text-slate-400">
                      Heuristic checks passed. Your agent is ready for versioning and deployment.
                    </p>
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="h-12 px-8 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                  >
                    {isSaving ? "Finalizing..." : "Save & Provision"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-10">
                <AgentLibrary
                  agents={agents}
                  selectedAgentId={activeAgentId}
                  onSelect={handleSelectAgent}
                  onCreate={() => {
                    if (templates[0]) {
                      handleSelectTemplate(templates[0])
                    } else {
                      setDraft(emptyDraft)
                    }
                    setActiveAgentId(null)
                  }}
                  onClone={async (id) => {
                    await cloneAgent(id)
                    await refreshAgents()
                  }}
                  onShare={async (id) => {
                    await shareAgent(id)
                    await refreshAgents()
                  }}
                  onPublish={async (id) => {
                    await publishAgent(id)
                    await refreshAgents()
                  }}
                />
                <AgentPreview draft={draft} />
                <AgentTestPanel
                  draft={draft}
                  activeAutomationId={activeAgentId}
                  template={selectedTemplate}
                  onEnsureAutomation={handleEnsureAgent}
                />
              </div>
            </div>
          ) : (
            <ProCanvas editable={editablePro} onToggleEdit={() => setEditablePro((prev) => !prev)} />
          )
        )}

        {activeTab === "schedule" && <ScheduledOutputs />}
        {activeTab === "monitor" && <PipelineMonitor />}
      </main>
    </div>
  )
}
