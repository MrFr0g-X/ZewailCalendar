"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  /** Controls intensity: "sm" = subtle, "md" = default, "lg" = dramatic */
  intensity?: "sm" | "md" | "lg";
  /** Animate entrance */
  animate?: boolean;
  /** Enable parallax tilt on hover (default true) */
  tilt?: boolean;
}

const TILT_MAX = 10; // degrees — more visible tilt
const SHINE_SIZE = 350; // px radius of specular highlight

const LiquidGlass = ({
  children,
  className,
  intensity = "md",
  animate = false,
  tilt = true,
}: LiquidGlassProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Raw mouse position relative to element centre (−0.5 … 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring followers
  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const sX = useSpring(mouseX, springConfig);
  const sY = useSpring(mouseY, springConfig);

  // Tilt transforms
  const rotateX = useTransform(sY, [-0.5, 0.5], [TILT_MAX, -TILT_MAX]);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-TILT_MAX, TILT_MAX]);

  // Specular highlight position — follows cursor
  const highlightX = useTransform(sX, [-0.5, 0.5], ["25%", "75%"]);
  const highlightY = useTransform(sY, [-0.5, 0.5], ["25%", "75%"]);

  // Dynamic specular background — always computed (hooks can't be conditional)
  const specularBg = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) =>
      `radial-gradient(${SHINE_SIZE}px circle at ${hx} ${hy}, hsl(0 0% 100% / 0.07), transparent 60%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformPerspective: 800,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      className={cn(
        "liquid-glass relative",
        intensity === "sm" && "liquid-glass--sm",
        intensity === "lg" && "liquid-glass--lg",
        animate && "animate-scale-in",
        className
      )}
    >
      {/* Layer 1: Outer depth shadow (bottom-most) */}
      <div className="liquid-glass__shadow" aria-hidden="true" />
      {/* Layer 2: Base blur layer */}
      <div className="liquid-glass__base" aria-hidden="true" />
      {/* Layer 3: Mid blur layer (inset ~3%) */}
      <div className="liquid-glass__mid" aria-hidden="true" />
      {/* Layer 4: Inner highlight layer (inset ~5%) */}
      <div className="liquid-glass__inner" aria-hidden="true" />
      {/* Layer 5: Top specular / refraction rim */}
      <div className="liquid-glass__specular" aria-hidden="true" />

      {/* Layer 6: Dynamic specular highlight that follows cursor */}
      {tilt && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] z-[6] pointer-events-none"
          style={{ background: specularBg }}
          aria-hidden="true"
        />
      )}

      {/* Content sits on top of all layers */}
      <div className="liquid-glass__content relative z-10">{children}</div>
    </motion.div>
  );
};

export default LiquidGlass;
