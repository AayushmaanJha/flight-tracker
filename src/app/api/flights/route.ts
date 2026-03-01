import { NextRequest, NextResponse } from "next/server";
import type { FlightData } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const flightIata = request.nextUrl.searchParams.get("flight_iata");

    if (!flightIata || !/^[A-Z0-9]{2}\d{1,4}$/i.test(flightIata)) {
      return NextResponse.json(
        { error: "Invalid flight IATA code. Expected format: AA123" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return NextResponse.json(
        { error: "AviationStack API key not configured. Add your key to .env.local" },
        { status: 500 }
      );
    }

    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightIata.toUpperCase()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from AviationStack" },
        { status: 502 }
      );
    }

    const json = await res.json();

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message || "AviationStack API error" },
        { status: 502 }
      );
    }

    if (!json.data || json.data.length === 0) {
      return NextResponse.json(
        { error: "No flight found for this code" },
        { status: 404 }
      );
    }

    const raw = json.data[0];

    const flightData: FlightData = {
      flightIata: raw.flight?.iata?.toUpperCase() || flightIata.toUpperCase(),
      airline: raw.airline?.name || "Unknown Airline",
      flightStatus: raw.flight_status || "unknown",
      flight_date: raw.flight_date || null,
      departure: {
        airport: raw.departure?.airport || "Unknown",
        iata: raw.departure?.iata || "???",
        terminal: raw.departure?.terminal || null,
        gate: raw.departure?.gate || null,
        baggage: raw.departure?.baggage || null,
        delay: raw.departure?.delay ?? null,
        scheduled: raw.departure?.scheduled || null,
        estimated: raw.departure?.estimated || null,
        actual: raw.departure?.actual || null,
        estimated_runway: raw.departure?.estimated_runway || null,
        actual_runway: raw.departure?.actual_runway || null,
        timezone: raw.departure?.timezone || null,
      },
      arrival: {
        airport: raw.arrival?.airport || "Unknown",
        iata: raw.arrival?.iata || "???",
        terminal: raw.arrival?.terminal || null,
        gate: raw.arrival?.gate || null,
        baggage: raw.arrival?.baggage || null,
        delay: raw.arrival?.delay ?? null,
        scheduled: raw.arrival?.scheduled || null,
        estimated: raw.arrival?.estimated || null,
        actual: raw.arrival?.actual || null,
        estimated_runway: raw.arrival?.estimated_runway || null,
        actual_runway: raw.arrival?.actual_runway || null,
        timezone: raw.arrival?.timezone || null,
      },
      aircraft: raw.aircraft
        ? {
            registration: raw.aircraft.registration || null,
            iata: raw.aircraft.iata || null,
            icao: raw.aircraft.icao || null,
            icao24: raw.aircraft.icao24 || null,
          }
        : null,
      live: raw.live
        ? {
            latitude: raw.live.latitude,
            longitude: raw.live.longitude,
            altitude: raw.live.altitude,
            direction: raw.live.direction,
            speed_horizontal: raw.live.speed_horizontal,
            speed_vertical: raw.live.speed_vertical,
            is_ground: raw.live.is_ground,
            updated: raw.live.updated,
          }
        : null,
    };

    return NextResponse.json(flightData);
  } catch (e) {
    console.error("Flight API error:", e);
    return NextResponse.json(
      { error: "Failed to connect to AviationStack" },
      { status: 502 }
    );
  }
}
