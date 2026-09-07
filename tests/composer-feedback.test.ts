import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * PRESSING SEND LOOKS LIKE SENDING — locked.
 *
 * The owner, on the chat: "you send something to the AI — you send it and it
 * stays in the text box raw. It goes and waits, and it leaves you not
 * understanding." Two separate causes, both of them the product failing to
 * say what it was doing.
 *
 *   1. THE BOX DID NOT EMPTY. Every composer did
 *
 *          const submitted = await sendPrompt(value)
 *          if (submitted) setInput("")
 *
 *      and `sendPrompt` awaits the AI SDK's `sendMessage`, which resolves only
 *      when the WHOLE streamed reply has finished. So the typed words sat in
 *      the composer for the entire answer: the sentence appears twice, once in
 *      the thread and once still in the box, and pressing send looks like it
 *      did nothing. The box is now emptied first and the words are put BACK
 *      only if the send failed — which is the one case the reader still needs
 *      them. `activateSlashCommand` in ChatInterface always did it this way.
 *
 *   2. NOTHING MOVED UNTIL THE FIRST TOKEN. The AI SDK's status is "submitted"
 *      from the moment the request leaves until the first token arrives, and
 *      for a question that runs tool calls against the database that is the
 *      longest part of the wait. ChatInterface keyed its typing dots, its
 *      status pill and its send button on `status === "streaming"` alone, so
 *      through all of it the screen was still, the pill said "Ready" and the
 *      button said "Send" while refusing to be pressed. All three now read
 *      `isBusy`, which is what the sidebar's thread already used.
 *
 * Pure — no network, no database.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

const COMPOSERS = ["components/ChatInterface.tsx", "components/llm-search/sidebar.tsx"] as const

describe("the box empties when the message leaves", () => {
  it("no composer waits for the answer before clearing", () => {
    for (const rel of COMPOSERS) {
      const src = stripComments(read(rel))
      // The exact shape of the bug: await the send, then clear on success.
      expect(src, rel).not.toMatch(/const submitted = await sendPrompt\([^)]*\)\s*\n\s*if \(submitted\) \{?\s*\n?\s*setInput\(""\)/)
      expect(src, rel).not.toMatch(/\.then\(\(sent\) => \{\s*\n?\s*if \(sent\) \{?\s*setInput\(""\)/)
    }
  })

  it("…it clears first and restores the words only when the send failed", () => {
    for (const rel of COMPOSERS) {
      const src = stripComments(read(rel))
      expect(src, rel).toMatch(/setInput\(""\)\s*\n\s*const submitted = await sendPrompt\(value\)\s*\n\s*if \(!submitted\) setInput\(value\)/)
    }
  })

  it("a prompt arriving in the URL is sent, not typed into the box", () => {
    for (const rel of COMPOSERS) {
      const src = stripComments(read(rel))
      expect(src, rel).toMatch(/void sendPrompt\(promptParam\)\.then\(\(sent\) => \{\s*\n\s*if \(!sent\) setInput\(promptParam\)/)
    }
  })

  it("…unless a conversation is already open, where it is an invitation to edit", () => {
    const chat = stripComments(read("components/ChatInterface.tsx"))
    expect(chat).toMatch(/if \(hasConversation\) \{[\s\S]{0,200}setInput\(promptParam\)[\s\S]{0,40}return/)
  })
})

describe("the wait is visible from the moment of sending", () => {
  const chat = stripComments(read("components/ChatInterface.tsx"))

  it("isBusy covers the pre-token wait", () => {
    expect(chat).toContain('const isBusy = status === "submitted" || status === "streaming"')
  })

  it("the typing dots appear on isBusy, not only while tokens arrive", () => {
    expect(chat).toMatch(/\{isBusy \? \(\s*\n\s*<div className="mr-auto max-w-\[92%\]">/)
  })

  it("the header pill does not say Ready while the request is in flight", () => {
    expect(chat).toMatch(/\$\{isBusy \? "text-primary" : "text-muted-foreground"\}/)
    expect(chat).toMatch(/\{isBusy \? heroCopy\.analysing : heroCopy\.ready\}/)
  })

  it("the send button looks disabled while it is disabled", () => {
    // submitBlocked already includes isBusy; the label and spinner now agree.
    expect(chat).toContain("const submitBlocked = input.trim().length === 0 || chatBlocked || isBusy")
    expect(chat).toMatch(/\{isBusy \? \(\s*\n\s*<Loader2 className="h-4 w-4 animate-spin" \/>/)
    expect(chat).toMatch(/\{isBusy \? \(locale === "ar" \? "جارٍ التحليل\.\.\." : "Analysing…"\)/)
  })

  it("nothing in either composer keys a waiting signal on streaming alone", () => {
    for (const rel of COMPOSERS) {
      const src = stripComments(read(rel))
      // A per-message "this one is still writing" flag is legitimate: it marks
      // WHICH bubble is growing. A whole-thread waiting signal is not.
      const wholeThread = src.match(/status === "streaming" \? \(\s*\n\s*<div className="mr-auto/g)
      expect(wholeThread, rel).toBeNull()
    }
  })
})
