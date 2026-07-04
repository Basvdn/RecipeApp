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
npm test     # unit tests for the OCR parsing logic (src/lib/ocr/parse-recipe.test.ts)
npm run lint
```

There's no end-to-end test suite — verification is manual, per feature, on a real device where it
matters (camera capture, install-to-home-screen, clipboard).
