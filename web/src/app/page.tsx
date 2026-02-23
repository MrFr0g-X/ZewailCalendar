"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession, signIn } from "next-auth/react";
import FileUpload from "@/components/FileUpload";
import SchedulePreview from "@/components/SchedulePreview";
import TermDateSelector from "@/components/TermDateSelector";
import GenerateButton from "@/components/GenerateButton";
import SuccessState from "@/components/SuccessState";
import AuroraBackground from "@/components/AuroraBackground";
import LiquidGlass from "@/components/LiquidGlass";
import RamadanDynamicIsland from "@/components/RamadanDynamicIsland";
import { parseScheduleHTML, CourseEntry, IncompleteCourseEntry } from "@/lib/scheduleParser";
import MultiMeetingEditor from "@/components/MultiMeetingEditor";
import { generateICS, downloadICS, toGoogleCalendarEvents } from "@/lib/icsGenerator";
import { toast } from "@/components/ui/sonner";
import RamadanScheduleDialog from "@/components/RamadanScheduleDialog";
import {
  type RamadanConfig,
  type RamadanVersion,
  fetchRamadanDates,
  doesTermOverlapRamadan,
  isDateInRamadan,
} from "@/lib/ramadanSchedule";
import { Moon } from "lucide-react";

type AppStep = "upload" | "multi-meeting" | "configure" | "success";

const STORAGE_KEY = "zewailcalendar_state";

interface SavedState {
  courses: CourseEntry[];
  termDate: string | null; // ISO string
  icsContent: string;
  step: AppStep;
  fileName: string | null;
  pendingGoogleCalendar: boolean;
}

function saveStateToStorage(state: SavedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage might be full or unavailable — silently ignore
  }
}

