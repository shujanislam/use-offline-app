import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OfflineIndicator } from "@/components/offline/offline-indicator";
import { ServiceWorker } from "@/components/offline/service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Offline-first demo", template: "%s · Offline-first demo" },
  description: "A Next.js App Router app that degrades gracefully offline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorker>
          <OfflineIndicator />
          {children}
        </ServiceWorker>
      </body>
    </html>
  );
}
