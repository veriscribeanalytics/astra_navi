export interface HoroscopeData {
  user?: { sign: string; name: string };
  meta?: {
    date: string;
    date_display: string;
    generated_at: string;
    panchanga?: {
      tithi: string;
      nakshatra: string;
      yoga: string;
      karana: string;
      vaara: string;
      rahukaal?: {
        date: string;
        weekday: string;
        start: string;
        end: string;
        startIso: string;
        endIso: string;
        durationMinutes: number;
        segment: number;
        source: string;
      };
    };
  };
  score?: {
    overall: number;
    areas: {
      career: { value: number };
      love: { value: number };
      health: { value: number };
      finance: { value: number };
      general: { value: number };
      spiritual?: { value: number };
    };
  };
  lucky?: { color: string; number: number };
  mood?: { value: string; type: string } | string;
  planetary?: {
    dominant_planet: string;
    active_dasha: string;
    retrograde?: string[];
  };
  areas_text?: {
    career: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
    love: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
    health: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
    finance: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
    general?: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
    spiritual?: { insight: string; tone: string; action?: string; personalization_applied?: boolean; personal_notes?: string[] };
  };
  alerts?: {
    primary: { technical: string; simple: string; type: string; importance: string };
    secondary: Array<{ technical: string; simple: string; type: string; importance: string }>;
  };
  time_triggers?: Array<{ start: string; end: string; type: string; label: string; advice: string; reason?: string }>;
  current_state?: {
    energy: string;
    derived_from: string[];
    advice_now: string;
  };
  astro_explanations?: {
    enabled: boolean;
    items: Array<{ technical: string; simple: string; importance: string }>;
  };
  system?: { is_personalized: boolean; language: string };
  calculation_unavailable?: boolean;
  profile_location_required?: boolean;
  message?: string;
  paywall?: {
    isSoft: boolean;
    isHard: boolean;
    title?: string;
    description?: string;
  };
  sign?: string;
  date_display?: string;
  overall_score?: number;
  lucky_color?: string;
  lucky_number?: number;
  dominant_planet?: string;
  tip?: { text: string; type: string } | string;
  today_scores?: Record<string, number>;
}

export interface DashaPeriod {
  type: string;
  planet: string;
  start?: string;     // ISO start date
  end?: string;       // ISO end date
  end_date?: string;  // fallback ISO end date
}

export interface DashaData {
  currentMahaDasha?: string | { planet: string; name: string; value: string };
  current?: string | { planet: string; name: string; value: string };
  value?: string | { planet: string; name: string; value: string };
  remaining?: string;
  active?: DashaPeriod[];
}

export interface AstrologyData {
  planets?: { planet: string; sign: string }[];
  houses?: { house: number; sign: string }[];
  chart?: { houses: { house: number; sign: string }[] };
  ascendant?: { sign: string };
  nakshatra?: string | { value: string; name: string };
  nakshatraLord?: string | { value: string; name: string };
  dasha?: DashaData;
  planetary?: { active_dasha?: string | DashaData };
  moonPhase?: string | { value: string };
}
