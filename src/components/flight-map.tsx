"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Flight } from "@/lib/types";
import { AIRPORT_COORDS } from "@/lib/airports";

// Plane icon as a rotatable divIcon
function planeIcon(direction: number) {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-primary" style="transform:rotate(${direction}deg);width:24px;height:24px;"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Generate points along a great-circle arc
function greatCircleArc(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  segments = 50
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const lam1 = toRad(lng1);
  const phi2 = toRad(lat2);
  const lam2 = toRad(lng2);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((phi1 - phi2) / 2), 2) +
          Math.cos(phi1) *
            Math.cos(phi2) *
            Math.pow(Math.sin((lam1 - lam2) / 2), 2)
      )
    );

  if (d === 0) return [[lat1, lng1]];

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
    const y =
      A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    points.push([lat, lng]);
  }
  return points;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#6b7280",
  active: "#2563eb",
  landed: "#16a34a",
  cancelled: "#dc2626",
  diverted: "#ea580c",
  incident: "#dc2626",
};

// Auto-fit bounds component
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  const boundsRef = useRef<L.LatLngBoundsExpression | null>(null);

  useEffect(() => {
    if (bounds && bounds !== boundsRef.current) {
      boundsRef.current = bounds;
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30] });
    }
  }, [map, bounds]);

  return null;
}

interface FlightMapProps {
  flights: Flight[];
}

export default function FlightMap({ flights }: FlightMapProps) {
  const mappedFlights = useMemo(() => {
    return flights
      .filter((f) => f.data)
      .map((f) => {
        const d = f.data!;
        const depCoord = AIRPORT_COORDS[d.departure.iata];
        const arrCoord = AIRPORT_COORDS[d.arrival.iata];
        if (!depCoord || !arrCoord) return null;

        const arc = greatCircleArc(
          depCoord.lat,
          depCoord.lng,
          arrCoord.lat,
          arrCoord.lng
        );
        const color = STATUS_COLORS[d.flightStatus] || STATUS_COLORS.scheduled;

        let planePos: { lat: number; lng: number; dir: number } | null = null;
        if (d.live) {
          planePos = {
            lat: d.live.latitude,
            lng: d.live.longitude,
            dir: d.live.direction,
          };
        } else if (d.flightStatus === "active") {
          // Estimate midpoint
          const mid = arc[Math.floor(arc.length / 2)];
          const dx = arrCoord.lng - depCoord.lng;
          const dy = arrCoord.lat - depCoord.lat;
          const dir = (Math.atan2(dx, dy) * 180) / Math.PI;
          planePos = { lat: mid[0], lng: mid[1], dir };
        }

        return {
          flight: f,
          depCoord,
          arrCoord,
          arc,
          color,
          planePos,
        };
      })
      .filter(Boolean) as Array<{
      flight: Flight;
      depCoord: { lat: number; lng: number };
      arrCoord: { lat: number; lng: number };
      arc: [number, number][];
      color: string;
      planePos: { lat: number; lng: number; dir: number } | null;
    }>;
  }, [flights]);

  const bounds = useMemo(() => {
    if (mappedFlights.length === 0) return null;
    const allPoints: [number, number][] = [];
    for (const mf of mappedFlights) {
      allPoints.push([mf.depCoord.lat, mf.depCoord.lng]);
      allPoints.push([mf.arrCoord.lat, mf.arrCoord.lng]);
      if (mf.planePos) {
        allPoints.push([mf.planePos.lat, mf.planePos.lng]);
      }
    }
    return L.latLngBounds(allPoints.map(([lat, lng]) => L.latLng(lat, lng)));
  }, [mappedFlights]);

  if (mappedFlights.length === 0) return null;

  return (
    <div className="rounded-lg overflow-hidden border h-[350px] w-full relative z-0">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds bounds={bounds} />

        {mappedFlights.map((mf) => {
          const d = mf.flight.data!;
          const key = mf.flight.flightIata;

          return (
            <span key={key}>
              {/* Departure marker */}
              <CircleMarker
                center={[mf.depCoord.lat, mf.depCoord.lng]}
                radius={5}
                pathOptions={{ color: mf.color, fillColor: mf.color, fillOpacity: 0.8 }}
              >
                <Popup>
                  {d.departure.iata} - {d.departure.airport}
                </Popup>
              </CircleMarker>

              {/* Arrival marker */}
              <CircleMarker
                center={[mf.arrCoord.lat, mf.arrCoord.lng]}
                radius={5}
                pathOptions={{ color: mf.color, fillColor: mf.color, fillOpacity: 0.8 }}
              >
                <Popup>
                  {d.arrival.iata} - {d.arrival.airport}
                </Popup>
              </CircleMarker>

              {/* Great-circle arc */}
              <Polyline
                positions={mf.arc}
                pathOptions={{
                  color: mf.color,
                  weight: 2,
                  dashArray: "6 4",
                  opacity: 0.7,
                }}
              />

              {/* Plane icon */}
              {mf.planePos && (
                <Marker
                  position={[mf.planePos.lat, mf.planePos.lng]}
                  icon={planeIcon(mf.planePos.dir)}
                >
                  <Popup>
                    {d.flightIata} &middot; {d.flightStatus}
                    {d.live && (
                      <>
                        <br />
                        {Math.round(d.live.altitude)}m &middot;{" "}
                        {Math.round(d.live.speed_horizontal)} km/h
                      </>
                    )}
                  </Popup>
                </Marker>
              )}
            </span>
          );
        })}
      </MapContainer>
    </div>
  );
}
