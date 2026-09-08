import { BackendError } from "./api";

export function friendlyError(err: unknown): string {
  if (err instanceof BackendError) {
    if (err.code === "user_not_registered") {
      return "👋 Sign into the site with Discord first, then try again.";
    }
    if (err.code === "group_not_found") {
      return "❌ That group doesn't exist (or isn't yours). Pick one from the autocomplete list.";
    }
    if (err.status === 401 || err.status === 503) {
      return "⚠️ Bot ↔ backend auth is misconfigured. Ping the admin.";
    }
    return `❌ Backend rejected the request (${err.status}${err.code ? ` ${err.code}` : ""}).`;
  }
  return "❌ Couldn't reach the backend. Try again in a moment.";
}
