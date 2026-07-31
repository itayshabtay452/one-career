# מצב הפרויקט

עודכן: 31 ביולי 2026

## שלב נוכחי

שלב 1 — הקמת שלד האפליקציה וה־Vertical Slice הראשון.

שלב 0 — מערכת העבודה, מקורות האמת והגנות הפרויקט — הושלם ב־30 ביולי 2026.

## המשימה הפעילה

[Issue #5](https://github.com/itayshabtay452/one-career/issues/5) — Vertical Slice סינתטי של שלוש עונות למשפחת ההתקפה.

העבודה נמצאת ב־[Draft PR #12](https://github.com/itayshabtay452/one-career/pull/12) על הענף `feat/5-vertical-slice`. הסוכן הכותב הוא Claude Code; נדרשות סקירה עצמאית של Codex ואישור מפורש של בעל הפרויקט לפני מיזוג, כי המשימה מסווגת צהוב.

## מה קיים ב־main

- תוכנית מוצר ל־V1, חוזה עבודה לסוכנים ומסמכי מוצר, ארכיטקטורה, אבטחה וסקירה.
- מדיניות לשינוי החלטות ולעבודה באמצעות Pull Requests.
- מאגר GitHub ציבורי: [itayshabtay452/one-career](https://github.com/itayshabtay452/one-career).
- תבניות Issue ו־PR, CODEOWNERS ו־Dependabot לפעולות GitHub ול־npm.
- CI עם שתי בדיקות נדרשות: `validate-governance` ו־`validate-app`.
- Ruleset שמחייב PR, שיחות סקירה פתורות ושתי הבדיקות, וחוסם מחיקה ו־force-push.
- נוהל שחזור שנבדק באמצעות clone נקי.
- שלד Next.js App Router עם TypeScript strict, מסך השקה mobile-first, תשתית locale ו־RTL, PWA עם manifest, אייקוני PNG ו־service worker, וכותרות אבטחה בסיסיות.
- מנוע קריירה דטרמיניסטי ב־`src/engine` עם RNG בשלמים, זרמים בעלי שם, פורמט Seed ושמירה, ו־ADR-003.

## מה מוכן בענף הפעיל

- מסלול `/play` שאפשר לשחק בו: יצירת שחקן, שלוש עונות ומסך סיום.
- בכל עונה: החלטת קריירה, רגע `Read → Choose → Execute` וסיכום שמסביר מה השתנה ולמה.
- קלט רגע בדיד ונגיש: כיוון כ־`radiogroup`, עוצמה כ־slider ותזמון שמכומת מסמן נע.
- מסך סיום עם Legacy זמני, תואר וציר זמן של שלוש העונות, והסבר איך בחירה מוקדמת התגלגלה.
- שמירה מקומית ב־`localStorage` בפורמט של ADR-003; טעינה מחדש משחזרת את אותה ריצה.
- בדיקות יחידה לשכבת הפרוסה בנוסף לאלה של המנוע, ובדיקות E2E שמכסות מסלול מלא, שחזור, מקלדת ורוחב 320 פיקסלים.
- ADR-004 שמתעד את גבולות הפרוסה.

## מה עדיין לא קיים

- קריירה מלאה של 19–22 עונות במסך.
- משפחות קישור והגנה.
- Phaser ואנימציית רגעים.
- נוסחת Legacy Score סופית ואיזון משחק.
- Auth, בסיס נתונים, Supabase, Vercel או ספק נתוני כדורגל.
- Daily מדורג, Leaderboards וקבוצות חברים.
- מנגנון החלפת שפה למשתמש, למרות שהמילון העברי מלא.
- Preview ציבורי.

## חסם נוכחי

אין חסם לפיתוח.

## החלטות שהתקבלו בשלב 1

- אורך קריירה: התחלה בגיל 16 בלבד, גיל פרישה 34–37, כלומר 19–22 עונות. `docs/PRODUCT.md` הוא מקור האמת. הרקע ב־[ADR-003](decisions/ADR-003-deterministic-career-engine.md).
- מגבלת שלוש העונות של הפרוסה היא מגבלת תצוגה ואינה כלל משחק, ו־Phaser נדחה לשלב מאוחר יותר. הרקע ב־[ADR-004](decisions/ADR-004-vertical-slice-shell.md).

## המשימות הבאות

אין Issue פתוח נוסף מעבר ל־#5. לאחר מיזוג הפרוסה יש לפתוח את אבני הדרך של השלב הבא.

## Pull Requests פתוחים

- [Draft PR #12](https://github.com/itayshabtay452/one-career/pull/12) מוסיף את פרוסת שלוש העונות. מסווג צהוב; ממתין לסקירת Codex ולאישור בעל הפרויקט.
- [PR #9](https://github.com/itayshabtay452/one-career/pull/9) מעדכן את `typescript` מ־6.0.3 ל־7.0.2. עדכון בגרסה ראשית, מסווג צהוב.
- [PR #8](https://github.com/itayshabtay452/one-career/pull/8) מעדכן את `actions/setup-node` מ־6 ל־7. עדכון בגרסה ראשית, מסווג צהוב.
- [PR #1](https://github.com/itayshabtay452/one-career/pull/1) מעדכן את `actions/checkout` מ־v4 ל־v7. עדכון בגרסה ראשית, מסווג צהוב.

## החלטות פתוחות

- רישיון קוד: ברירת המחדל הנוכחית היא ללא רישיון עד החלטה מפורשת.
