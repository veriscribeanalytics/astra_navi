export type PortalKey =
  | "chat"
  | "kundli"
  | "match"
  | "forecast"
  | "rashi"
  | "sessions"
  | "consult";

export const PORTAL_COLORS: Record<PortalKey, string> & Record<string, string | undefined> = {
  chat: "#C9972E",
  kundli: "#659DEA",
  match: "#E36A89",
  forecast: "#35C9A5",
  rashi: "#A78BD2",
  sessions: "#C9972E",
  consult: "#C9972E",
};