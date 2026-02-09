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

export interface ParseResult {
  courses: CourseEntry[];
  warnings: string[];
  termEndDate: Date | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

interface RawScheduleInfo {
  subtypeSection: string | null;
  duration: string | null;
  meetingTime: string | null;
  meetingDay: string | null;
  location: string | null;
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
 */
function getScheduleItemInfo(button: Element): RawScheduleInfo {
  const info: RawScheduleInfo = {
    subtypeSection: null,
    duration: null,
    meetingTime: null,
    meetingDay: null,
    location: null,
  };

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

      // Meeting container div
      if (
        el.tagName === "DIV" &&
        el.hasAttribute("class") &&
        Array.from(el.classList).some((cls) =>
          cls.includes("WithWidth-ScheduleItem--meeting")
        )
      ) {
        const pElements = el.querySelectorAll("p");
        if (pElements.length >= 3) {
          info.meetingTime = (pElements[0].textContent ?? "").trim();
          info.meetingDay = (pElements[1].textContent ?? "").trim();
          info.location = (pElements[2].textContent ?? "").trim();
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

// ── Main parser ──────────────────────────────────────────────────────────

export function parseScheduleHTML(html: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const courses: CourseEntry[] = [];
  const warnings: string[] = [];
  let detectedTermEnd: Date | null = null;
  let id = 0;

  const buttons = doc.querySelectorAll('button[id^="btnItemTitle_section_"]');

  if (buttons.length === 0) {
    warnings.push(
      "No schedule entries found. Make sure you saved the full HTML page from the registration system."
    );
    return { courses, warnings, termEndDate: null };
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

    // Parse meeting time
    let startTime = "";
    let endTime = "";
    if (info.meetingTime) {
      const times = info.meetingTime.split("-").map((s) => s.trim());
      if (times.length === 2) {
        startTime = convert12to24(times[0]);
        endTime = convert12to24(times[1]);
      }
    }

    // Determine category
    let type = "Lecture";
    if (info.subtypeSection) {
      if (info.subtypeSection.includes("Laboratory")) type = "Lab";
      else if (info.subtypeSection.includes("Tutorial")) type = "Tutorial";
      else if (info.subtypeSection.includes("Lecture")) type = "Lecture";
    }

    // Compute first occurrence
    const meetingDay = info.meetingDay ?? "";
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
        location: info.location ?? "TBA",
        type,
        termStart,
        termEnd,
        firstOccurrence,
      });
    } else {
      warnings.push(`Could not determine schedule for "${title}" — missing day or date info.`);
    }
  });

  return { courses, warnings, termEndDate: detectedTermEnd };
}
