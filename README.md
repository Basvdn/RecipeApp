# Recipe Box

A personal recipe app: photograph pages from your cookbooks, scan them with on-device OCR,
then filter/tag your collection and build a shopping list from what you plan to cook.

## Getting started (local)

```bash
npm install
npm run setup       # vendors Tesseract.js OCR assets into public/tesseract (~26MB, offline-capable)
npm run db:migrate  # creates data/recipes.db
npm run db:seed     # seeds default meal-type / food-category tags
npm run dev
```

Open http://localhost:3000 — it redirects to the recipe library.

The **Food** tab (calorie & macro tracker) needs a Claude API key. Create `.env.local` with:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Everything else works without it.

Data lives in `data/recipes.db` (SQLite) and `data/photos/` (uploaded cookbook photos). Both are
gitignored; back them up yourself if you care about the data (e.g. copy the `data/` folder).

## Using it from your phone

This is a mobile-first PWA. To install it on your iPhone's home screen:

1. Deploy it somewhere reachable over HTTPS (e.g. Vercel — see below), or run it on your computer
   and access it from your phone over your home network with an HTTPS tunnel. Installability and
   the offline service worker both require HTTPS (`localhost` is exempt only when browsing from
   the same machine).
2. Open the URL in Safari, tap Share → "Add to Home Screen".
3. Launch it from the home screen icon — it opens standalone (no browser chrome), and the
   camera button opens your phone's camera directly.

## Scanning a recipe

"Add" → "Scan from a cookbook photo" → take/choose a photo → OCR runs in the browser (10-20s) →
review screen shows the photo next to the extracted title/ingredients/times so you can fix
anything OCR got wrong → Save. The scan is never saved automatically without this review step.

## Tracking calories and macros

The **Food** tab is a chat: type or tap the mic and say what you ate ("two scrambled eggs on
toast and a flat white", "a handful of almonds as a snack"). Claude estimates calories, protein,
carbs and fat for each food, logs them, and replies with the running total. You can correct it
the same way ("actually it was one slice", "remove the almonds"), set targets ("my goal is
2200 calories and 160 g protein"), or ask questions ("how much protein do I have left?").

- Above the chat: the day's totals against your goals, and entries grouped by meal (tap × to
  remove one). Use ‹ › to look at earlier days; anything you say while viewing a past day is
  logged to that day unless you name another one.
- Numbers are Claude's estimates from typical nutrition data, not a database lookup — for
  packaged food, saying the label values ("protein bar, 210 kcal, 20 g protein") gets exact
  numbers logged.
- Voice input uses the browser's built-in speech recognition (Safari on iOS, Chrome). The mic
  button is hidden where it isn't available.
- Code: `src/lib/nutrition/assistant.ts` (prompt, tools, tool loop),
  `src/lib/repositories/foodLog.ts` (data), `src/components/food/` (UI). It uses
  `claude-opus-5-5` at `medium` effort, with server-side refusal fallback enabled.

## Moving to the cloud later

The app is built with a couple of seams specifically so it can move off your machine without a
rewrite:

- **Database**: SQLite via Drizzle ORM now (`src/lib/db/client.ts`). Drizzle's SQLite dialect
  carries over to a hosted libSQL/Turso database later — swap the client, not the schema.
- **Photo storage**: behind `src/lib/storage/photo-storage.ts`. `local-fs-storage.ts` is the only
  implementation today; a Vercel Blob (or S3) implementation of the same interface is the intended
  swap-in when deploying, since serverless filesystems aren't writable/persistent.

## Albert Heijn shopping list

Albert Heijn has no public API, and their official one-click "add to list" widget is only
available to sites in their Allerhande partner program — not to a personal app. So today, the
`/shopping-list` page gives you a deduplicated ingredient list with a "Copy list" button to paste
into the AH app's own search. A follow-up, clearly-labeled "unofficial/best-effort" integration
using a community reverse-engineered AH API is a possible later enhancement.

## Testing

```bash
npm test     # unit tests: OCR parsing, and the food assistant's tool loop (with a scripted fake Claude)
npm run lint
```

There's no end-to-end test suite — verification is manual, per feature, on a real device where it
matters (camera capture, install-to-home-screen, clipboard).
