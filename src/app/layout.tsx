import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { defaultLocale, getTextDirection } from "@/i18n/config";

import { ServiceWorkerRegistration } from "./_components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "ONE CAREER",
  description:
    "A competitive football career game where every decision shapes the story.",
  manifest: "/manifest.webmanifest",
  title: {
    default: "ONE CAREER",
    template: "%s · ONE CAREER",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07110d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={defaultLocale} dir={getTextDirection(defaultLocale)}>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
