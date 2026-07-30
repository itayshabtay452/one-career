# מצב הפרויקט

עודכן: 30 ביולי 2026

## שלב נוכחי

שלב 1 — הקמת שלד האפליקציה והכנת ה־Vertical Slice הראשון.

שלב 0 — מערכת העבודה, מקורות האמת והגנות הפרויקט — הושלם ב־30 ביולי 2026.

## מה קיים

- תוכנית מוצר ל־V1.
- חוזה עבודה משותף לסוכנים.
- מסמכי מוצר, ארכיטקטורה, אבטחה וסקירה.
- מדיניות לשינוי החלטות ולעבודה באמצעות Pull Requests.
- מאגר GitHub ציבורי: [itayshabtay452/one-career](https://github.com/itayshabtay452/one-career).
- תבניות Issue ו־PR, CODEOWNERS ו־Dependabot.
- CI בשם `validate-governance`, שעבר על `main` ועל ה־PR הראשון.
- Ruleset פעיל על ענף ברירת המחדל:
  - כל שינוי עובר Pull Request.
  - מיזוג מותר ב־Squash בלבד.
  - שיחות סקירה חייבות להיפתר.
  - `validate-governance` חייב לעבור.
  - מחיקה ו־force-push חסומים.
- נוהל שחזור שנבדק באמצעות clone נקי.
- תור עבודה ראשוני ב־GitHub Issues.

## מה עדיין לא קיים

- שלד Next.js.
- קוד משחק.
- Supabase, Vercel וספק נתונים.

## חסם נוכחי

אין חסם שמונע התחלת פיתוח.

GitHub CLI המקומי מחובר, וכך גם Git דרך Credential Manager והחיבור של Codex ל־GitHub. פעולות שאינן נתמכות בחיבור מבוצעות בממשק GitHub המחובר.

## המשימה הפעילה

[Issue #2](https://github.com/itayshabtay452/one-career/issues/2) — תיעוד השלמת שלב 0 והכנת תור העבודה.

## שלוש המשימות הבאות

1. [Issue #3](https://github.com/itayshabtay452/one-career/issues/3) — הקמת שלד Next.js PWA.
2. [Issue #4](https://github.com/itayshabtay452/one-career/issues/4) — הגדרת מנוע קריירה דטרמיניסטי ופורמט Seed.
3. [Issue #5](https://github.com/itayshabtay452/one-career/issues/5) — Vertical Slice סינתטי של שלוש עונות למשפחת ההתקפה.

## Pull Requests פתוחים

- [PR #1](https://github.com/itayshabtay452/one-career/pull/1) מעדכן את `actions/checkout` מ־v4 ל־v7. ה־diff נבדק וה־CI עבר, אך זהו עדכון dependency בגרסה ראשית ולכן הוא מסווג צהוב וממתין לאישור מפורש של בעל הפרויקט לפני מיזוג.

## החלטות פתוחות

- רישיון קוד: ברירת המחדל הנוכחית היא ללא רישיון עד החלטה מפורשת.
