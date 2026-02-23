"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Clock, MapPin, CalendarDays, AlertTriangle, Check } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";
import type { IncompleteCourseEntry, CourseEntry } from "@/lib/scheduleParser";

// ── Types ────────────────────────────────────────────────────────────────

interface MeetingSlot {
    day: string;
    startTime: string; // 12h format like "8:10 AM"
    endTime: string;   // 12h format like "10:00 AM"
    location: string;
}

interface CourseSlots {
    courseName: string;
    type: string;
    termStart: Date | null;
    termEnd: Date | null;
    meetings: MeetingSlot[];
}

interface MultiMeetingEditorProps {
    incompleteEntries: IncompleteCourseEntry[];
    onConfirm: (completedCourses: CourseEntry[]) => void;
    onSkip: () => void;
    nextId: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const TIME_OPTIONS = [
    "7:00 AM", "7:30 AM",
    "8:00 AM", "8:10 AM", "8:30 AM",
    "9:00 AM", "9:30 AM",
    "10:00 AM", "10:10 AM", "10:30 AM",
    "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM",
    "1:00 PM", "1:10 PM", "1:30 PM",
    "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM",
    "5:00 PM", "5:30 PM",
    "6:00 PM",
];

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

function computeFirstOccurrence(termStart: Date, dayName: string): Date | null {
    const dayMap: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6,
    };
    const targetDay = dayMap[dayName];
    if (targetDay === undefined) return null;
    const date = new Date(termStart);
    for (let i = 0; i < 7; i++) {
        if (date.getDay() === targetDay) return date;
        date.setDate(date.getDate() + 1);
    }
    return null;
}

const emptySlot = (): MeetingSlot => ({
    day: "Sunday",
    startTime: "8:10 AM",
    endTime: "10:00 AM",
    location: "",
});

// ── Component ────────────────────────────────────────────────────────────

