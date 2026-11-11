# המירוץ לסוף השנה

אתר סטטי + פונקציה אחת. המשתמשים בוחרים מכירות / חידושים / דירות, והאדמין מעלה אקסל שמעדכן את כולם.

## העלאה ל-Vercel

1. `vercel` (או Import של הריפו בדשבורד). אין build, Framework Preset: Other.
2. Storage → Create → Blob → **Private** → Connect לפרויקט.
3. Settings → Environment Variables → `ADMIN_PASSWORD` = הסיסמה של האדמין.
4. Redeploy (`vercel --prod`).

## שימוש

- `/` בחירת מירוץ, `/sales`, `/renewals`, `/apartments` התצוגות.
- `/admin` סיסמה → בוחרים מירוץ → גוררים אקסל → "לעדכן את הדף".
- עד ההעלאה הראשונה כל דף מציג את הנתונים שהיו בקובץ המקורי (10.11.2026).

## מבנה

- `public/` הדפים. היעדים והתאריכים של המבצע נמצאים ב-`CONFIG` בראש הסקריפט של כל דף.
- `api/data.js` GET מחזיר את הנתונים השמורים, POST (עם סיסמה) שומר אותם ב-Vercel Blob.
- שיוך הנציגים לצוותים בחידושים נלקח מרשימת `DATA` שבתוך `public/renewals.html`.
