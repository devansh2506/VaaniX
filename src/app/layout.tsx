import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const carlito = localFont({
  src: [
    {
      path: "../../public/fonts/carlito-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/carlito-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/carlito-bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/carlito-bold-italic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Calibri", "Carlito", "Segoe UI", "system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VaaniX — Catch AI voice-clone scam calls",
  description: "Catch AI voice-clone scams during the call — before the money moves.",
  openGraph: {
    title: "VaaniX — Catch AI voice-clone scam calls",
    description: "Catch AI voice-clone scams during the call — before the money moves.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${carlito.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface text-navy font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
