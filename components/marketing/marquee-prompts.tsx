"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

const promptRows = [
  [
    "/screen 2BR under AED 2M with BUY signal",
    "Where should I invest for the highest rental yield in Dubai?",
    "/memo generate full investor brief for Marina Vista",
    "Explain the impact of the latest interest rate hike",
    "Show me projects eligible for the Golden Visa",
  ],
  [
    "/simulate 5.5% interest rate on a 3BR villa",
    "What is the current market sentiment in Business Bay?",
    "/risk analyze investment risks in JVC",
    "Draft a professional offer letter for a villa",
    "How does palm jumeirah capital growth compare to beachfront?",
  ],
  [
    "Find luxury penthouses with private pools in Downtown",
    "/compare Emaar vs Damac reliability scores",
    "/history search recent sales transactions in Palm Jumeirah",
    "What is the supply forecast for villas in Meydan?",
    "Show me the best secondary market deals in MBR City",
  ],
]

export function MarqueePrompts() {
  return (
    <div className="relative w-full overflow-hidden py-12 flex flex-col gap-8">
      {promptRows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative flex overflow-hidden">
          <motion.div
            className="flex gap-6 whitespace-nowrap"
            animate={{
              x: rowIndex % 2 === 0 ? [0, -1000] : [-1000, 0],
            }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 40 + rowIndex * 10,
                ease: "linear",
              },
            }}
            whileHover={{ scale: 0.98, opacity: 0.8 }}
          >
            {[...row, ...row, ...row].map((prompt, i) => (
              <Card 
                key={i} 
                className="inline-flex items-center justify-center px-6 py-4 min-w-[300px] h-[80px] text-center cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all bg-card/40 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-border/40 rounded-2xl group"
              >
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-normal line-clamp-2">
                  {prompt}
                </p>
              </Card>
            ))}
          </motion.div>
        </div>
      ))}
      
      {/* Dynamic side masks for "perfect" fade */}
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
    </div>
  )
}
