type OverlayState = {
  root: HTMLDivElement
  close: () => void
}

type WidgetAttributes = {
  interaction: "overlay" | "redirect"
  leadMagnet: boolean
  leadWebhook: string | null
}

type InitOptions = {
  apiBase?: string
}

const DEFAULT_API_BASE = ""

function readAttributes(container: HTMLElement): WidgetAttributes {
  const interactionRaw = container.getAttribute("data-interaction")?.toLowerCase().trim() ?? "overlay"
  return {
    interaction: interactionRaw === "redirect" ? "redirect" : "overlay",
    leadMagnet: container.getAttribute("data-lead-magnet") === "true",
    leadWebhook: container.getAttribute("data-lead-webhook"),
  }
}

function openFallbackTab() {
  window.open("/chat?ref=widget", "_blank", "noopener,noreferrer")
}

function createOverlay(title: string, body: string): OverlayState {
  const backdrop = document.createElement("div")
  backdrop.setAttribute("data-entrestate-overlay", "true")
  backdrop.style.position = "fixed"
  backdrop.style.inset = "0"
  backdrop.style.background = "rgba(2, 6, 23, 0.55)"
  backdrop.style.zIndex = "2147483646"
  backdrop.style.display = "flex"
  backdrop.style.alignItems = "center"
  backdrop.style.justifyContent = "center"
  backdrop.style.padding = "16px"

  const panel = document.createElement("div")
  panel.style.maxWidth = "640px"
  panel.style.width = "100%"
  panel.style.background = "#ffffff"
  panel.style.borderRadius = "12px"
  panel.style.border = "1px solid #e2e8f0"
  panel.style.padding = "16px"
  panel.style.boxShadow = "0 20px 50px rgba(2, 6, 23, 0.25)"

  const heading = document.createElement("h3")
  heading.textContent = title
  heading.style.margin = "0"
  heading.style.font = "600 18px/1.4 Inter, Arial, sans-serif"
  heading.style.color = "#0f172a"

  const text = document.createElement("p")
  text.textContent = body
  text.style.margin = "10px 0 0"
  text.style.font = "400 14px/1.5 Inter, Arial, sans-serif"
  text.style.color = "#334155"

  const closeButton = document.createElement("button")
  closeButton.type = "button"
  closeButton.textContent = "Close"
  closeButton.style.marginTop = "14px"
  closeButton.style.border = "1px solid #cbd5e1"
  closeButton.style.borderRadius = "8px"
  closeButton.style.background = "#ffffff"
  closeButton.style.padding = "8px 12px"
  closeButton.style.cursor = "pointer"

  panel.append(heading, text, closeButton)
  backdrop.append(panel)

  const close = () => {
    backdrop.remove()
  }

  closeButton.addEventListener("click", close)
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close()
  })

  document.body.appendChild(backdrop)

  return { root: backdrop, close }
}

async function submitDualCapture(apiBase: string, webhook: string | null, email: string) {
  const signupUrl = `${apiBase}/api/signup?tier=free&source=widget`
  const body = JSON.stringify({ email })

  const tasks: Promise<unknown>[] = [
    fetch(signupUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }),
  ]

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        mode: "cors",
        keepalive: true,
      }),
    )
  }

  await Promise.allSettled(tasks)
}

function mountWidget(container: HTMLElement, options: InitOptions) {
  const apiBase = options.apiBase ?? DEFAULT_API_BASE
  const attrs = readAttributes(container)

  const wrapper = document.createElement("div")
  wrapper.style.fontFamily = "Inter, Arial, sans-serif"
  wrapper.style.border = "1px solid #e2e8f0"
  wrapper.style.borderRadius = "12px"
  wrapper.style.padding = "12px"
  wrapper.style.background = "#ffffff"

  const title = document.createElement("div")
  title.textContent = "Market evidence widget"
  title.style.fontSize = "14px"
  title.style.fontWeight = "600"
  title.style.color = "#0f172a"

  const action = document.createElement("button")
  action.type = "button"
  action.textContent = "Open evidence drawer"
  action.style.marginTop = "10px"
  action.style.border = "0"
  action.style.borderRadius = "8px"
  action.style.background = "#0f172a"
  action.style.color = "#ffffff"
  action.style.padding = "9px 12px"
  action.style.cursor = "pointer"

  action.addEventListener("click", () => {
    if (attrs.interaction === "overlay") {
      try {
        createOverlay("Evidence Drawer", "You are viewing evidence without leaving the broker page.")
        window.dispatchEvent(new CustomEvent("open_evidence_drawer"))
        return
      } catch {
        openFallbackTab()
        return
      }
    }
    openFallbackTab()
  })

  wrapper.append(title, action)

  if (attrs.leadMagnet) {
    const form = document.createElement("form")
    form.style.marginTop = "12px"
    form.style.display = "flex"
    form.style.gap = "8px"

    const input = document.createElement("input")
    input.type = "email"
    input.required = true
    input.placeholder = "you@company.com"
    input.style.flex = "1"
    input.style.border = "1px solid #cbd5e1"
    input.style.borderRadius = "8px"
    input.style.padding = "8px"

    const submit = document.createElement("button")
    submit.type = "submit"
    submit.textContent = "Get report"
    submit.style.border = "1px solid #cbd5e1"
    submit.style.borderRadius = "8px"
    submit.style.background = "#f8fafc"
    submit.style.padding = "8px 10px"
    submit.style.cursor = "pointer"

    form.addEventListener("submit", async (event) => {
      event.preventDefault()
      if (!input.value) return
      submit.disabled = true
      await submitDualCapture(apiBase, attrs.leadWebhook, input.value)
      submit.disabled = false
      createOverlay("Request received", "We sent your details for broker follow-up and Entrestate access.")
    })

    form.append(input, submit)
    wrapper.append(form)
  }

  container.replaceChildren(wrapper)
}

export function initEntrestateWidgets(options: InitOptions = {}) {
  const containers = Array.from(document.querySelectorAll<HTMLElement>("[data-entrestate-widget]"))
  containers.forEach((container) => mountWidget(container, options))
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initEntrestateWidgets())
  } else {
    initEntrestateWidgets()
  }
}
