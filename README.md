# ONE CAREER

ONE CAREER הוא משחק קריירת כדורגל תחרותי למובייל: קריירה מלאה מגיל 16 ועד פרישה בתוך כ־20–30 דקות, עם החלטות מקצועיות, רגעי משחק מבוססי מיומנות ועולם כדורגל שמתפתח לאורך השנים.

הפרויקט מפותח בגישת AI-first באמצעות Codex ו־Claude Desktop. כל הקוד, ההחלטות והמשימות נשמרים ב־GitHub; שיחות עם הסוכנים אינן מקור אמת.

## מצב נוכחי

הפרויקט נמצא בשלב 1: הקמת שלד האפליקציה והכנת ה־Vertical Slice הראשון. שלד ה־Next.js PWA קיים, ומנוע הקריירה הדטרמיניסטי נבנה במסגרת Issue #4. המצב המדויק והמשימה הפעילה מתועדים ב־[docs/STATUS.md](docs/STATUS.md).

## הרצה מקומית

דרישות: Node.js 24 ומעלה.

```bash
npm ci
npm run dev
```

האפליקציה תהיה זמינה כברירת מחדל ב־`http://localhost:3000`.

שערי האיכות:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run audit
```

`npm run check` מריץ lint, בדיקת טיפוסים, בדיקות יחידה ו־build. בדיקת ה־E2E דורשת Chromium של Playwright ו־build קיים.

## מבנה בסיסי

- `src/app` — מסכי App Router, מטא־דאטה ורישום ה־service worker.
- `src/engine` — מנוע הקריירה הדטרמיניסטי: Seed, מצב, פעולות ושמירה. ללא תלות בממשק.
- `src/i18n` — שפות וכיווניות; אנגלית היא ברירת המחדל והבסיס מוכן ל־RTL.
- `public` — נכסי PWA וה־service worker.
- `tests` — בדיקות smoke בדפדפן.
- `docs` — מוצר, ארכיטקטורה, מצב והחלטות.

## מסמכי יסוד

- [מפרט המוצר](docs/PRODUCT.md)
- [ארכיטקטורה](docs/ARCHITECTURE.md)
- [צורת העבודה](docs/WORKFLOW.md)
- [מילון מונחים](docs/GLOSSARY.md)
- [יומן החלטות](docs/decisions/README.md)
- [שחזור הפרויקט](docs/runbooks/RECOVERY.md)
- [אבטחה](SECURITY.md)

## רישיון

בשלב זה לא צורף לפרויקט רישיון קוד פתוח. כל הזכויות שמורות לבעל הפרויקט. אין להעתיק, להפיץ או ליצור יצירה נגזרת ללא אישור מפורש, בכפוף לתנאי GitHub ולדין החל.
