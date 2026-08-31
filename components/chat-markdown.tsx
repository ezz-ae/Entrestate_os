"use client"

import type React from "react"

/**
 * THE ONE PLACE AN ASSISTANT ANSWER TURNS INTO A SCREEN.
 *
 * Four surfaces show an answer from the same model — the Decision Terminal
 * chat, the Explorer Desk on /markets, Ground Plays, and the lead agent — and
 * before this module each did its own thing. Three of them rendered the answer
 * as <p>{content}</p>, so a COMPARE answer, which the system prompt asks for as
 * a markdown table, arrived on /markets as one grey paragraph of pipes:
 *
 *   | Project | Area | Price | Yield | ... |---|---|---| | Westwood Grande ...
 *
 * The data was right, the query was right, and the answer was unreadable. The
 * fourth surface had a private markdown renderer with headings and lists — and
 * no table branch, the one construct the prompt asks the model to produce.
 *
 * So there is one renderer, exported, and the surfaces call it. Adding a
 * construct here fixes it everywhere, which is the whole argument against the
 * four private copies this replaces.
 *
 * Deliberately hand-written rather than a markdown dependency: the input is not
 * arbitrary documentation, it is our own prompt's output — headings, bullets,
 * numbered steps, inline emphasis, code and pipe tables — and every branch here
 * is asserted in tests/chat-markdown.test.ts against the exact shapes the
 * prompt asks for. Nothing is rendered as HTML, so nothing a model emits can
 * become markup.
 */

function inlineFormat(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*")) return <em key={idx}>{part.slice(1, -1)}</em>
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={idx} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
          {part.slice(1, -1)}
        </code>
      )
    return part
  })
}

/** A markdown table row: at least one pipe, and pipes at both ends after trim. */
function isTableRow(line: string): boolean {
  const t = line.trim()
  return t.startsWith("|") && t.endsWith("|") && t.length > 2
}

/** The |---|:--:|---| separator that makes the line above it a header. */
function isTableDivider(line: string): boolean {
  const t = line.trim()
  return isTableRow(t) && /^\|[\s:|-]+\|$/.test(t) && t.includes("-")
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim())
}

/**
 * "قدام كل نتيجة زرار تخليه يكمل على النتيجة دي" — the owner, looking at a
 * results table. A row in a COMPARE or SCREEN answer is a thing a person
 * wants to keep talking about, so when the surface hands in `onPickRow`, every
 * body row whose first cell is a name (not a number) grows a trailing button
 * that sends that name back into the ONE chat. The button's language follows
 * the table's own text, not the page locale — an Arabic answer on /en gets an
 * Arabic button. Without `onPickRow` the table renders exactly as before.
 */
export type ChatMarkdownProps = {
  text: string
  /** Called with the row's first-cell label — the surface turns it into a follow-up. */
  onPickRow?: (label: string) => void
}

const looksLikeName = (cell: string): boolean => {
  const t = cell.replace(/\*\*/g, "").trim()
  if (!t) return false
  return !/^[\d\s.,%+\-–—/]+$/.test(t)
}

export function ChatMarkdown({ text, onPickRow }: ChatMarkdownProps) {
  const arabic = /[\u0600-\u06FF]/.test(text)
  const pickLabel = arabic ? "كمّل على ده" : "Continue with this"
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Table ────────────────────────────────────────────────────────────────
    // A header row followed by a divider. Without the divider a lone pipe line
    // is just prose that happens to contain a pipe, and is left alone.
    if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const header = splitCells(line)
      const rows: string[][] = []
      let j = i + 2
      while (j < lines.length && isTableRow(lines[j]) && !isTableDivider(lines[j])) {
        rows.push(splitCells(lines[j]))
        j++
      }
      nodes.push(
        // The table scrolls inside its own box: these land in a chat column
        // roughly 340px wide and a COMPARE answer is eight columns, so without
        // this the page itself scrolls sideways.
        <div key={`t-${i}`} className="my-2 overflow-x-auto rounded-md border border-border/60">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-muted/50">
                {header.map((cell, c) => (
                  <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-medium text-foreground/80">
                    {inlineFormat(cell)}
                  </th>
                ))}
                {onPickRow ? <th className="px-2.5 py-1.5" aria-label={pickLabel} /> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-t border-border/40">
                  {header.map((_, c) => (
                    <td key={c} className="whitespace-nowrap px-2.5 py-1.5 text-foreground">
                      {inlineFormat(row[c] ?? "")}
                    </td>
                  ))}
                  {onPickRow ? (
                    <td className="whitespace-nowrap px-2.5 py-1">
                      {looksLikeName(row[0] ?? "") ? (
                        <button
                          type="button"
                          onClick={() => onPickRow(row[0].replace(/\*\*/g, "").trim())}
                          className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          {pickLabel} →
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      i = j
      continue
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/80">
          {inlineFormat(line.slice(4))}
        </p>,
      )
    } else if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} className="mt-4 mb-1.5 border-b border-border/40 pb-1 text-sm font-bold text-foreground">
          {inlineFormat(line.slice(3))}
        </p>,
      )
    } else if (line.startsWith("# ")) {
      nodes.push(
        <p key={i} className="mt-4 mb-1.5 text-base font-bold text-foreground">
          {inlineFormat(line.slice(2))}
        </p>,
      )
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(
          <li key={i} className="leading-relaxed">
            {inlineFormat(lines[i].slice(2))}
          </li>,
        )
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-2 ml-4 list-disc space-y-0.5 text-sm">
          {items}
        </ul>,
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          <li key={i} className="leading-relaxed">
            {inlineFormat(lines[i].replace(/^\d+\. /, ""))}
          </li>,
        )
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-2 ml-4 list-decimal space-y-0.5 text-sm">
          {items}
        </ol>,
      )
      continue
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(
        <p key={i} className="text-sm leading-relaxed">
          {inlineFormat(line)}
        </p>,
      )
    }
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}
