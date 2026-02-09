"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import FileUpload from "@/components/FileUpload";
import SchedulePreview from "@/components/SchedulePreview";
import TermDateSelector from "@/components/TermDateSelector";
import GenerateButton from "@/components/GenerateButton";
import SuccessState from "@/components/SuccessState";
import LiquidGlass from "@/components/LiquidGlass";
import AuroraBackground from "@/components/AuroraBackground";
import { parseScheduleHTML, CourseEntry } from "@/lib/scheduleParser";
import { generateICS, downloadICS, toGoogleCalendarEvents } from "@/lib/icsGenerator";
import { toast } from "@/components/ui/sonner";

type AppStep = "upload" | "configure" | "success";

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
  const [step, setStep] = useState<AppStep>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [termDate, setTermDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [icsContent, setIcsContent] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const hasRestoredRef = useRef(false);

  // Send events to Google Calendar (extracted so it can be called from restore flow too)
  const sendToGoogleCalendar = useCallback(
    async (coursesToSend: CourseEntry[], termDateToUse: Date) => {
      setGoogleLoading(true);
      try {
        const events = toGoogleCalendarEvents(coursesToSend, termDateToUse);
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

    // Restore all state
    setCourses(saved.courses);
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

      if (result.courses.length > 0) {
        setStep("configure");
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

  const handleClear = useCallback(() => {
    setFileName(null);
    setCourses([]);
    setStep("upload");
    setTermDate(undefined);
    setIcsContent("");
  }, []);

  const handleGenerate = useCallback(() => {
    if (!termDate || courses.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      const ics = generateICS(courses, termDate);
      setIcsContent(ics);
      setLoading(false);
      setStep("success");
    }, 800);
  }, [termDate, courses]);

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

  return (
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
          >
            <LiquidGlass intensity="sm" className="inline-flex items-center justify-center w-14 h-14 !rounded-2xl mb-2">
              <Calendar className="w-7 h-7 text-primary" />
            </LiquidGlass>
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
              <motion.div variants={staggerItem}>
                <GenerateButton
                  disabled={!termDate || courses.length === 0}
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

        {/* Footer */}
        <motion.footer
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-xs text-muted-foreground/50">
            All processing happens locally in your browser · No data is uploaded
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
