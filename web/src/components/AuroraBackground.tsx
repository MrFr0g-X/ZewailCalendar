"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const AuroraBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spring = { stiffness: 50, damping: 30, mass: 1 };
  const sX = useSpring(mouseX, spring);
  const sY = useSpring(mouseY, spring);

  const orbOffset1X = useTransform(sX, [-0.5, 0.5], [-40, 40]);
  const orbOffset1Y = useTransform(sY, [-0.5, 0.5], [-30, 30]);
  const orbOffset2X = useTransform(sX, [-0.5, 0.5], [30, -30]);
  const orbOffset2Y = useTransform(sY, [-0.5, 0.5], [25, -25]);
  const orbOffset3X = useTransform(sX, [-0.5, 0.5], [-20, 20]);
  const orbOffset3Y = useTransform(sY, [-0.5, 0.5], [-20, 20]);
  const orbOffset4X = useTransform(sX, [-0.5, 0.5], [15, -15]);
  const orbOffset4Y = useTransform(sY, [-0.5, 0.5], [10, -10]);

  const glowX = useTransform(sX, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(sY, [-0.5, 0.5], ["20%", "80%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(210 100% 14% / 0.7) 0%, transparent 70%), " +
            "radial-gradient(ellipse 60% 80% at 80% 60%, hsl(190 60% 12% / 0.5) 0%, transparent 70%), " +
            "radial-gradient(ellipse 70% 50% at 20% 80%, hsl(195 80% 14% / 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Cursor glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          left: glowX,
          top: glowY,
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, hsl(195 100% 50% / 0.06) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Orb 1 — teal, slow drift */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(180 100% 27% / 0.16) 0%, hsl(180 100% 27% / 0.04) 40%, transparent 70%)",
          filter: "blur(80px)",
          top: "10%",
          left: "15%",
          x: orbOffset1X,
          y: orbOffset1Y,
        }}
        animate={{ scale: [1, 1.15, 0.95, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 2 — bright cyan */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(195 100% 50% / 0.12) 0%, hsl(195 100% 50% / 0.03) 45%, transparent 70%)",
          filter: "blur(90px)",
          bottom: "5%",
          right: "10%",
          x: orbOffset2X,
          y: orbOffset2Y,
        }}
        animate={{ scale: [1.1, 0.9, 1.05, 0.95, 1.1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 3 — deep navy-teal blend */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(190 80% 35% / 0.1) 0%, hsl(190 80% 35% / 0.02) 50%, transparent 70%)",
          filter: "blur(100px)",
          top: "40%",
          left: "50%",
          x: orbOffset3X,
          y: orbOffset3Y,
        }}
        animate={{ scale: [0.95, 1.1, 1, 1.08, 0.95] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 4 — concentrated teal pulse */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(180 80% 32% / 0.1) 0%, transparent 60%)",
          filter: "blur(70px)",
          top: "60%",
          left: "25%",
          x: orbOffset4X,
          y: orbOffset4Y,
        }}
        animate={{
          scale: [1, 1.2, 0.9, 1.15, 1],
          opacity: [0.6, 1, 0.7, 0.9, 0.6],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mesh noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
};

export default AuroraBackground;
