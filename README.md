# Gutwise (hosted here as "GutCheck")

The full Gutwise IBS tracker — gut health score, food diary, symptom and
medication tracking, meal builder, breathing exercises, trends, and a
doctor-ready PDF export — plus **real camera barcode scanning** against
[Open Food Facts](https://world.openfoodfacts.org), all as one static site
with no backend.

This started as a Claude-hosted Artifact. Barcode scanning needs a real
network call, which an Artifact's sandbox can't make, so the whole app now
lives here instead, where nothing is restricted. The repo is named
`GutCheck`; the app itself is still called Gutwise (the `<title>`, the PDF
header and the on-page branding all say Gutwise — the repo name is just
where it's hosted, not a second product).

A separate, earlier version of this repo held a scan-only tool of the same
name; this replaces it with everything merged into one app.

## How it works

- **Everything else** — the tracker, food diary, symptom log, meal builder,
  breathing sounds, trends and PDF export — runs exactly as it did as a
  Claude Artifact, just without that platform's restrictions (real file
  downloads, no CDN allowlist).
- **Barcode scanning** uses [ZXing](https://github.com/zxing-js/library)
  (loaded from a CDN) to read a barcode from your camera. The barcode
  number — and only the number — is sent to Open Food Facts' public
  product API to look up the product's ingredients, which are then run
  through the same FODMAP-matching engine as the rest of the app.
- **Your data** never leaves your browser except for that one barcode
  lookup call. Everything else is stored in `localStorage`.

## Files

- `index.html` — the page shell (head, nav, script tags).
- `styles.css` — all styling, one file.
- `fodmap-data.js` — the FODMAP food list and the `analyze()` text-matching
  engine.
- `state.js` — data model: local storage, scoring, triggers, weekly digest.
- `app.js` — every screen (home, log, symptoms, foods, builder, breathe,
  trends, learn), the barcode scanner, and the PDF/JSON export.

## Running it locally

```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`. Camera access needs a secure context
(HTTPS or localhost), which this satisfies.

## Deploying on GitHub Pages

1. Push this folder's contents to the repo root (already done for `main`).
2. **Settings → Pages → Build and deployment → Source**: "Deploy from a
   branch".
3. **Branch**: `main`, folder `/ (root)`. Save.
4. GitHub Pages is only available on a public repo on the free tier — if
   Pages says so, make the repo public first under **Settings → General →
   Danger Zone**.
5. Live in a minute or two at `https://<username>.github.io/<repo>/`.

## Moving your data from the Claude-hosted version

If you used the Gutwise Claude Artifact before this existed, its data is
stored in that page's own browser storage and doesn't carry over
automatically (different origin). The Artifact has an **Export as JSON**
button on its Trends tab; this app has a matching **Import JSON** button in
the same place. Export there, then import here, once.

## Limits, honestly

- **Open Food Facts coverage varies** — strongest for UK/EU packaged foods,
  weaker for smaller or newer products. "Not found" means uncatalogued, not
  "safe" or "unsafe".
- **This isn't the Monash University FODMAP database.** Ratings come from a
  curated list based on published Monash research, not Monash's own
  licensed database or app.
- **Ingredients aren't always in English** on Open Food Facts; when they're
  not, the app says so rather than guessing.
- **Camera scanning support varies by browser** — strong in Chrome, Edge and
  Android; typing the barcode always works as a fallback.
- Not medical advice.
