import type { ComponentType } from 'react';
import {
    Heart, Star, Sparkles, Users, Sun, Moon, Compass, Flower, Coins, Activity,
} from 'lucide-react';

/* Display helpers shared across the family feature. These previously lived in
 * the old CompatibilityReport component; that report (and its endpoints) were
 * removed in favour of the daily bond dashboard, so the generic icon + date
 * helpers now have their own home here. */

const FAMILY_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    heart: Heart,
    star: Star,
    smile: Sparkles,
    sparkles: Sparkles,
    user: Users,
    users: Users,
    sun: Sun,
    moon: Moon,
    compass: Compass,
    flower: Flower,
    coins: Coins,
    activity: Activity,
};

export function getFamilyIcon(iconKey?: string | null): ComponentType<{ className?: string }> {
    if (!iconKey) return Users;
    return FAMILY_ICON_MAP[iconKey.toLowerCase()] || Users;
}

/** Format a YYYY-MM-DD birth date as a local, human date (no timezone shift). */
export function formatDob(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const [, y, m, day] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