const MultiMeetingEditor = ({
    incompleteEntries,
    onConfirm,
    onSkip,
    nextId,
}: MultiMeetingEditorProps) => {
    const [courseSlots, setCourseSlots] = useState<CourseSlots[]>(() =>
        incompleteEntries.map((entry) => ({
            courseName: entry.courseName,
            type: entry.type,
            termStart: entry.termStart,
            termEnd: entry.termEnd,
            meetings: [emptySlot(), emptySlot()], // default 2 meeting slots
        }))
    );

    // ── Slot manipulation ──

    const updateSlot = (
        courseIdx: number,
        slotIdx: number,
        field: keyof MeetingSlot,
        value: string
    ) => {
        setCourseSlots((prev) => {
            const next = [...prev];
            const course = { ...next[courseIdx] };
            const meetings = [...course.meetings];
            meetings[slotIdx] = { ...meetings[slotIdx], [field]: value };
            course.meetings = meetings;
            next[courseIdx] = course;
            return next;
        });
    };

    const addSlot = (courseIdx: number) => {
        setCourseSlots((prev) => {
            const next = [...prev];
            const course = { ...next[courseIdx] };
            course.meetings = [...course.meetings, emptySlot()];
            next[courseIdx] = course;
            return next;
        });
    };

    const removeSlot = (courseIdx: number, slotIdx: number) => {
        setCourseSlots((prev) => {
            const next = [...prev];
            const course = { ...next[courseIdx] };
            course.meetings = course.meetings.filter((_, i) => i !== slotIdx);
            next[courseIdx] = course;
            return next;
        });
    };

    // ── Confirm handler ──

    const handleConfirm = () => {
        let id = nextId;
        const completed: CourseEntry[] = [];

        for (const course of courseSlots) {
            for (const meeting of course.meetings) {
                const startTime = convert12to24(meeting.startTime);
                const endTime = convert12to24(meeting.endTime);
                const firstOccurrence =
                    course.termStart ? computeFirstOccurrence(course.termStart, meeting.day) : null;

                if (firstOccurrence) {
                    completed.push({
                        id: String(++id),
                        courseName: course.courseName,
                        courseCode: "",
                        day: meeting.day,
                        startTime,
                        endTime,
                        location: meeting.location || "Multi-meeting — set location",
                        type: course.type,
                        termStart: course.termStart,
                        termEnd: course.termEnd,
                        firstOccurrence,
                    });
                }
            }
        }

        onConfirm(completed);
    };

    // ── Render ──

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <LiquidGlass intensity="md" animate>
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                Multi-Meeting Courses Detected
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {courseSlots.length === 1
                                    ? "1 course has"
                                    : `${courseSlots.length} courses have`}{" "}
                                multiple meeting times that aren&apos;t in the HTML.
                                Please fill in the schedule below.
              </p>
              <p className="text-xs text-amber-400/70 mt-2 leading-relaxed">
                 This is a manual process  the Self-Service platform doesn't include
                the full schedule for these courses in the downloaded HTML. You'll need
                to check the exact meeting days, times, and rooms by clicking on each
                course in your{" "}
                <span className="text-amber-300 font-medium">Self-Service account</span>{" "}
                and entering the info here.
                            </p>
                        </div>
                    </div>

                    {/* Course sections */}
                    <div className="space-y-5">
                        {courseSlots.map((course, courseIdx) => (
                            <div
                                key={courseIdx}
                                className="rounded-xl border border-border/30 overflow-hidden"
                                style={{ background: "hsl(200 20% 8% / 0.4)" }}
                            >
                                {/* Course header */}
                                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="text-sm font-medium text-foreground truncate">
                                        {course.courseName}
                                    </span>
                                    <span className="ml-auto text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted/20">
                                        {course.type}
                                    </span>
                                </div>

                                {/* Meeting slots */}
                                <div className="p-4 space-y-3">
                                    <AnimatePresence initial={false}>
                                        {course.meetings.map((slot, slotIdx) => (
                                            <motion.div
                                                key={slotIdx}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="rounded-lg border border-border/20 p-3 space-y-3"
                                                    style={{ background: "hsl(200 15% 10% / 0.5)" }}>
                                                    {/* Slot header */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            Meeting {slotIdx + 1}
                                                        </span>
                                                        {course.meetings.length > 1 && (
                                                            <button
                                                                onClick={() => removeSlot(courseIdx, slotIdx)}
                                                                className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Day selector */}
                                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                                                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                                        <select
                                                            value={slot.day}
                                                            onChange={(e) => updateSlot(courseIdx, slotIdx, "day", e.target.value)}
                                                            className="w-full rounded-lg px-3 py-1.5 text-sm bg-muted/20 border border-border/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                        >
                                                            {DAYS.map((d) => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>

                                                        {/* Time from–to */}
                                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={slot.startTime}
                                                                onChange={(e) => updateSlot(courseIdx, slotIdx, "startTime", e.target.value)}
                                                                className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-muted/20 border border-border/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                            >
                                                                {TIME_OPTIONS.map((t) => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                            <span className="text-xs text-muted-foreground">to</span>
                                                            <select
                                                                value={slot.endTime}
                                                                onChange={(e) => updateSlot(courseIdx, slotIdx, "endTime", e.target.value)}
                                                                className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-muted/20 border border-border/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                            >
                                                                {TIME_OPTIONS.map((t) => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Location */}
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <input
                                                            type="text"
                                                            value={slot.location}
                                                            onChange={(e) => updateSlot(courseIdx, slotIdx, "location", e.target.value)}
                                                            placeholder="Room / Building (optional)"
                                                            className="w-full rounded-lg px-3 py-1.5 text-sm bg-muted/20 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Add another slot */}
                                    <button
                                        onClick={() => addSlot(courseIdx)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border/30 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add another meeting time
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip these courses
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: "linear-gradient(135deg, hsl(180 100% 27%) 0%, hsl(195 100% 40%) 100%)",
                                boxShadow: "0 0 20px hsl(180 100% 27% / 0.3), 0 2px 8px hsl(0 0% 0% / 0.3)",
                            }}
                        >
                            <Check className="w-4 h-4" />
                            Confirm &amp; Continue
                        </button>
                    </div>
                </div>
            </LiquidGlass>
        </motion.div>
    );
};

export default MultiMeetingEditor;
