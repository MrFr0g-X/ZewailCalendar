import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ZewailCalendar",
  description: "Convert your Zewail City university schedule into a calendar file in seconds",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${instrumentSerif.variable} ${inter.variable} font-display antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
