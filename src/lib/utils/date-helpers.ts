/**
 * Converts a JS Date object into a local datetime-local string (YYYY-MM-DDTHH:mm).
 * Accounts for the user's local timezone offset explicitly so inputs render correctly.
 */
export function toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Builds a default datetime string for forms, given a day offset and a time string.
 * Example: buildDefaultDatetimeString(0, '09:30') returns today at 09:30 local time.
 */
export function buildDefaultDatetimeString(daysOffset: number, hhMm: string): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    if (hhMm) {
        const [hh, mm] = hhMm.split(':').map(Number);
        d.setHours(hh, mm, 0, 0);
    }
    return toLocalDatetimeString(d);
}
