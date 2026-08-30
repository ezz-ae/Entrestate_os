"use client"

/**
 * ONE NARRATION FOR THE ONE CHAT.
 *
 * The owner, seeing the /markets desk narrate its steps while the main chat
 * stayed silent: "مينفعش يكون عندنا ميت شات — هو واحد بس ويكون ملم بكل شيء،
 * اللي أعمله هنا ألاقيه هناك." The steps timeline, the conclusion-first
 * bubble and the report popup were built once inside the Explorer desk and
 * belonged to nobody else. They live here now, and every chat surface — the
 * sidebar, /chat, /markets — renders THIS.
 *
 * The narration reads the AI SDK's own UIMessage tool parts, so it needs no
 * second transport: any surface on useChat/useCopilot already receives the
 * tool-call lifecycle these components narrate. Labels come from
 * lib/chat/steps (human words, both languages, never a tool name) and the
 * final text passes through lib/chat/final-text (no code glossed in
 * parentheses, fixed lines in the answer's own language) — the same door the
 * server route uses, applied again where the text meets the reader.
 */

import type React from "react"
import { useState } from "react"
import { Check, ChevronDown, FileText, Loader2, X } from "lucide-react"
import {
  stepDetail,
  stepDoneLabel,
  stepResultCount,
  stepRunningLabel,
} from "@/lib/chat/steps"
import { answerLocale, humanizeFinalText } from "@/lib/chat/final-text"

export type NarrationStep = {
  id: string
  label: string
  status: "running" | "done"
  detail?: string | null
}

type UiPart = {
  type?: string
  state?: string
  toolCallId?: string
  toolName?: string
  output?: unknown
  result?: unknown
}

/**
 * UIMessage tool parts → human steps. `tool-deal_screener` in state
 * input-streaming/input-available is a step in flight; output-available is a
 * step done, counted and detailed in the asker's language. A part shape this
 * mapper does not recognise narrates as nothing rather than as JSON.
 */
export function extractToolSteps(message: { parts?: unknown[] }, locale: string): NarrationStep[] {
  const parts = Array.isArray(message?.parts) ? (message.parts as UiPart[]) : []
  const steps: NarrationStep[] = []

  for (const part of parts) {
    if (typeof part?.type !== "string") continue
    let toolName: string | null = null
    if (part.type === "dynamic-tool" && typeof part.toolName === "string") {
      toolName = part.toolName
    } else if (part.type.startsWith("tool-")) {
      toolName = part.type.slice("tool-".length)
    }
    if (!toolName) continue

    const id = part.toolCallId ?? `${toolName}-${steps.length}`
    const output = part.output ?? part.result
    const done = part.state === "output-available" || part.state === "output-error" || output !== undefined

    steps.push(
      done
        ? {
            id,
            status: "done",
            label: stepDoneLabel(toolName, stepResultCount(output), locale),
            detail: stepDetail(output, locale),
          }
        : {
            id,
            status: "running",
            label: stepRunningLabel(toolName, locale),
          },
    )
  }

  return steps
}

export function ToolStepsTimeline({ steps, streaming }: { steps: NarrationStep[]; streaming?: boolean }) {
  const [openStep, setOpenStep] = useState<string | null>(null)
  if (steps.length === 0) return null

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <ol className="space-y-1.5">
        {steps.map((step) => {
          const expandable = Boolean(step.detail)
          const isOpen = openStep === step.id
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!expandable}
                onClick={() => setOpenStep(isOpen ? null : step.id)}
                className={`flex w-full items-center gap-2 text-left text-xs ${expandable ? "cursor-pointer" : "cursor-default"}`}
              >
                {step.status === "done" ? (
                  <Check className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-accent" />
                )}
                <span className={step.status === "done" ? "text-muted-foreground" : "text-foreground"}>
                  {step.label}
                </span>
                {expandable ? (
                  <ChevronDown
                    className={`ml-auto h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                ) : null}
              </button>
              {isOpen && step.detail ? (
                <p className="mt-1 pl-5 text-[11px] leading-relaxed text-muted-foreground">{step.detail}</p>
              ) : null}
            </li>
          )
        })}
        {streaming && steps.every((step) => step.status === "done") ? (
          <li className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            <span>…</span>
          </li>
        ) : null}
      </ol>
    </div>
  )
}

/**
 * The bubble shows the CONCLUSION; the organized statement opens as a report.
 * Splitting on the first blank line needs no protocol with the model — the
 * prompt asks for "conclusion first, then the detail", and whatever arrives,
 * the first paragraph is the most conclusion-like thing in it.
 */
export function splitAnswer(content: string): { conclusion: string; report: string | null } {
  const trimmed = content.trim()
  const gap = trimmed.search(/\n\s*\n/)
  if (gap === -1) return { conclusion: trimmed, report: null }
  return { conclusion: trimmed.slice(0, gap).trim(), report: trimmed }
}

function ReportModal({
  content,
  isArabic,
  render,
  onClose,
}: {
  content: string
  isArabic: boolean
  render: (text: string) => React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">{isArabic ? "نتيجة البحث" : "Search result"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-foreground">{render(content)}</div>
      </div>
    </div>
  )
}

/**
 * The advisor's answer as the owner specified it: while streaming, the text
 * runs whole; once final, the bubble keeps the conclusion and the organized
 * statement opens as a popup report. The text passes through the final-text
 * door here too, so a surface whose transport bypassed the server door still
 * shows no glossed code and closes in the asker's language.
 */
export function AdvisorAnswer({
  text,
  streaming,
  render,
}: {
  text: string
  streaming?: boolean
  render: (text: string) => React.ReactNode
}) {
  const [reportOpen, setReportOpen] = useState(false)
  if (!text?.trim()) return null

  const clean = streaming ? text : humanizeFinalText(text)
  const isArabic = answerLocale(clean, "en") === "ar"
  const { conclusion, report } = splitAnswer(clean)

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      {render(streaming ? clean : conclusion)}
      {!streaming && report ? (
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <FileText className="h-3.5 w-3.5" />
          {isArabic ? "عرض التقرير الكامل" : "View the full report"}
        </button>
      ) : null}
      {reportOpen && report ? (
        <ReportModal content={clean} isArabic={isArabic} render={render} onClose={() => setReportOpen(false)} />
      ) : null}
    </div>
  )
}
