"use client";

import { motion, AnimatePresence } from "framer-motion";

interface RamadanDynamicIslandProps {
    active: boolean;
    onClick?: () => void;
}

/**
 * An Apple Dynamic-Island–style notch indicator that slides in at the top of
 * the page when Ramadan timing is active. Brown-black glowy pill with a
 * pulsing green dot and crescent moon emoji.
 */
const RamadanDynamicIsland = ({ active, onClick }: RamadanDynamicIslandProps) => {
    return (
        <AnimatePresence>
            {active && (
                <motion.button
                    onClick={onClick}
                    initial={{ opacity: 0, y: -40, scaleX: 0.5 }}
                    animate={{ opacity: 1, y: 0, scaleX: 1 }}
                    exit={{ opacity: 0, y: -30, scaleX: 0.6 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                        mass: 0.8,
                    }}
                    className="
            fixed top-4 left-1/2 -translate-x-1/2 z-40
            flex items-center gap-2.5 px-5 py-2.5
            rounded-full cursor-pointer
            select-none
            transition-shadow duration-500
            hover:scale-[1.03] active:scale-[0.98]
          "
                    style={{
                        background:
                            "linear-gradient(135deg, hsl(30 15% 8%) 0%, hsl(25 20% 12%) 50%, hsl(20 15% 10%) 100%)",
                        border: "1px solid hsl(30 20% 18% / 0.6)",
                        boxShadow: `
              0 0 20px hsl(30 30% 12% / 0.5),
              0 0 60px hsl(25 40% 10% / 0.3),
              0 4px 24px hsl(0 0% 0% / 0.5),
              inset 0 1px 0 hsl(30 30% 25% / 0.15),
              inset 0 -1px 0 hsl(0 0% 0% / 0.2)
            `,
                    }}
                >
                    {/* Pulsing green dot */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span
                            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                            style={{ backgroundColor: "hsl(145 80% 48%)" }}
                        />
                        <span
                            className="relative inline-flex h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor: "hsl(145 80% 48%)",
                                boxShadow: "0 0 8px hsl(145 80% 48% / 0.6)",
                            }}
                        />
                    </span>

                    {/* Moon emoji */}
                    <span className="text-sm leading-none" role="img" aria-label="crescent moon">
                        🌙
                    </span>

                    {/* Label */}
                    <span
                        className="text-xs font-medium tracking-wide whitespace-nowrap"
                        style={{ color: "hsl(35 30% 70%)" }}
                    >
                        Ramadan Timing Active
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default RamadanDynamicIsland;
