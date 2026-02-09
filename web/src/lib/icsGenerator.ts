import type { CourseEntry } from "./scheduleParser";

// ── ICS date formatting helpers ──────────────────────────────────────────

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format Date + "HH:MM" time string → "YYYYMMDDTHHMMSS" */
function formatLocalDatetime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}${m}${d}T${pad(hours)}${pad(minutes)}00`;
}

/** Format Date → "YYYYMMDDTHHMMSSZ" (end-of-day UTC for RRULE UNTIL) */
function formatUntilDate(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}${m}${d}T235959Z`;
}

/** Current UTC timestamp in iCalendar format. */
function formatUtcNow(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = pad(now.getUTCMonth() + 1);
  const d = pad(now.getUTCDate());
  const h = pad(now.getUTCHours());
  const mi = pad(now.getUTCMinutes());
  const s = pad(now.getUTCSeconds());
  return `${y}${m}${d}T${h}${mi}${s}Z`;
}

// ── ICS generation ───────────────────────────────────────────────────────

export function generateICS(courses: CourseEntry[], termEndDate: Date): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZewailCalendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:University Schedule",
    "X-WR-TIMEZONE:Africa/Cairo",
    "",
    "BEGIN:VTIMEZONE",
    "TZID:Africa/Cairo",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0200",
    "TZNAME:EET",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  courses.forEach((course, i) => {
    if (!course.firstOccurrence) return;

    const uid = `zewail-${i}-${Date.now()}@zewailcalendar`;
    const dtstart = formatLocalDatetime(course.firstOccurrence, course.startTime);
    const dtend = formatLocalDatetime(course.firstOccurrence, course.endTime);
    const until = formatUntilDate(termEndDate);

    const summary =
      course.type && course.type !== "Lecture"
        ? `${course.courseName} (${course.type})`
        : course.courseName;

    lines.push(
      "",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatUtcNow()}`,
      `DTSTART;TZID=Africa/Cairo:${dtstart}`,
      `DTEND;TZID=Africa/Cairo:${dtend}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
      `SUMMARY:${summary}`,
      `LOCATION:${course.location}`,
      `DESCRIPTION:${course.type}`,
      "END:VEVENT"
    );
  });

  lines.push("", "END:VCALENDAR");
  return lines.join("\r\n");
}

// ── Client-side download ────────────────────────────────────────────────

export function downloadICS(content: string, filename = "schedule.ics") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Google Calendar event format ────────────────────────────────────────

export interface GoogleCalendarEvent {
  summary: string;
  location: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence: string[];
}

/** Convert "HH:MM" + Date → ISO 8601 datetime string "YYYY-MM-DDTHH:MM:00" */
function toISOWithTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}T${pad(hours)}:${pad(minutes)}:00`;
}

export function toGoogleCalendarEvents(
  courses: CourseEntry[],
  termEndDate: Date
): GoogleCalendarEvent[] {
  return courses
    .filter((c) => c.firstOccurrence)
    .map((course) => {
      const startISO = toISOWithTime(course.firstOccurrence!, course.startTime);
      const endISO = toISOWithTime(course.firstOccurrence!, course.endTime);
      const until = formatUntilDate(termEndDate);

      const summary =
        course.type && course.type !== "Lecture"
          ? `${course.courseName} (${course.type})`
          : course.courseName;

      return {
        summary,
        location: course.location,
        description: course.type,
        start: { dateTime: startISO, timeZone: "Africa/Cairo" },
        end: { dateTime: endISO, timeZone: "Africa/Cairo" },
        recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${until}`],
      };
    });
}
