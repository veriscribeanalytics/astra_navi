// Shared forecast types for weekly / monthly / yearly responses.
// Mirrors the backend contract documented in docs/FORECAST_FRONTEND_NOTES.md.

export type ForecastPeriod = "weekly" | "monthly" | "yearly";

export type ForecastTone =
    | "neutral"
    | "positive"
    | "challenging"
    | "steady"
    | "buoyant"
    | "charged"
    | string;

export interface ForecastOverview {
    title: string;
    text: string;
    tone: ForecastTone;
    key_theme: string;
}

export interface ForecastNavigation {
    previous: string | null;
    next: string | null;
    can_go_previous: boolean;
    can_go_next: boolean;
    limit: {
        from: string;
        to: string;
    };
}

export type ForecastAlert = string | { simple: string; technical?: string };

export interface ForecastTransit {
    sign: string;
    house_from_lagna?: number;
    house_from_moon?: number;
}

export type ForecastTransits = Record<string, ForecastTransit>;

export interface BaseForecastResponse {
    area: string;
    period: ForecastPeriod;
    period_label: string;
    overview: ForecastOverview;
    navigation: ForecastNavigation;
}

export interface WeeklyDay {
    date: string;
    weekday: string;
    score: number;
    text: string;
    alerts?: ForecastAlert[];
    transits?: ForecastTransits;
    dominant_planet?: string;
}

export interface WeeklyForecastResponse extends BaseForecastResponse {
    period: "weekly";
    days: WeeklyDay[];
}

export interface MonthlyWeek {
    week_index: number;
    start_date: string;
    end_date: string;
    score: number;
    text?: string;
    alerts?: ForecastAlert[];
}

export interface MonthlyDay {
    date: string;
    weekday: string;
    score: number;
    text?: string;
    alerts?: ForecastAlert[];
    transits?: ForecastTransits;
}

export interface MonthlyForecastResponse extends BaseForecastResponse {
    period: "monthly";
    weeks: MonthlyWeek[];
    days: MonthlyDay[];
}

export interface YearlyMonth {
    month: string;
    label: string;
    score: number;
    text?: string;
    alerts?: ForecastAlert[];
    transits?: ForecastTransits;
    is_current: boolean;
}

export interface YearlyForecastResponse extends BaseForecastResponse {
    period: "yearly";
    months: YearlyMonth[];
}

export interface ForecastOutOfRangeDetail {
    code: "forecast_period_out_of_range";
    message: string;
    allowed: { from: string; to: string };
}
