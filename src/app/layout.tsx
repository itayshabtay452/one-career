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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
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
