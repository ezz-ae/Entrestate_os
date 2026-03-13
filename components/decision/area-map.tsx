"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { areaCoordinates } from "@/lib/area-coordinates";
import { DecisionRecord } from "@/lib/decision-infrastructure";

type AreaMapProps = {
  areas: Array<DecisionRecord & { slug: string }>;
};

function formatAED(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `AED ${(value / 1_000).toFixed(0)}K`;
  return `AED ${value.toLocaleString()}`;
}

function yieldColor(yieldVal: number): string {
  if (yieldVal >= 7) return "#10b981";
  if (yieldVal >= 5) return "#14b8a6";
  return "#f59e0b";
}

export function AreaMap({ areas }: AreaMapProps) {
  const center: [number, number] = [25.118, 55.139];

  return (
    <>
      <style>{`
        .leaflet-popup-content-wrapper {
          background: hsl(222, 47%, 8%);
          border: 1px solid hsl(215, 20%, 18%);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          color: hsl(210, 20%, 90%);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip-container .leaflet-popup-tip {
          background: hsl(222, 47%, 8%);
          box-shadow: none;
        }
        .leaflet-popup-close-button {
          color: hsl(215, 20%, 60%) !important;
          top: 8px !important;
          right: 10px !important;
          font-size: 18px !important;
        }
        .leaflet-popup-close-button:hover {
          color: hsl(210, 20%, 90%) !important;
        }
        .leaflet-container {
          background: #0d1117;
          font-family: inherit;
          position: relative;
          z-index: 0;
        }
        .leaflet-pane,
        .leaflet-top,
        .leaflet-bottom {
          z-index: 10;
        }
        .leaflet-control-attribution {
          background: rgba(13, 17, 23, 0.7) !important;
          color: #475569 !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #64748b !important;
        }
        .leaflet-control-zoom a {
          background: hsl(222, 47%, 10%) !important;
          color: hsl(210, 20%, 80%) !important;
          border-color: hsl(215, 20%, 18%) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(222, 47%, 14%) !important;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={11}
        style={{
          height: "calc(100dvh - 64px)",
          width: "100%",
          marginTop: "64px",
          position: "relative",
          zIndex: 0,
        }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {areas.map((area) => {
          const areaName = String(area.area ?? "").toLowerCase();
          const coords = areaCoordinates[areaName];
          if (!coords) return null;

          const hasYield = typeof area.avg_yield === "number";
          const yieldVal = hasYield ? (area.avg_yield as number) : 0;
          const color = yieldColor(yieldVal);
          const projectCount = typeof area.projects === "number" ? (area.projects as number) : 0;
          const radius = Math.max(8, Math.min(22, 8 + projectCount * 0.4));

          return (
            <CircleMarker
              key={area.slug}
              center={[coords.lat, coords.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 2,
                opacity: 0.9,
              }}
            >
              <Popup>
                <div style={{ minWidth: "170px", padding: "12px 14px", fontFamily: "inherit" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "10px", color: "#e2e8f0", letterSpacing: "0.01em" }}>
                    {String(area.area ?? "")}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {typeof area.avg_price === "number" && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                        <span style={{ fontSize: "11px", color: "#475569" }}>Avg. price</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                          {formatAED(area.avg_price as number)}
                        </span>
                      </div>
                    )}
                    {hasYield && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                        <span style={{ fontSize: "11px", color: "#475569" }}>Avg. yield</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color }}>
                          {yieldVal.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {projectCount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                        <span style={{ fontSize: "11px", color: "#475569" }}>Projects</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>{projectCount}</span>
                      </div>
                    )}
                    {typeof area.city === "string" && area.city && (
                      <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid hsl(215, 20%, 18%)" }}>
                        <span style={{ fontSize: "10px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {area.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "16px",
          zIndex: 1000,
          background: "hsl(222, 47%, 8%)",
          border: "1px solid hsl(215, 20%, 18%)",
          borderRadius: "10px",
          padding: "10px 14px",
          pointerEvents: "none",
        }}
      >
        <p style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Yield</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>7%+</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#14b8a6" }} />
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>5–7%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>&lt;5%</span>
          </div>
        </div>
      </div>
    </>
  );
}
