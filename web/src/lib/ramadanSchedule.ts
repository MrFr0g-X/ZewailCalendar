/**
 * Ramadan schedule logic for ZewailCalendar.
 *
 * Contains slot definitions, time remapping between regular and Ramadan
 * schedules, API integration for fetching Ramadan dates, and overlap detection.
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface TimeSlot {
    start: string; // "HH:MM" (24-hour)
    end: string;
}

export type RamadanVersion = "v1" | "v2";

export interface RamadanConfig {
    version: RamadanVersion;
    ramadanStart: Date;
    ramadanEnd: Date;
}

// ── Slot definitions ─────────────────────────────────────────────────────

export const REGULAR_SLOTS: TimeSlot[] = [
    { start: "08:10", end: "09:00" }, // Slot 0
    { start: "09:10", end: "10:00" }, // Slot 1
    { start: "10:10", end: "11:00" }, // Slot 2
    { start: "11:10", end: "12:00" }, // Slot 3
    { start: "12:10", end: "13:00" }, // Slot 4
    { start: "13:10", end: "14:00" }, // Slot 5
    { start: "14:10", end: "15:00" }, // Slot 6
    { start: "15:10", end: "16:00" }, // Slot 7
];

/** V1 – with Dhuhr break */
export const RAMADAN_V1_SLOTS: TimeSlot[] = [
    { start: "09:10", end: "09:40" }, // Slot 0
    { start: "09:45", end: "10:15" }, // Slot 1
    { start: "10:20", end: "10:50" }, // Slot 2
    { start: "10:55", end: "11:25" }, // Slot 3
    { start: "11:30", end: "12:00" }, // Slot 4
    { start: "12:15", end: "12:45" }, // Slot 5  (after Dhuhr break)
    { start: "12:50", end: "13:20" }, // Slot 6
    { start: "13:25", end: "13:55" }, // Slot 7
];

/** V2 – continuous, no Dhuhr break */
export const RAMADAN_V2_SLOTS: TimeSlot[] = [
    { start: "09:00", end: "09:40" }, // Slot 0
    { start: "09:45", end: "10:25" }, // Slot 1
    { start: "10:30", end: "11:10" }, // Slot 2
    { start: "11:15", end: "11:55" }, // Slot 3
    { start: "12:00", end: "12:40" }, // Slot 4
    { start: "12:45", end: "13:25" }, // Slot 5
    { start: "13:30", end: "14:10" }, // Slot 6
    { start: "14:15", end: "14:55" }, // Slot 7
];

// ── Helpers ──────────────────────────────────────────────────────────────

export function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

/**
 * Given a start/end time, identify which regular slot indices the course spans.
 * We check whether the course interval overlaps each slot.
 */
export function identifySlots(startTime: string, endTime: string): number[] {
    const courseStart = timeToMinutes(startTime);
    const courseEnd = timeToMinutes(endTime);
    const slots: number[] = [];

    REGULAR_SLOTS.forEach((slot, idx) => {
        const slotStart = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);
        // Overlap exists if course doesn't end before slot starts,
        // and doesn't start after slot ends.
        if (courseStart < slotEnd && courseEnd > slotStart) {
            slots.push(idx);
        }
    });

    return slots;
}

/**
 * Map a regular course's time range to the equivalent Ramadan version time range.
 * Returns `null` if the time couldn't be matched to any slots.
 */
export function mapToRamadanTime(
    startTime: string,
    endTime: string,
    version: RamadanVersion
): TimeSlot | null {
    const slots = identifySlots(startTime, endTime);
    if (slots.length === 0) return null;

    const ramadanSlots = version === "v1" ? RAMADAN_V1_SLOTS : RAMADAN_V2_SLOTS;
    const firstSlot = ramadanSlots[slots[0]];
    const lastSlot = ramadanSlots[slots[slots.length - 1]];

    return {
        start: firstSlot.start,
        end: lastSlot.end,
    };
}

// ── Date utilities ───────────────────────────────────────────────────────

/** Check whether a single date falls within the [ramadanStart, ramadanEnd] range (inclusive). */
export function isDateInRamadan(
    date: Date,
    ramadanStart: Date,
    ramadanEnd: Date
): boolean {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(
        ramadanStart.getFullYear(),
        ramadanStart.getMonth(),
        ramadanStart.getDate()
    );
    const e = new Date(
        ramadanEnd.getFullYear(),
        ramadanEnd.getMonth(),
        ramadanEnd.getDate()
    );
    return d >= s && d <= e;
}

/** Check whether [termStart, termEnd] overlaps with [ramadanStart, ramadanEnd]. */
export function doesTermOverlapRamadan(
    termStart: Date,
    termEnd: Date,
    ramadanStart: Date,
    ramadanEnd: Date
): boolean {
    return termStart <= ramadanEnd && termEnd >= ramadanStart;
}

// ── API integration ──────────────────────────────────────────────────────

function formatDateForApi(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

/**
 * Fetch Ramadan start / end dates for a given year using the public API.
 *
 * Strategy:
 *   1. Query Jan 1 → API returns `nextRamadan.date` (the start date).
 *   2. Query start + 30 days → if still in Ramadan, Ramadan is 30 days,
 *      otherwise it is 29 days.
 */
export async function fetchRamadanDates(
    year: number
): Promise<{ start: Date; end: Date } | null> {
    try {
        // Step 1 – get the Ramadan start date
        const jan1 = new Date(year, 0, 1);
        const res1 = await fetch(
            `/api/ramadan?date=${formatDateForApi(jan1)}`
        );
        if (!res1.ok) return null;
        const data1 = await res1.json();

        let ramadanStart: Date;
        if (data1.data?.isRamadan) {
            ramadanStart = jan1;
        } else if (data1.data?.nextRamadan?.date) {
            const raw = data1.data.nextRamadan.date; // "DD-MM-YYYY"
            const [dd, mm, yyyy] = raw.split("-").map(Number);
            ramadanStart = new Date(yyyy, mm - 1, dd);
        } else {
            return null;
        }

        // Only consider Ramadan dates that fall within the requested year
        if (ramadanStart.getFullYear() !== year) return null;

        // Step 2 – determine the length (29 or 30 days)
        const checkEnd = new Date(ramadanStart);
        checkEnd.setDate(checkEnd.getDate() + 30);
        const res2 = await fetch(
            `/api/ramadan?date=${formatDateForApi(checkEnd)}`
        );
        if (!res2.ok) {
            // Fallback: assume 30 days
            const end = new Date(ramadanStart);
            end.setDate(end.getDate() + 29);
            return { start: ramadanStart, end };
        }

        const data2 = await res2.json();
        const ramadanEnd = new Date(ramadanStart);
        if (data2.data?.isRamadan) {
            ramadanEnd.setDate(ramadanEnd.getDate() + 30 - 1);
        } else {
            ramadanEnd.setDate(ramadanEnd.getDate() + 29 - 1);
        }

        return { start: ramadanStart, end: ramadanEnd };
    } catch {
        return null;
    }
}
