import type { ForecastOutOfRangeDetail } from "@/types/forecast";

export interface OutOfRangeInfo {
    outOfRange: boolean;
    message?: string;
    allowed?: { from: string; to: string };
}

export function parseForecastError(data: unknown): OutOfRangeInfo {
    const d = data as { detail?: ForecastOutOfRangeDetail } | null;
    const detail = d?.detail;
    if (detail && detail.code === "forecast_period_out_of_range") {
        return {
            outOfRange: true,
            message: detail.message,
            allowed: detail.allowed,
        };
    }
    return { outOfRange: false };
}

export function todayISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function currentMonthISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

export function currentYearISO(): string {
    return String(new Date().getFullYear());
}
