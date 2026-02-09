"use client";

import { Download, RotateCcw, Loader2 } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";

interface SuccessStateProps {
  onDownload: () => void;
  onReset: () => void;
  onGoogleCalendar: () => void;
  googleCalendarLoading?: boolean;
  isSignedIn?: boolean;
}

const GoogleCalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff" />
    <path d="M18.316 18.316H24V5.684h-5.684v12.632z" fill="#1967D2" />
    <path d="M5.684 18.316v5.684H18.316L24 18.316H5.684z" fill="#188038" />
    <path d="M24 5.684L18.316 0v5.684H24z" fill="#1967D2" opacity="0.4" />
    <path d="M0 18.316v1.137C0 21.457 1.543 23 3.547 23h2.137v-4.684H0z" fill="#188038" opacity="0.4" />
    <path d="M18.316 0H3.547C1.543 0 0 1.543 0 3.547V18.316h5.684V5.684h12.632V0z" fill="#4285F4" />
    <path d="M8.07 17.16c-.67-.45-1.13-1.1-1.39-1.96l1.55-.64c.14.56.4 1 .77 1.3.37.31.82.46 1.34.46.53 0 .99-.16 1.37-.49.38-.33.57-.74.57-1.24 0-.51-.2-.93-.59-1.25-.39-.32-.88-.48-1.47-.48h-.91v-1.53h.82c.51 0 .93-.14 1.27-.42.34-.28.51-.66.51-1.13 0-.42-.16-.76-.47-1.02-.31-.26-.71-.39-1.2-.39-.48 0-.86.13-1.14.38-.28.26-.49.59-.61.99l-1.53-.64c.22-.64.64-1.18 1.27-1.62.62-.44 1.35-.66 2.17-.66.61 0 1.16.12 1.65.35.49.24.88.57 1.16 1 .28.43.42.91.42 1.45 0 .55-.13 1.02-.4 1.4-.27.38-.6.67-.99.86v.09c.5.2.9.53 1.2.97.3.44.45.96.45 1.55 0 .6-.15 1.13-.45 1.59-.3.47-.72.83-1.24 1.1-.53.27-1.12.4-1.78.4-.82 0-1.55-.22-2.17-.67z" fill="#4285F4" />
    <path d="M15.5 9.55l-1.7 1.24-.86-1.3 3.04-2.19h1.19v9.86h-1.67V9.55z" fill="#4285F4" />
  </svg>
);

const SuccessState = ({ onDownload, onReset, onGoogleCalendar, googleCalendarLoading, isSignedIn }: SuccessStateProps) => {
  return (
    <LiquidGlass intensity="lg" animate>
      <div className="p-8 text-center space-y-6">
        {/* Checkmark animation */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center" style={{ boxShadow: "0 0 30px hsl(150 60% 45% / 0.25)" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-emerald-400">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path
              d="M12 20L18 26L28 14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 48,
                animation: "checkmark-draw 0.6s 0.3s ease-out forwards",
              }}
            />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-foreground mb-1">Calendar Ready!</h3>
          <p className="text-sm text-muted-foreground">
            Your .ics file has been generated successfully
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Primary actions row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDownload}
              className="flex-1 h-12 rounded-xl gradient-button text-primary-foreground font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Download className="w-4 h-4" />
              Download .ics
            </button>
            <button
              onClick={onReset}
              className="flex-1 h-12 rounded-xl glass-panel-light text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/10 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Google Calendar button */}
          <button
            onClick={onGoogleCalendar}
            disabled={googleCalendarLoading}
            className="w-full h-12 rounded-xl glass-panel-light text-foreground font-medium flex items-center justify-center gap-3 hover:bg-muted/10 hover:scale-[1.01] active:scale-[0.99] transition-all group disabled:opacity-60"
          >
            {googleCalendarLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleCalendarIcon />
            )}
            <span>
              {googleCalendarLoading
                ? "Sending to Google Calendar..."
                : isSignedIn
                  ? "Send to Google Calendar"
                  : "Sign in & Send to Google Calendar"}
            </span>
          </button>
        </div>
      </div>
    </LiquidGlass>
  );
};

export default SuccessState;
