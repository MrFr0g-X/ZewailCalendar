"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
        <TooltipProvider>
          {children}
          <Toaster />
          <SonnerToaster />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
