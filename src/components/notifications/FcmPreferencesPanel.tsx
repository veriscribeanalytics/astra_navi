'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, Clock, Globe2, Loader2, Send, Sunrise, Sunset, Info } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useToast } from '@/hooks';
import { useFcmPreferences } from '@/hooks/useFcmPreferences';
import {
    detectTimezone,
    isValidTimeHHMM,
    looksLikeIanaTimezone,
    FCM_DEFAULT_PREFERENCES,
} from '@/lib/fcm';

/**
 * Reminder-preferences panel for FCM push notifications.
 *
 * Reminders are OPT-IN by default (morningEnabled=false until the user
 * enables). Default slots 07:00 / 19:00. Times are HH:MM 24h; timezone must
 * be a valid IANA name. PUT uses exclude_unset — only changed fields are sent,
 * `null` leaves a field unchanged, explicit `false` clears.
 */
export default function FcmPreferencesPanel() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const { preferences, loading, saving, testing, save, test } = useFcmPreferences();

    // Local mirror so toggles/time edits feel instant; committed on save.
    const [morningEnabled, setMorningEnabled] = useState(FCM_DEFAULT_PREFERENCES.morningEnabled);
    const [morningTime, setMorningTime] = useState(FCM_DEFAULT_PREFERENCES.morningTime);
    const [eveningEnabled, setEveningEnabled] = useState(FCM_DEFAULT_PREFERENCES.eveningEnabled);
    const [eveningTime, setEveningTime] = useState(FCM_DEFAULT_PREFERENCES.eveningTime);
    const [timezone, setTimezone] = useState(FCM_DEFAULT_PREFERENCES.timezone);
    const [tzTouched, setTzTouched] = useState(false);

    useEffect(() => {
        setMorningEnabled(preferences.morningEnabled);
        setMorningTime(preferences.morningTime);
        setEveningEnabled(preferences.eveningEnabled);
        setEveningTime(preferences.eveningTime);
        setTimezone(preferences.timezone);
        setTzTouched(false);
    }, [preferences]);

    const tzValid = looksLikeIanaTimezone(timezone);
    const morningTimeValid = isValidTimeHHMM(morningTime);
    const eveningTimeValid = isValidTimeHHMM(eveningTime);

    const dirty = useMemo(() => {
        return (
            morningEnabled !== preferences.morningEnabled ||
            eveningEnabled !== preferences.eveningEnabled ||
            (morningEnabled && morningTime !== preferences.morningTime) ||
            (eveningEnabled && eveningTime !== preferences.eveningTime) ||
            (tzTouched && timezone !== preferences.timezone)
        );
    }, [morningEnabled, eveningEnabled, morningTime, eveningTime, timezone, preferences, tzTouched]);

    const canSave = !saving && !loading && dirty && tzValid && morningTimeValid && eveningTimeValid;

    const tr = (key: string, fallback: string) => {
        const v = t(key);
        return v && v !== key ? v : fallback;
    };

    const handleSave = async () => {
        if (!canSave) return;
        const patch: Record<string, unknown> = {};
        if (morningEnabled !== preferences.morningEnabled) patch.morningEnabled = morningEnabled;
        if (eveningEnabled !== preferences.eveningEnabled) patch.eveningEnabled = eveningEnabled;
        if (morningEnabled && morningTime !== preferences.morningTime) patch.morningTime = morningTime;
        if (eveningEnabled && eveningTime !== preferences.eveningTime) patch.eveningTime = eveningTime;
        if (tzTouched && timezone !== preferences.timezone) patch.timezone = timezone;
        if (Object.keys(patch).length === 0) return;

        const ok = await save(patch);
        if (ok) success(tr('fcm.saveSuccess', 'Reminder preferences saved.'));
        else error(tr('fcm.saveFailed', 'Could not save preferences.'));
    };

    const handleUseMyTimezone = () => {
        const detected = detectTimezone();
        setTimezone(detected);
        setTzTouched(true);
    };

    const handleTest = async () => {
        const result = await test();
        if (result.ok) success(tr('fcm.testSent', 'Test push sent. Check your device.'));
        else error(result.message || tr('fcm.testFailed', 'Could not send test push.'));
    };

    return (
        <section className="rounded-2xl border border-outline-variant/15 bg-surface p-5 sm:p-6">
            <header className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
                    <Bell className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-headline font-bold text-foreground leading-tight">
                        {tr('fcm.title', 'Daily Reminders')}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-foreground/55 leading-relaxed">
                        {tr('fcm.subtitle', 'Opt in to a gentle morning and evening nudge. Off by default.')}
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center gap-2 py-6 text-foreground/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{tr('fcm.loading', 'Loading…')}</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Morning reminder */}
                    <ReminderRow
                        icon={<Sunrise className="h-4 w-4" />}
                        label={tr('fcm.morning', 'Morning reminder')}
                        enabled={morningEnabled}
                        onToggle={setMorningEnabled}
                        time={morningTime}
                        onTimeChange={setMorningTime}
                        timeValid={morningTimeValid}
                        disabled={saving}
                    />

                    {/* Evening reminder */}
                    <ReminderRow
                        icon={<Sunset className="h-4 w-4" />}
                        label={tr('fcm.evening', 'Evening reminder')}
                        enabled={eveningEnabled}
                        onToggle={setEveningEnabled}
                        time={eveningTime}
                        onTimeChange={setEveningTime}
                        timeValid={eveningTimeValid}
                        disabled={saving}
                    />

                    {/* Timezone */}
                    <div className="rounded-xl border border-outline-variant/10 bg-surface-variant/30 p-3.5">
                        <label className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-foreground/55">
                            <Globe2 className="h-3.5 w-3.5" />
                            {tr('fcm.timezone', 'Timezone')}
                        </label>
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={timezone}
                                onChange={(e) => { setTimezone(e.target.value); setTzTouched(true); }}
                                placeholder="Asia/Kolkata"
                                aria-invalid={!tzValid}
                                className="flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-secondary/40"
                                style={{ borderColor: tzValid ? 'var(--outline-variant, rgba(255,255,255,0.1))' : '#E16272' }}
                            />
                            <button
                                type="button"
                                onClick={handleUseMyTimezone}
                                className="shrink-0 rounded-lg border border-outline-variant/20 bg-surface-variant/40 px-3 py-2 text-[12px] font-bold text-foreground/70 hover:bg-surface-variant/70 transition-colors"
                            >
                                {tr('fcm.useMyTz', 'Use my timezone')}
                            </button>
                        </div>
                        {!tzValid && (
                            <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5">
                                <Info className="h-3 w-3" />
                                {tr('fcm.tzInvalid', 'Enter a valid IANA timezone (e.g. Asia/Kolkata).')}
                            </p>
                        )}
                        <p className="mt-1.5 text-[11px] text-foreground/40 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tr('fcm.tzHint', 'Reminders fire in your local day. Times are 24h (HH:MM).')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!canSave}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-on-primary transition hover:bg-secondary-hover disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                            {tr('fcm.save', 'Save')}
                        </button>
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-variant/30 px-4 py-2.5 text-[13px] font-bold text-foreground/70 transition hover:bg-surface-variant/60 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {tr('fcm.test', 'Send test push')}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function ReminderRow({
    icon,
    label,
    enabled,
    onToggle,
    time,
    onTimeChange,
    timeValid,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    time: string;
    onTimeChange: (v: string) => void;
    timeValid: boolean;
    disabled: boolean;
}) {
    return (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-variant/30 p-3.5">
            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                    <span className="text-secondary">{icon}</span>
                    {label}
                </label>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={label}
                    disabled={disabled}
                    onClick={() => onToggle(!enabled)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                        enabled ? 'bg-secondary' : 'bg-foreground/15'
                    }`}
                >
                    <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                    />
                </button>
            </div>
            {enabled && (
                <div className="mt-3 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-foreground/40" />
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => onTimeChange(e.target.value)}
                        disabled={disabled}
                        aria-invalid={!timeValid}
                        className="rounded-lg border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-secondary/40"
                        style={{ borderColor: timeValid ? 'var(--outline-variant, rgba(255,255,255,0.1))' : '#E16272' }}
                    />
                    {!timeValid && (
                        <span className="text-[11px] text-red-400">HH:MM</span>
                    )}
                </div>
            )}
            {!enabled && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-foreground/40">
                    <BellOff className="h-3 w-3" />
                    Off
                </p>
            )}
        </div>
    );
}
