import type { Metadata } from "next";

import { PlayClient } from "./_components/play-client";

export const metadata: Metadata = {
  title: "Three season slice",
  description:
    "Play a three season preview of a ONE CAREER run: one decision, one decisive moment and one summary per season.",
};

export default function PlayPage() {
  return <PlayClient />;
}
