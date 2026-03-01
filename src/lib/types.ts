export interface FlightData {
  flightIata: string;
  airline: string;
  flightStatus: string;
  flight_date: string | null;
  departure: {
    airport: string;
    iata: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
    timezone: string | null;
  };
  arrival: {
    airport: string;
    iata: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
    timezone: string | null;
  };
  aircraft: {
    registration: string | null;
    iata: string | null;
    icao: string | null;
    icao24: string | null;
  } | null;
  live: {
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
    updated: string;
  } | null;
}

export interface Flight {
  flightIata: string;
  data: FlightData | null;
  lastFetched: string | null;
  error: string | null;
}

export interface Profile {
  id: string;
  name: string;
  flights: Flight[];
}

export interface StoredState {
  version: number;
  activeProfileId: string | null;
  profiles: Profile[];
}
