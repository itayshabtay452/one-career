import type { Locale } from "./config";

type HomeDictionary = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  stats: ReadonlyArray<{
    label: string;
    value: string;
  }>;
};

export const dictionaries: Record<Locale, HomeDictionary> = {
  en: {
    eyebrow: "A football life in one sitting",
    title: "One career. Every decision counts.",
    description:
      "Build a player, survive the setbacks, and shape a complete football story in 20-30 minutes.",
    status: "Stage 1 · Building the first playable foundation",
    stats: [
      { value: "18-22", label: "seasons per career" },
      { value: "20-30", label: "minutes per run" },
      { value: "1", label: "career worth remembering" },
    ],
  },
  he: {
    eyebrow: "חיי כדורגל בסשן אחד",
    title: "קריירה אחת. כל החלטה קובעת.",
    description:
      "בנו שחקן, התמודדו עם משברים ועצבו סיפור כדורגל שלם בתוך 20-30 דקות.",
    status: "שלב 1 · בונים את הבסיס הראשון שניתן לשחק בו",
    stats: [
      { value: "18-22", label: "עונות בכל קריירה" },
      { value: "20-30", label: "דקות בכל ריצה" },
      { value: "1", label: "קריירה ששווה לזכור" },
    ],
  },
};
