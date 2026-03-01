"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FlightStatusBadge } from "./flight-status-badge";
import { Flight } from "@/lib/types";
import { RefreshCw, X, Plane } from "lucide-react";
import { useState } from "react";

interface FlightCardProps {
  flight: Flight;
  onRefresh: () => void;
  onRemove: () => void;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function timeAgo(isoStr: string | null) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function DelayBadge({ delay, label }: { delay: number | null; label: string }) {
  if (delay === null || delay === 0) return null;
  const isLate = delay > 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isLate
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      }`}
    >
      {label} {isLate ? `+${delay}m` : `${delay}m`}
    </span>
  );
}

function TimeRow({
  label,
  depTime,
  arrTime,
}: {
  label: string;
  depTime: string | null;
  arrTime: string | null;
}) {
  const dep = formatTime(depTime);
  const arr = formatTime(arrTime);
  if (!dep && !arr) return null;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 text-xs">
      <span className="text-right tabular-nums">{dep || "--"}</span>
      <span className="text-muted-foreground w-16 text-center">{label}</span>
      <span className="tabular-nums">{arr || "--"}</span>
    </div>
  );
}

export function FlightCard({ flight, onRefresh, onRemove }: FlightCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const { data, error } = flight;

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  // Loading skeleton
  if (!data && !error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{flight.flightIata}</span>
            <Skeleton className="h-5 w-20" />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // Error-only state
  if (error && !data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="font-mono font-semibold">{flight.flightIata}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const dep = data!.departure;
  const arr = data!.arrival;

  return (
    <Card>
      {/* Header: flight code, airline, status badge, flight date */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono font-semibold text-base">{data!.flightIata}</span>
          <span className="text-sm text-muted-foreground">{data!.airline}</span>
          <FlightStatusBadge status={data!.flightStatus} />
          {data!.flight_date && (
            <span className="text-xs text-muted-foreground">{data!.flight_date}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Route section: IATA codes with dashed connector */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">{dep.iata}</p>
            <p className="text-xs text-muted-foreground leading-tight">{dep.airport}</p>
          </div>
          <div className="flex items-center gap-1 px-2">
            <div className="h-px w-6 border-t-2 border-dashed border-muted-foreground/40" />
            <Plane className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="h-px w-6 border-t-2 border-dashed border-muted-foreground/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">{arr.iata}</p>
            <p className="text-xs text-muted-foreground leading-tight">{arr.airport}</p>
          </div>
        </div>

        {/* Time grid */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 text-xs font-medium text-muted-foreground mb-1">
            <span className="text-right">Departure</span>
            <span className="w-16" />
            <span>Arrival</span>
          </div>
          <TimeRow label="Scheduled" depTime={dep.scheduled} arrTime={arr.scheduled} />
          <TimeRow label="Estimated" depTime={dep.estimated} arrTime={arr.estimated} />
          <TimeRow label="Actual" depTime={dep.actual} arrTime={arr.actual} />
          <TimeRow label="Runway" depTime={dep.actual_runway} arrTime={arr.actual_runway} />
        </div>

        {/* Info row: delays, terminal, gate, baggage */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <DelayBadge delay={dep.delay} label="Dep" />
          <DelayBadge delay={arr.delay} label="Arr" />
          {dep.terminal && (
            <Badge variant="outline" className="text-xs font-normal">T{dep.terminal}</Badge>
          )}
          {dep.gate && (
            <Badge variant="outline" className="text-xs font-normal">Gate {dep.gate}</Badge>
          )}
          {arr.terminal && (
            <Badge variant="outline" className="text-xs font-normal">T{arr.terminal} (arr)</Badge>
          )}
          {arr.gate && (
            <Badge variant="outline" className="text-xs font-normal">Gate {arr.gate} (arr)</Badge>
          )}
          {arr.baggage && (
            <Badge variant="outline" className="text-xs font-normal">Baggage {arr.baggage}</Badge>
          )}
        </div>

        {/* Aircraft pill */}
        {data!.aircraft && (data!.aircraft.registration || data!.aircraft.icao) && (
          <p className="text-xs text-muted-foreground">
            Aircraft: {[data!.aircraft.registration, data!.aircraft.icao].filter(Boolean).join(" / ")}
          </p>
        )}

        {/* Live badge */}
        {data!.live && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(data!.live.altitude)}m alt &middot; {Math.round(data!.live.speed_horizontal)} km/h
            </span>
          </div>
        )}

        {/* Footer: last updated + error */}
        {(flight.lastFetched || error) && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {flight.lastFetched
                  ? `Updated ${timeAgo(flight.lastFetched)}`
                  : ""}
              </span>
              {error && (
                <span className="text-destructive">{error}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
