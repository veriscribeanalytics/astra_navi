export const PORTAL_COLORS = {
  kundli: "#60A5FA",
  match: "#FB7185",
  forecast: "#34D399",
  consult: "#A78BFA",
  rashi: "var(--flare-lavender)",
  chat: "var(--secondary)",
  sessions: "var(--flare-gold)",
} as const;

export type PortalKey = keyof typeof PORTAL_COLORS;