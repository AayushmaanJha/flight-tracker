"use client";

import { useCallback, useEffect, useRef } from "react";
import { StoredState, FlightData } from "@/lib/types";
import { POLLING_INTERVAL } from "@/lib/constants";

async function fetchFlight(
  flightIata: string
): Promise<{ data?: FlightData; error?: string }> {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(
      `${baseUrl}/api/flights?flight_iata=${encodeURIComponent(flightIata)}`
    );
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { error: `Server error (${res.status}). Try restarting the dev server.` };
    }
    if (!res.ok) {
      return { error: json.error || "Failed to fetch flight" };
    }
    return { data: json };
  } catch {
    return { error: "Network error — is the dev server running?" };
  }
}

export function useFlightData(
  state: StoredState,
  setState: (value: StoredState | ((val: StoredState) => StoredState)) => void,
  hydrated: boolean
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshFlight = useCallback(
    async (profileId: string, flightIata: string) => {
      const result = await fetchFlight(flightIata);

      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                flights: p.flights.map((f) =>
                  f.flightIata === flightIata
                    ? {
                        ...f,
                        data: result.data ?? f.data,
                        lastFetched: result.data
                          ? new Date().toISOString()
                          : f.lastFetched,
                        error: result.error ?? null,
                      }
                    : f
                ),
              }
            : p
        ),
      }));
    },
    [setState]
  );

  const refreshAll = useCallback(async () => {
    const allFlights: { profileId: string; flightIata: string }[] = [];
    for (const profile of state.profiles) {
      for (const flight of profile.flights) {
        allFlights.push({
          profileId: profile.id,
          flightIata: flight.flightIata,
        });
      }
    }
    await Promise.all(
      allFlights.map((f) => refreshFlight(f.profileId, f.flightIata))
    );
  }, [state.profiles, refreshFlight]);

  useEffect(() => {
    if (!hydrated) return;

    intervalRef.current = setInterval(() => {
      refreshAll();
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hydrated, refreshAll]);

  return { refreshFlight, refreshAll };
}
