"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useFlightData } from "@/hooks/use-flight-data";
import { STORAGE_KEY, INITIAL_STATE } from "@/lib/constants";
import { StoredState, Flight } from "@/lib/types";
import { ProfileTabs } from "./profile-tabs";
import { ProfileContent } from "./profile-content";
import { AddProfileDialog } from "./add-profile-dialog";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function FlightTracker() {
  const [state, setState, hydrated] = useLocalStorage<StoredState>(
    STORAGE_KEY,
    INITIAL_STATE
  );
  const { refreshFlight, refreshAll } = useFlightData(
    state,
    setState,
    hydrated
  );
  const [refreshingAll, setRefreshingAll] = useState(false);

  const activeProfile = state.profiles.find(
    (p) => p.id === state.activeProfileId
  );

  const addProfile = useCallback(
    (name: string) => {
      const id = crypto.randomUUID();
      setState((prev) => ({
        ...prev,
        activeProfileId: id,
        profiles: [...prev.profiles, { id, name, flights: [] }],
      }));
    },
    [setState]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      setState((prev) => {
        const remaining = prev.profiles.filter((p) => p.id !== profileId);
        return {
          ...prev,
          profiles: remaining,
          activeProfileId: remaining.length > 0 ? remaining[0].id : null,
        };
      });
    },
    [setState]
  );

  const selectProfile = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, activeProfileId: id }));
    },
    [setState]
  );

  const addFlight = useCallback(
    (profileId: string, flightIata: string) => {
      const flight: Flight = {
        flightIata,
        data: null,
        lastFetched: null,
        error: null,
      };
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                flights: p.flights.some((f) => f.flightIata === flightIata)
                  ? p.flights
                  : [...p.flights, flight],
              }
            : p
        ),
      }));
      refreshFlight(profileId, flightIata);
    },
    [setState, refreshFlight]
  );

  const removeFlight = useCallback(
    (profileId: string, flightIata: string) => {
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                flights: p.flights.filter((f) => f.flightIata !== flightIata),
              }
            : p
        ),
      }));
    },
    [setState]
  );

  async function handleRefreshAll() {
    setRefreshingAll(true);
    await refreshAll();
    setRefreshingAll(false);
  }

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <ProfileTabs
            profiles={state.profiles}
            activeProfileId={state.activeProfileId}
            onSelect={selectProfile}
          />
          <AddProfileDialog onAdd={addProfile} />
        </div>
        {state.profiles.some((p) => p.flights.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshingAll}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${refreshingAll ? "animate-spin" : ""}`}
            />
            Refresh All
          </Button>
        )}
      </div>

      {state.profiles.length === 0 ? (
        <EmptyState
          title="No profiles yet"
          description="Create a profile to start tracking flights for someone."
        >
          <AddProfileDialog onAdd={addProfile} />
        </EmptyState>
      ) : activeProfile ? (
        <ProfileContent
          profile={activeProfile}
          onAddFlight={(code) => addFlight(activeProfile.id, code)}
          onRemoveFlight={(code) => removeFlight(activeProfile.id, code)}
          onRefreshFlight={(code) => refreshFlight(activeProfile.id, code)}
          onDeleteProfile={() => deleteProfile(activeProfile.id)}
        />
      ) : null}
    </div>
  );
}
