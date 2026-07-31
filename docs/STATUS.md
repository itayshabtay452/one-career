# מצב הפרויקט

עודכן: 31 ביולי 2026

## שלב נוכחי

שלב 1 — הקמת שלד האפליקציה והכנת ה־Vertical Slice הראשון.

שלב 0 — מערכת העבודה, מקורות האמת והגנות הפרויקט — הושלם ב־30 ביולי 2026.

## המשימה הפעילה

[Issue #4](https://github.com/itayshabtay452/one-career/issues/4) — הגדרת מנוע קריירה דטרמיניסטי ופורמט Seed.

העבודה נמצאת ב־[Draft PR #10](https://github.com/itayshabtay452/one-career/pull/10) על הענף `feat/4-career-engine`. הסוכן הכותב הוא Claude Code. Codex השלים סקירה עצמאית, חמשת ממצאיה טופלו, וה־PR ממתין לסקירה חוזרת ולאישור מפורש של בעל הפרויקט לפני מיזוג, כי המשימה מסווגת צהוב.

## מה קיים ב־main

- תוכנית מוצר ל־V1, חוזה עבודה לסוכנים ומסמכי מוצר, ארכיטקטורה, אבטחה וסקירה.
- מדיניות לשינוי החלטות ולעבודה באמצעות Pull Requests.
- מאגר GitHub ציבורי: [itayshabtay452/one-career](https://github.com/itayshabtay452/one-career).
- תבניות Issue ו־PR, CODEOWNERS ו־Dependabot לפעולות GitHub ול־npm.
- CI עם שתי בדיקות נדרשות: `validate-governance` ו־`validate-app`.
- Ruleset שמחייב PR, שיחות סקירה פתורות ושתי הבדיקות, וחוסם מחיקה ו־force-push.
- נוהל שחזור שנבדק באמצעות clone נקי.
- שלד Next.js App Router עם TypeScript strict, מסך השקה mobile-first, תשתית locale ו־RTL, PWA עם manifest, אייקוני PNG ו־service worker, וכותרות אבטחה בסיסיות.

## מה מוכן בענף הפעיל

- מנוע קריירה דטרמיניסטי ב־`src/engine`, ללא תלות ב־React, ב־Phaser, ב־Supabase או בספק נתונים.
- RNG בשלמים בלבד עם זרמים בעלי שם, ווקטור זהב שנועל את הרצף.
- טיפוסי ליבה: `CareerSeed`, `CareerState`, `SeasonState`, `CareerDecision`, `MomentInput`, `MomentResult` ו־`LegacyInput`.
- API טהור: `createCareer`, `applyAction`, `replayCareer` ו־`computeLegacyInput`.
- פורמט שמירה שמכיל Seed ויומן פעולות בלבד, עם שער גרסה ומנגנון migration.
- עולם סינתטי של שלוש ליגות ושנים־עשר מועדונים בדויים.
- 66 בדיקות: יחידה, replay על שמונה Seeds, שתי קריירות ייחוס נעולות ובדיקת שמירה על הדטרמיניזם.
- ADR-003 שמתעד את ה־RNG, ה־Seed, מבנה המצב וה־migration.

## מה עדיין לא קיים

- מסך playable שמחובר למנוע.
- Phaser ורגעי משחק חזותיים.
- נוסחת Legacy Score ואיזון משחק.
- שמירות מתמשכות, Auth או בסיס נתונים.
- Supabase, Vercel או ספק נתוני כדורגל.
- Preview ציבורי.

## חסם נוכחי

אין חסם לפיתוח.

## החלטות שהתקבלו במסגרת המשימה

- אורך קריירה: התחלה בגיל 16 בלבד, גיל פרישה 34–37, כלומר 19–22 עונות. `docs/PRODUCT.md` עודכן והוא מקור האמת. הרקע ב־[ADR-003](decisions/ADR-003-deterministic-career-engine.md).

## המשימה הבאה

1. [Issue #5](https://github.com/itayshabtay452/one-career/issues/5) — Vertical Slice סינתטי של שלוש עונות למשפחת ההתקפה.

## Pull Requests פתוחים

- [Draft PR #10](https://github.com/itayshabtay452/one-career/pull/10) מוסיף את מנוע הקריירה הדטרמיניסטי. מסווג צהוב; סקירת Codex הושלמה וממצאיה טופלו, וממתינים סקירה חוזרת ואישור בעל הפרויקט.
- [PR #9](https://github.com/itayshabtay452/one-career/pull/9) מעדכן את `typescript` מ־6.0.3 ל־7.0.2. עדכון בגרסה ראשית, מסווג צהוב.
- [PR #8](https://github.com/itayshabtay452/one-career/pull/8) מעדכן את `actions/setup-node` מ־6 ל־7. עדכון בגרסה ראשית, מסווג צהוב.
- [PR #1](https://github.com/itayshabtay452/one-career/pull/1) מעדכן את `actions/checkout` מ־v4 ל־v7. עדכון בגרסה ראשית, מסווג צהוב.

## החלטות פתוחות

- רישיון קוד: ברירת המחדל הנוכחית היא ללא רישיון עד החלטה מפורשת.
