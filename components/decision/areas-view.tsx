"use client"

import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"
import { DecisionRecord } from "@/lib/decision-infrastructure"
import { AreaCard } from "./area-card"

const AreaMap = dynamic(() => import("./area-map").then((m) => m.AreaMap), { ssr: false })

type AreasViewProps = {
  areas: Array<DecisionRecord & { slug: string }>;
};

export function AreasView({ areas }: AreasViewProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <AreaMap areas={areas} />;
  }

  return (
    <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(20,184,166,0.22),transparent_58%)]" />
      {areas.map((area, index) => (
        <AreaCard
          key={`${String(area.slug)}-${index}`}
          slug={String(area.slug)}
          area={String(area.area ?? "Area")}
          projects={typeof area.projects === "number" ? area.projects : null}
          city={typeof area.city === "string" ? area.city : null}
          avg_price={typeof area.avg_price === "number" ? area.avg_price : null}
          avg_yield={typeof area.avg_yield === "number" ? area.avg_yield : null}
          image_url={typeof area.image_url === "string" ? area.image_url : null}
          top_projects={
            Array.isArray(area.top_projects)
              ? area.top_projects.filter((item): item is string => typeof item === "string")
              : null
          }
        />
      ))}
    </section>
  );
}
