import { getContext, setContext } from "svelte";
import type { Profile } from "$lib/models/database.types";

const USER_PROFILE_KEY = {};


export function setUserContext(profile: Profile | null) {
  setContext(USER_PROFILE_KEY, profile);
}


export function getUserContext(): Profile | null {
  return getContext(USER_PROFILE_KEY);
}
