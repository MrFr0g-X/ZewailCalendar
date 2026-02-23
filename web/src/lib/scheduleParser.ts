/**
 * Schedule parser for Zewail City university registration system HTML.
 *
 * Faithfully ports the Python `parse_schedule` + `get_schedule_item_info`
 * logic from schedule_converter.py. Uses the browser DOMParser API.
 *
 * Expected HTML structure:
 *   <button id="btnItemTitle_section_*">Course Title</button>
 *   <!-- following siblings until <hr>: -->
 *   <p>Subtype: Laboratory/Lecture, Section X</p>
 *   <p>Duration: M/D/YYYY - M/D/YYYY</p>
 *   <div class="...WithWidth-ScheduleItem--meeting...">
 *     <p>1:10 PM - 4:00 PM</p>
 *     <p>Monday</p>
 *     <p>Room 123</p>
 *   </div>
 *   <!-- A course may have MULTIPLE meeting divs (e.g. Sun + Tue) -->
 *   <!-- OR a single <p>This class has multiple meeting times</p> -->
 *   <hr>
 */

export interface CourseEntry {
  id: string;
  courseName: string;
  courseCode: string;
  day: string;
  startTime: string;   // 24-hour "HH:MM"
  endTime: string;      // 24-hour "HH:MM"
  location: string;
  type: string;         // "Lecture" | "Lab"
  termStart: Date | null;
  termEnd: Date | null;
  firstOccurrence: Date | null;
}

/** A course detected in HTML but missing schedule data (multi-meeting). */
export interface IncompleteCourseEntry {
  courseName: string;
  type: string;
  termStart: Date | null;
  termEnd: Date | null;
}

export interface ParseResult {
  courses: CourseEntry[];
  warnings: string[];
  termEndDate: Date | null;
  /** Courses that had "multiple meeting times" — need manual input. */
  incompleteEntries: IncompleteCourseEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

interface MeetingInfo {
  meetingTime: string | null;
  meetingDay: string | null;
  location: string | null;
}

interface RawScheduleInfo {
  subtypeSection: string | null;
  duration: string | null;
  meetings: MeetingInfo[];
  hasNoScheduleData: boolean;
}

/** Walk to the next node in document order (depth-first). */
function nextInDocumentOrder(node: Node): Node | null {
  if (node.firstChild) return node.firstChild;
  let current: Node | null = node;
  while (current) {
    if (current.nextSibling) return current.nextSibling;
    current = current.parentNode;
  }
  return null;
}

/**
 * Replicates Python's `get_schedule_item_info(button)`.
 * Traverses DOM forward from `button` until `<hr>`, collecting metadata.
 *
 * Now collects ALL meeting divs (a course may meet on multiple days)
 * and detects the "multiple meeting times" marker.
 */
function getScheduleItemInfo(button: Element): RawScheduleInfo {
  const info: RawScheduleInfo = {
    subtypeSection: null,
    duration: null,
    meetings: [],
    hasNoScheduleData: false,
  };

  // Track which meeting divs we've already processed
  const processedDivs = new Set<Element>();

  let node: Node | null = button;
  while (node) {
    node = nextInDocumentOrder(node);
    if (!node) break;

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;

      // Stop at <hr>
      if (el.tagName === "HR") break;

      const text = (el.textContent ?? "").trim();

      if (text.startsWith("Subtype:") && !info.subtypeSection) {
        info.subtypeSection = text;
      } else if (text.startsWith("Duration:") && !info.duration) {
        info.duration = text;
      }

      // Detect missing schedule markers
      if (text.includes("multiple meeting times") || text === "No schedule") {
        info.hasNoScheduleData = true;
      }

      // Meeting container div — collect ALL of them
      if (
        el.tagName === "DIV" &&
        el.hasAttribute("class") &&
        Array.from(el.classList).some((cls) =>
          cls.includes("WithWidth-ScheduleItem--meeting")
        ) &&
        !processedDivs.has(el)
      ) {
        processedDivs.add(el);
        const pElements = el.querySelectorAll("p");
        if (pElements.length >= 3) {
          info.meetings.push({
            meetingTime: (pElements[0].textContent ?? "").trim(),
            meetingDay: (pElements[1].textContent ?? "").trim(),
            location: (pElements[2].textContent ?? "").trim(),
          });
        }
      }
    }
  }

  return info;
}

/** Parses "M/D/YYYY" → Date, or null. */
function parseMDY(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  return new Date(year, month - 1, day);
}

