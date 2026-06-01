/**
 * Compute the UTC offset in hours for an IANA timezone at a given local
 * date/time. Handles historical DST changes (e.g. India never had DST, but
 * US/Europe did) by asking the Intl machinery for the longOffset string and
 * parsing it.
 *
 * Returns null if the inputs are invalid.
 *
 * Example: tzOffsetHoursAt("Asia/Kolkata", "1970-01-01", "06:30") → 5.5
 *          tzOffsetHoursAt("America/New_York", "2024-07-04", "12:00") → -4
 *          tzOffsetHoursAt("America/New_York", "2024-01-04", "12:00") → -5
 */
export function tzOffsetHoursAt(
    ianaTimezone: string | undefined | null,
    dob: string,
    tob: string
): number | null {
    if (!ianaTimezone || !dob || !tob) return null;
    // Build a UTC-anchored Date to ask Intl what the offset *would have been*
    // at that local wall-clock moment. Using a UTC base lets us read back the
    // formatted offset for the target zone without browser local-time skew.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    const timeMatch = /^(\d{1,2}):(\d{2})/.exec(tob);
    if (!match || !timeMatch) return null;

    const [, y, m, d] = match;
    const [, hh, mm] = timeMatch;

    // Anchor as UTC at the same wall-clock value. Intl will report the offset
    // that the IANA zone had at THAT instant — close enough for DST rules
    // because civil-time edits at the boundary are rare.
    const anchor = new Date(Date.UTC(
        Number(y), Number(m) - 1, Number(d),
        Number(hh), Number(mm), 0
    ));
    if (isNaN(anchor.getTime())) return null;

    try {
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: ianaTimezone,
            timeZoneName: 'longOffset',
            hour: '2-digit',
        });
        const parts = fmt.formatToParts(anchor);
        const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
        // Expected forms: "GMT+05:30", "GMT-04:00", "GMT"
        const offsetMatch = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(tzPart);
        if (!offsetMatch) {
            if (tzPart === 'GMT') return 0;
            return null;
        }
        const sign = offsetMatch[1] === '-' ? -1 : 1;
        const hours = Number(offsetMatch[2]);
        const minutes = offsetMatch[3] ? Number(offsetMatch[3]) : 0;
        return sign * (hours + minutes / 60);
    } catch {
        return null;
    }
}
