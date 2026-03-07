"use client"

import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendSmartChatMessage, setSmartChatState } from "@/lib/smart-chat-store"
import { Button } from "@/components/ui/button"

type ExplainWithChatProps = {
  prompt: string
  label?: string
  className?: string
  context?: { city?: string; area?: string }
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default"
}

export function ExplainWithChat({
  prompt,
  label = "Explain in chat",
  className,
  context,
  variant = "outline",
  size = "sm",
}: ExplainWithChatProps) {
  const handleClick = () => {
    setSmartChatState({ isOpen: true, isMinimized: false })
    void sendSmartChatMessage({
      query: `${prompt} Explain it in clear real estate language.`,
      quickSuggestions: [
        prompt,
        "Give me a short summary and key takeaways.",
        "Explain like I'm briefing a client.",
      ],
      context,
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </Button>
  )
}