/** Converts "1:10 PM" → "13:10". */
function convert12to24(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

/** Finds the first date >= termStart whose weekday matches dayName. */
function computeFirstOccurrence(termStart: Date, dayName: string): Date | null {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = dayMap[dayName];
  if (targetDay === undefined) return null;
  const date = new Date(termStart);
  // Advance day-by-day until weekday matches
  for (let i = 0; i < 7; i++) {
    if (date.getDay() === targetDay) return date;
    date.setDate(date.getDate() + 1);
  }
  return null;
}

// ── MHT / MHTML support ─────────────────────────────────────────────────

/**
 * Extract the HTML body from an MHTML (`.mht`) file.
 *
 * MHTML files are MIME multipart archives. The first `text/html` part
 * contains the page HTML — that's all we need.
 */
export function extractHtmlFromMht(raw: string): string {
  // Find the boundary from the Content-Type header
  const boundaryMatch = raw.match(/boundary="?([^\s"]+)"?/i);
  if (!boundaryMatch) {
    // No MIME boundary — maybe it's just HTML already
    return raw;
  }

  const boundary = boundaryMatch[1];
  const parts = raw.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

  for (const part of parts) {
    // Look for the text/html part
    if (/Content-Type:\s*text\/html/i.test(part)) {
      // Check encoding
      const isBase64 = /Content-Transfer-Encoding:\s*base64/i.test(part);
      const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);

      // Extract the body (everything after the blank line separating headers from content)
      const bodyStart = part.indexOf("\r\n\r\n");
      const bodyStartLF = part.indexOf("\n\n");
      const start = bodyStart >= 0 ? bodyStart + 4 : (bodyStartLF >= 0 ? bodyStartLF + 2 : -1);
      if (start < 0) continue;

      let body = part.substring(start).trim();

      if (isBase64) {
        try {
          body = atob(body.replace(/\s/g, ""));
        } catch {
          continue;
        }
      } else if (isQP) {
        // Decode quoted-printable
        body = body
          .replace(/=\r?\n/g, "")                     // soft line breaks
          .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>   // encoded chars
            String.fromCharCode(parseInt(hex, 16))
          );
      }

      return body;
    }
  }

  // Fallback — return as-is (might be plain HTML saved with .mht extension)
  return raw;
}

// ── Main parser ──────────────────────────────────────────────────────────

export function parseScheduleHTML(html: string): ParseResult {
  // Auto-detect MHT format and extract HTML if needed
  const isLikelyMht =
    html.trimStart().startsWith("From:") ||
    html.trimStart().startsWith("MIME-Version:") ||
    html.includes("Content-Type: multipart/");

  const cleanHtml = isLikelyMht ? extractHtmlFromMht(html) : html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, "text/html");
  const courses: CourseEntry[] = [];
  const incompleteEntries: IncompleteCourseEntry[] = [];
  const warnings: string[] = [];
  let detectedTermEnd: Date | null = null;
  let id = 0;

  const buttons = doc.querySelectorAll('button[id^="btnItemTitle_section_"]');

  if (buttons.length === 0) {
    warnings.push(
      "No schedule entries found. Make sure you saved the full HTML page from the registration system."
    );
    return { courses, warnings, termEndDate: null, incompleteEntries };
  }

  buttons.forEach((button) => {
    const title = (button.textContent ?? "").trim();
    const info = getScheduleItemInfo(button);

    // Parse duration
    let termStart: Date | null = null;
    let termEnd: Date | null = null;
    if (info.duration) {
      const durationStr = info.duration.replace("Duration:", "").trim();
      const dates = durationStr.split("-").map((s) => s.trim());
      if (dates.length === 2) {
        termStart = parseMDY(dates[0]);
        termEnd = parseMDY(dates[1]);
        if (termEnd && !detectedTermEnd) {
          detectedTermEnd = termEnd;
        }
      }
    }

    // Determine category
    let type = "Lecture";
    if (info.subtypeSection) {
      if (info.subtypeSection.includes("Laboratory")) type = "Lab";
      else if (info.subtypeSection.includes("Tutorial")) type = "Tutorial";
      else if (info.subtypeSection.includes("Lecture")) type = "Lecture";
    }

    // Handle missing schedule data ("multiple meeting times" or "No schedule")
    if (info.hasNoScheduleData && info.meetings.length === 0) {
      incompleteEntries.push({
        courseName: title,
        type,
        termStart,
        termEnd,
      });
      return;
    }

    // If no meetings found, warn
    if (info.meetings.length === 0) {
      warnings.push(`Could not determine schedule for "${title}" — missing meeting info.`);
      return;
    }

    // Create a CourseEntry for EACH meeting (handles multi-day courses)
    for (const meeting of info.meetings) {
      let startTime = "";
      let endTime = "";
      if (meeting.meetingTime) {
        const times = meeting.meetingTime.split("-").map((s) => s.trim());
        if (times.length === 2) {
          startTime = convert12to24(times[0]);
          endTime = convert12to24(times[1]);
        }
      }

      const meetingDay = meeting.meetingDay ?? "";
      let firstOccurrence: Date | null = null;
      if (termStart && meetingDay) {
        firstOccurrence = computeFirstOccurrence(termStart, meetingDay);
      }

      if (firstOccurrence) {
        courses.push({
          id: String(++id),
          courseName: title,
          courseCode: "",
          day: meetingDay,
          startTime,
          endTime,
          location: meeting.location ?? "TBA",
          type,
          termStart,
          termEnd,
          firstOccurrence,
        });
      } else {
        warnings.push(`Could not determine schedule for "${title}" on ${meetingDay || "unknown day"} — missing day or date info.`);
      }
    }
  });

  return { courses, warnings, termEndDate: detectedTermEnd, incompleteEntries };
}
