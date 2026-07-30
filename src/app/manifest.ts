import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ONE CAREER",
    short_name: "ONE CAREER",
    description:
      "A competitive football career game where every decision shapes the story.",
    start_url: "/",
    display: "standalone",
    background_color: "#07110d",
    theme_color: "#07110d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
