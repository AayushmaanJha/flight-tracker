import { StoredState } from "./types";

export const STORAGE_KEY = "flight-tracker-profiles";
export const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const INITIAL_STATE: StoredState = {
  version: 1,
  activeProfileId: null,
  profiles: [],
};
