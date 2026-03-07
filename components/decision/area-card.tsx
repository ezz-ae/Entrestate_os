import Link from "next/link"
import { MapPin } from "lucide-react"
import { formatAed, formatYield } from "@/components/decision/formatters"

type AreaCardProps = {
  slug: string
  area: string
  projects?: number | null
  city?: string | null
  avg_price?: number | null
  avg_yield?: number | null
  image_url?: string | null
  top_projects?: string[] | null
}

const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  dubai: { lat: 25.2048, lon: 55.2708 },
  "abu dhabi": { lat: 24.4539, lon: 54.3773 },
  sharjah: { lat: 25.3463, lon: 55.4209 },
  ajman: { lat: 25.4052, lon: 55.5136 },
  "ras al khaimah": { lat: 25.8007, lon: 55.9762 },
  fujairah: { lat: 25.1288, lon: 56.3265 },
  "umm al quwain": { lat: 25.5647, lon: 55.5552 },
}

function hashToUnit(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return (hash % 1000) / 999
}

function tileCoordinate(latitude: number, longitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180
  const n = 2 ** zoom
  const x = Math.floor(((longitude + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y }
}

function slugifyProject(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function buildStaticMapTileUrl(areaName: string, city?: string | null) {
  const normalizedCity = (city ?? "dubai").toLowerCase().trim()
  const center = CITY_CENTERS[normalizedCity] ?? CITY_CENTERS.dubai
  const jitterLat = (hashToUnit(`${areaName}-lat`) - 0.5) * 0.18
  const jitterLon = (hashToUnit(`${areaName}-lon`) - 0.5) * 0.22
  const lat = Math.min(Math.max(center.lat + jitterLat, 22.8), 26.7)
  const lon = Math.min(Math.max(center.lon + jitterLon, 51.8), 56.9)
  const zoom = 11
  const { x, y } = tileCoordinate(lat, lon, zoom)
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}

export function AreaCard(area: AreaCardProps) {
  const mapImageUrl = buildStaticMapTileUrl(area.area, area.city)
  const topProjects = Array.isArray(area.top_projects) ? area.top_projects.slice(0, 4) : []

  return (
    <article className="group relative isolate block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
      {/* Map image */}
      <div className="relative h-36 overflow-hidden bg-muted/30">
        <img
          src={mapImageUrl}
          alt={`Map of ${area.area}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: "saturate(0.85) brightness(0.95)" }}
        />
        {/* Gradient over map */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        {/* Map pin */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-primary shadow-md" />
            <div className="absolute h-6 w-6 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        </div>
        {/* City label */}
        {area.city ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5" />
            {area.city}
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Area name + project count */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-foreground">{area.area}</p>
          {area.projects ? (
            <span className="flex-shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {area.projects} projects
            </span>
          ) : null}
        </div>

        {/* Key metrics — always visible */}
        <div className="mt-3 flex gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Price</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatAed(area.avg_price)}</p>
          </div>
          <div className="h-auto w-px bg-border/60" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Yield</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatYield(area.avg_yield)}
            </p>
          </div>
        </div>

        {/* Hover reveal — top projects */}
        {topProjects.length > 0 ? (
          <div className="mt-3 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Top Projects</p>
              <div className="flex flex-wrap gap-1.5">
                {topProjects.map((project) => (
                  <Link
                    key={`${area.slug}-${project}`}
                    href={`/properties/${slugifyProject(project)}`}
                    className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {project}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Link href={`/areas/${area.slug}`} className="absolute inset-0 z-10" aria-label={`Open ${area.area} area details`} />
    </article>
  )
}
