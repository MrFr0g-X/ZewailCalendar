"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Clock, X } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";
import { format } from "date-fns";

interface RamadanScheduleDialogProps {
    open: boolean;
    ramadanStart: Date;
    ramadanEnd: Date;
    onSelect: (version: "v1" | "v2") => void;
    onSkip: () => void;
}

const RamadanScheduleDialog = ({
    open,
    ramadanStart,
    ramadanEnd,
    onSelect,
    onSkip,
}: RamadanScheduleDialogProps) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onSkip}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Dialog */}
                    <motion.div
                        className="relative w-full max-w-md z-10"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <LiquidGlass intensity="md" className="p-6">
                            {/* Close button */}
                            <button
                                onClick={onSkip}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Header */}
                            <div className="text-center space-y-2 mb-6">
                                <div className="flex justify-center">
                                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <Moon className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                                <h2 className="text-lg font-semibold">
                                    Ramadan Schedule Detected
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Your term overlaps with Ramadan
                                    <br />
                                    <span className="font-medium text-foreground/80">
                                        {format(ramadanStart, "MMM d")} – {format(ramadanEnd, "MMM d, yyyy")}
                                    </span>
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {/* V1 */}
                                <button
                                    onClick={() => onSelect("v1")}
                                    className="w-full group text-left"
                                >
                                    <LiquidGlass
                                        intensity="sm"
                                        tilt={false}
                                        className="liquid-glass-interactive p-4 transition-all group-hover:ring-1 group-hover:ring-amber-500/30"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Version 1 — With Dhuhr Break
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    9:10 AM – 2:00 PM · Break at 12:00 for Dhuhr prayer
                                                </p>
                                            </div>
                                        </div>
                                    </LiquidGlass>
                                </button>

                                {/* V2 */}
                                <button
                                    onClick={() => onSelect("v2")}
                                    className="w-full group text-left"
                                >
                                    <LiquidGlass
                                        intensity="sm"
                                        tilt={false}
                                        className="liquid-glass-interactive p-4 transition-all group-hover:ring-1 group-hover:ring-blue-500/30"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Version 2 — Continuous
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    9:00 AM – 3:00 PM · No mid-day break
                                                </p>
                                            </div>
                                        </div>
                                    </LiquidGlass>
                                </button>
                            </div>

                            {/* Skip */}
                            <button
                                onClick={onSkip}
                                className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-2"
                            >
                                Skip — use regular timing
                            </button>
                        </LiquidGlass>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RamadanScheduleDialog;
