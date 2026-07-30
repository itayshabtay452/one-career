# מצב הפרויקט

עודכן: 30 ביולי 2026

## שלב נוכחי

שלב 1 — הקמת שלד האפליקציה והכנת ה־Vertical Slice הראשון.

שלב 0 — מערכת העבודה, מקורות האמת והגנות הפרויקט — הושלם ב־30 ביולי 2026.

## המשימה הפעילה

[Issue #3](https://github.com/itayshabtay452/one-career/issues/3) — הקמת שלד Next.js PWA.

העבודה נמצאת בענף `feat/3-nextjs-pwa`. הקוד טרם מוזג ל־`main`; לאחר פתיחת PR הוא ידרוש CI ירוק, סקירה עצמאית של Claude Desktop ואישור מפורש של בעל הפרויקט.

## מה קיים ב־main

- תוכנית מוצר ל־V1.
- חוזה עבודה משותף לסוכנים.
- מסמכי מוצר, ארכיטקטורה, אבטחה וסקירה.
- מדיניות לשינוי החלטות ולעבודה באמצעות Pull Requests.
- מאגר GitHub ציבורי: [itayshabtay452/one-career](https://github.com/itayshabtay452/one-career).
- תבניות Issue ו־PR, CODEOWNERS ו־Dependabot.
- CI בשם `validate-governance`.
- Ruleset שמחייב PR, שיחות סקירה פתורות ו־`validate-governance`, וחוסם מחיקה ו־force-push.
- נוהל שחזור שנבדק באמצעות clone נקי.

## מה מוכן בענף הפעיל

- Next.js App Router עם TypeScript strict.
- מסך השקה אנגלי, mobile-first ורספונסיבי.
- תשתית locale וכיווניות שמוכנה לעברית ול־RTL.
- PWA manifest, אייקון ו־service worker מוגבל למעטפת הציבורית ולנכסים סטטיים.
- כותרות אבטחה בסיסיות.
- lint, typecheck, בדיקות יחידה, build, audit ובדיקת smoke במובייל.
- הרחבת CI לבדיקת האפליקציה.

## מה עדיין לא קיים

- מנוע משחק או קריירה.
- מסך playable.
- שמירות, Auth או בסיס נתונים.
- Supabase, Vercel או ספק נתוני כדורגל.
- Preview ציבורי.

## חסם נוכחי

אין חסם לפיתוח. Git דרך Credential Manager והחיבורים של Codex ושל Claude Desktop ל־GitHub פעילים. GitHub CLI המקומי אינו נדרש לזרימה הזו.

## המשימות הבאות

1. [Issue #4](https://github.com/itayshabtay452/one-career/issues/4) — הגדרת מנוע קריירה דטרמיניסטי ופורמט Seed.
2. [Issue #5](https://github.com/itayshabtay452/one-career/issues/5) — Vertical Slice סינתטי של שלוש עונות למשפחת ההתקפה.

## Pull Requests פתוחים

- [PR #1](https://github.com/itayshabtay452/one-career/pull/1) מעדכן את `actions/checkout` מ־v4 ל־v7. זהו שינוי dependency בגרסה ראשית, ולכן הוא מסווג צהוב וממתין לאישור מפורש של בעל הפרויקט לפני מיזוג.

## החלטות פתוחות

- רישיון קוד: ברירת המחדל הנוכחית היא ללא רישיון עד החלטה מפורשת.
