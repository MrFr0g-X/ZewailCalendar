"use client";

import { CourseEntry } from "@/lib/scheduleParser";
import { BookOpen, Clock, MapPin } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";

interface SchedulePreviewProps {
  courses: CourseEntry[];
}

const dayColors: Record<string, string> = {
  Sunday: "from-teal-500/20 to-cyan-500/20 border-teal-500/15",
  Monday: "from-cyan-500/20 to-sky-500/20 border-cyan-500/15",
  Tuesday: "from-emerald-500/20 to-teal-500/20 border-emerald-500/15",
  Wednesday: "from-sky-500/20 to-blue-500/20 border-sky-500/15",
  Thursday: "from-teal-400/20 to-emerald-500/20 border-teal-400/15",
  Friday: "from-blue-500/20 to-cyan-500/20 border-blue-500/15",
  Saturday: "from-cyan-400/20 to-teal-400/20 border-cyan-400/15",
};

const SchedulePreview = ({ courses }: SchedulePreviewProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Parsed Schedule
        </h3>
        <span className="text-xs text-muted-foreground glass-panel-light rounded-full px-3 py-1">
          {courses.length} {courses.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <LiquidGlass intensity="sm" tilt={false}>
        <div className="p-4 max-h-[360px] overflow-y-auto space-y-2 scrollbar-thin">
          {courses.map((course, i) => (
            <div
              key={course.id}
              className={`
                rounded-xl p-4 border bg-gradient-to-r ${dayColors[course.day] || "from-muted/20 to-muted/10 border-border/20"}
                opacity-0 animate-fade-up
              `}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {course.courseName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.courseCode}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md shrink-0">
                  {course.type}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {course.day}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {course.startTime} – {course.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {course.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </LiquidGlass>
    </div>
  );
};

export default SchedulePreview;