function loadStateFromStorage(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

const stepVariants = {
  initial: { opacity: 0, y: 30, scale: 0.97, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.97,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
};

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep] = useState<AppStep>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [termDate, setTermDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [incompleteEntries, setIncompleteEntries] = useState<IncompleteCourseEntry[]>([]);
  const [icsContent, setIcsContent] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const hasRestoredRef = useRef(false);

  // ── Ramadan state ──
  const [ramadanConfig, setRamadanConfig] = useState<RamadanConfig | undefined>();
  const [showRamadanDialog, setShowRamadanDialog] = useState(false);
  const [ramadanDates, setRamadanDates] = useState<{ start: Date; end: Date } | null>(null);
  const [ramadanChecked, setRamadanChecked] = useState(false);

  //  Auto-detect Ramadan on page load (independent of file upload) ──
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    let cancelled = false;

    const checkCurrentRamadan = async () => {
      try {
        const dates = await fetchRamadanDates(year);
        if (cancelled) return;

        if (dates && isDateInRamadan(now, dates.start, dates.end)) {
          setRamadanDates(dates);
          // Show the Dynamic Island immediately (but don't open the dialog until upload)
          setRamadanConfig((prev) => prev ?? { version: "v1", ramadanStart: dates.start, ramadanEnd: dates.end });
        }
      } catch {
        // Silently fail  not critical for page load
      }
    };

    checkCurrentRamadan();
    return () => { cancelled = true; };
  }, []);

  // Send events to Google Calendar (extracted so it can be called from restore flow too)
  const sendToGoogleCalendar = useCallback(
    async (coursesToSend: CourseEntry[], termDateToUse: Date) => {
      setGoogleLoading(true);
      try {
        const events = toGoogleCalendarEvents(coursesToSend, termDateToUse, ramadanConfig);
        const res = await fetch("/api/google-calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
        });
        const data = await res.json();

        if (res.ok) {
          const succeeded = data.results?.filter((r: { success: boolean }) => r.success).length ?? 0;
          toast.success("Added to Google Calendar", {
            description: `${succeeded} course event(s) created successfully`,
          });
        } else if (res.status === 401) {
          // Token expired or not authenticated — prompt re-auth
          toast.error("Google session expired", {
            description: "Please sign in again to send events.",
          });
          // Save state before redirecting to re-auth
          saveStateToStorage({
            courses: coursesToSend,
            termDate: termDateToUse.toISOString(),
            icsContent,
            step: "success",
            fileName,
            pendingGoogleCalendar: true,
          });
          signIn("google", { callbackUrl: window.location.href });
          return;
        } else {
          toast.error("Failed to add events", {
            description: data.error || "Unknown error",
          });
        }
      } catch (err) {
        toast.error("Network error", {
          description: err instanceof Error ? err.message : "Could not reach the server",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [icsContent, fileName]
  );

  // Restore state from sessionStorage after OAuth redirect
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const saved = loadStateFromStorage();
    if (!saved) return;

    // Restore all state — rehydrate Date objects that were serialized as strings
    const rehydrated = saved.courses.map((c) => ({
      ...c,
      firstOccurrence: c.firstOccurrence ? new Date(c.firstOccurrence) : null,
    }));
    setCourses(rehydrated);
    setFileName(saved.fileName);
    setIcsContent(saved.icsContent);
    setStep(saved.step);
    if (saved.termDate) {
      setTermDate(new Date(saved.termDate));
    }

    // If we came back from OAuth and need to auto-send, set the pending flag
    if (saved.pendingGoogleCalendar && saved.termDate && saved.courses.length > 0) {
      toast.info("Welcome back! Sending events to Google Calendar...");
      try {
        sessionStorage.setItem(STORAGE_KEY + "_pending", "true");
      } catch {
        // ignore
      }
    }
  }, []);

  // Auto-send to Google Calendar when session becomes available after OAuth redirect
  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      session?.accessToken &&
      courses.length > 0 &&
      termDate &&
      step === "success" &&
      !googleLoading
    ) {
      const raw = sessionStorage.getItem(STORAGE_KEY + "_pending");
      if (raw === "true") {
        sessionStorage.removeItem(STORAGE_KEY + "_pending");
        sendToGoogleCalendar(courses, termDate);
      }
    }
  }, [sessionStatus, session, courses, termDate, step, googleLoading, sendToGoogleCalendar]);

  const handleFileLoaded = useCallback((content: string, name: string) => {
    try {
      setFileName(name);
      const result = parseScheduleHTML(content);
      setCourses(result.courses);

      // Auto-detect term end date
      if (result.termEndDate) {
        setTermDate(result.termEndDate);
      }

      if (result.warnings.length > 0) {
        toast.warning("Parse warnings", {
          description: result.warnings.join("\n"),
        });
      }

      // Store incomplete entries (multi-meeting courses)
      setIncompleteEntries(result.incompleteEntries);

      if (result.courses.length > 0 || result.incompleteEntries.length > 0) {
        if (result.incompleteEntries.length > 0) {
          setStep("multi-meeting");
          toast.info(`${result.incompleteEntries.length} course(s) need manual schedule input`, {
            description: "These courses have multiple meeting times not included in the HTML.",
          });
        } else {
          setStep("configure");
        }
        toast.success(`Parsed ${result.courses.length} course entries`);
      } else {
        toast.error("No courses found", {
          description: "Make sure you saved the correct HTML page from the registration system.",
        });
      }
    } catch (err) {
      toast.error("Failed to parse file", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  // ── Ramadan detection: triggers when courses are loaded ──
  useEffect(() => {
    if (courses.length === 0) return;

    // Use the first course's termStart year for Ramadan lookup
    const firstCourse = courses.find((c) => c.termStart);
    if (!firstCourse?.termStart) {
      setRamadanChecked(true);
      return;
    }

    let cancelled = false;
    const checkRamadan = async () => {
      const year = firstCourse.termStart!.getFullYear();
      const dates = await fetchRamadanDates(year);

      if (cancelled) return;

      if (dates && firstCourse.termStart && firstCourse.termEnd) {
        if (
          doesTermOverlapRamadan(
            firstCourse.termStart,
            firstCourse.termEnd,
            dates.start,
            dates.end
          )
        ) {
          setRamadanDates(dates);
          setShowRamadanDialog(true);
        } else {
          setRamadanConfig(undefined);
        }
      } else {
        setRamadanConfig(undefined);
      }
      setRamadanChecked(true);
    };

    setRamadanChecked(false);
    checkRamadan();
    return () => {
      cancelled = true;
    };
  }, [courses]);

  const handleRamadanSelect = useCallback(
    (version: RamadanVersion) => {
      if (ramadanDates) {
        setRamadanConfig({
          version,
          ramadanStart: ramadanDates.start,
          ramadanEnd: ramadanDates.end,
        });
      }
      setShowRamadanDialog(false);
    },
    [ramadanDates]
  );

  const handleRamadanSkip = useCallback(() => {
    setRamadanConfig(undefined);
    setShowRamadanDialog(false);
  }, []);

  const handleClear = useCallback(() => {
    setFileName(null);
    setCourses([]);
    setIncompleteEntries([]);
    setStep("upload");
    setTermDate(undefined);
    setRamadanConfig(undefined);
    setRamadanDates(null);
    setRamadanChecked(false);
    setIcsContent("");
  }, []);

  const handleGenerate = useCallback(() => {
    if (!termDate || courses.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      const ics = generateICS(courses, termDate, ramadanConfig);
      setIcsContent(ics);
      setLoading(false);
      setStep("success");
    }, 800);
  }, [termDate, courses, ramadanConfig]);

  const handleDownload = useCallback(() => {
    if (icsContent) downloadICS(icsContent);
  }, [icsContent]);

  const handleGoogleCalendar = useCallback(async () => {
    if (!session) {
      // Save state before OAuth redirect
      saveStateToStorage({
        courses,
        termDate: termDate ? termDate.toISOString() : null,
        icsContent,
        step,
        fileName,
        pendingGoogleCalendar: true,
      });
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    if (!termDate || courses.length === 0) return;

    await sendToGoogleCalendar(courses, termDate);
  }, [session, courses, termDate, icsContent, step, fileName, sendToGoogleCalendar]);

  const isSignedIn = sessionStatus === "authenticated";

  // Skip landing if returning from OAuth redirect (state was saved)
  useEffect(() => {
    if (step !== "upload" || fileName) {
      setShowLanding(false);
    }
  }, [step, fileName]);

  return (
    <>
      {/* Video Landing Overlay */}
      <AnimatePresence>
        {showLanding && (
          <motion.div
            key="landing"
            className="fixed inset-0 z-50 bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={() => setShowLanding(false)}
              src={isMobile ? "/hero-mobile.mp4" : "/hero-desktop.mp4"}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Island - Ramadan timing indicator */}
      <RamadanDynamicIsland
        active={!!ramadanConfig}
        onClick={() => setShowRamadanDialog(true)}
      />

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <AuroraBackground />

        <div className="relative w-full max-w-lg space-y-8">
          {/* Hero */}
          <motion.header
            className="text-center space-y-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="flex justify-center mb-2"
            >
              <Image
                src="/logo.png"
                alt="ZewailCalendar"
                width={72}
                height={72}
                className="rounded-2xl"
                priority
              />
            </motion.div>
            <motion.h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
            >
              <span className="gradient-text">ZewailCalendar</span>
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              Convert your university schedule into a calendar file in seconds
            </motion.p>
          </motion.header>

          {/* File Upload */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.4 }}
          >
            <FileUpload onFileLoaded={handleFileLoaded} fileName={fileName} onClear={handleClear} />
          </motion.section>

          {/* Animated step transitions */}
          <AnimatePresence mode="wait">
            {step === "multi-meeting" && (
              <motion.section
                key="multi-meeting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <MultiMeetingEditor
                  incompleteEntries={incompleteEntries}
                  nextId={courses.length}
                  onConfirm={(completedCourses) => {
                    setCourses((prev) => [...prev, ...completedCourses]);
                    setIncompleteEntries([]);
                    setStep("configure");
                  }}
                  onSkip={() => {
                    setIncompleteEntries([]);
                    setStep("configure");
                  }}
                />
              </motion.section>
            )}
            {step === "configure" && (
              <motion.section
                key="configure"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <motion.div variants={staggerItem}>
                  <SchedulePreview courses={courses} />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <TermDateSelector date={termDate} onDateChange={setTermDate} />
                </motion.div>

                {/* Ramadan timing indicator */}
                {ramadanConfig && (
                  <motion.div variants={staggerItem}>
                    <button
                      onClick={() => setShowRamadanDialog(true)}
                      className="w-full group"
                    >
                      <LiquidGlass intensity="sm" tilt={false} className="liquid-glass-interactive p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Moon className="h-4 w-4 text-amber-500" />
                          <span className="text-amber-500 font-medium">
                            Ramadan Timing Active
                          </span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {ramadanConfig.version === "v1" ? "V1 — Dhuhr Break" : "V2 — Continuous"}
                          </span>
                          <span className="text-muted-foreground/50 text-xs">Change</span>
                        </div>
                      </LiquidGlass>
                    </button>
                  </motion.div>
                )}

                <motion.div variants={staggerItem}>
                  <GenerateButton
                    disabled={!termDate || courses.length === 0 || !ramadanChecked}
                    loading={loading}
                    onClick={handleGenerate}
                  />
                </motion.div>
              </motion.section>
            )}

            {step === "success" && (
              <motion.section
                key="success"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <SuccessState
                  onDownload={handleDownload}
                  onReset={handleClear}
                  onGoogleCalendar={handleGoogleCalendar}
                  googleCalendarLoading={googleLoading}
                  isSignedIn={isSignedIn}
                />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Ramadan schedule selection dialog */}
          {ramadanDates && (
            <RamadanScheduleDialog
              open={showRamadanDialog}
              ramadanStart={ramadanDates.start}
              ramadanEnd={ramadanDates.end}
              onSelect={handleRamadanSelect}
              onSkip={handleRamadanSkip}
            />
          )}

          {/* Footer */}
          <motion.footer
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-xs text-muted-foreground/50">
              All processing happens locally in your browser · No data is uploaded
            </p>
            <p className="text-[10px] text-muted-foreground/20">
              developed by{" "}
              <a
                href="https://github.com/MrFr0g-X"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground/40 transition-colors"
              >
                Hothifa Hamdan
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </>
  );
}
