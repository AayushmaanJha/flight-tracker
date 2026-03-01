"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Flight, Profile } from "@/lib/types";
import { FlightCard } from "./flight-card";
import { AddFlightDialog } from "./add-flight-dialog";
import { UploadPdfDialog } from "./upload-pdf-dialog";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const FlightMap = dynamic(() => import("./flight-map"), { ssr: false });

interface ProfileContentProps {
  profile: Profile;
  onAddFlight: (flightIata: string) => void;
  onRemoveFlight: (flightIata: string) => void;
  onRefreshFlight: (flightIata: string) => void;
  onDeleteProfile: () => void;
}

export function ProfileContent({
  profile,
  onAddFlight,
  onRemoveFlight,
  onRefreshFlight,
  onDeleteProfile,
}: ProfileContentProps) {
  const hasFlightData = profile.flights.some((f) => f.data);

  const sortedFlights = useMemo(() => {
    const STATUS_ORDER: Record<string, number> = {
      active: 0,
      scheduled: 1,
      landed: 2,
      cancelled: 3,
      diverted: 3,
      incident: 3,
      unknown: 4,
    };

    return [...profile.flights].sort((a: Flight, b: Flight) => {
      // Flights without data go to the end
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;

      // Sort by status group first
      const sa = STATUS_ORDER[a.data.flightStatus] ?? 4;
      const sb = STATUS_ORDER[b.data.flightStatus] ?? 4;
      if (sa !== sb) return sa - sb;

      // Within same status group, sort by departure scheduled time
      const ta = a.data.departure.scheduled;
      const tb = b.data.departure.scheduled;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return new Date(ta).getTime() - new Date(tb).getTime();
    });
  }, [profile.flights]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AddFlightDialog onAdd={onAddFlight} />
          <UploadPdfDialog onAddFlights={(codes) => codes.forEach(onAddFlight)} />
        </div>
        <Button variant="ghost" size="sm" onClick={onDeleteProfile} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Profile
        </Button>
      </div>

      {hasFlightData && <FlightMap flights={profile.flights} />}

      {profile.flights.length === 0 ? (
        <EmptyState
          title="No flights yet"
          description="Add a flight IATA code to start tracking."
        />
      ) : (
        <div className="grid gap-4">
          {sortedFlights.map((flight) => (
            <FlightCard
              key={flight.flightIata}
              flight={flight}
              onRefresh={() => onRefreshFlight(flight.flightIata)}
              onRemove={() => onRemoveFlight(flight.flightIata)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
