# GutCheck

A small standalone web page that scans a packaged food's barcode with your
camera, looks the product up on [Open Food Facts](https://world.openfoodfacts.org),
and checks its ingredients against a low FODMAP traffic-light guide — the
same system used in the [Gutwise](https://claude.ai/artifact/1JmcoeDJR7peXYEFwYpJLR)
IBS tracker.

It's a plain static site: no build step, no backend, no API keys. Everything
runs in the browser.

## How it works

1. **Scan or type a barcode.** Camera scanning uses [ZXing](https://github.com/zxing-js/library)
   (loaded from a CDN) to read the barcode from your camera feed. If the
   camera isn't available, type the barcode's digits in by hand.
2. **Look the product up.** The barcode number is sent to Open Food Facts'
   public product API (`world.openfoodfacts.org`) — the only network call
   this page makes, and the only thing that leaves your device. No API key
   is needed; Open Food Facts allows this to be called directly from a
   browser.
3. **Check the ingredients.** The product's ingredients text is run through
   `fodmap-data.js` — the same curated FODMAP list and matching engine used
   in Gutwise — and shown as a green/amber/red traffic light.

## Files

- `index.html` — the page.
- `styles.css` — styling (matches Gutwise's look).
- `fodmap-data.js` — the FODMAP food list and the `analyze()` text-matching
  engine, copied from Gutwise so both stay consistent.
- `app.js` — camera scanning, the Open Food Facts call, and rendering.

## Running it locally

Any static file server works, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Camera access needs a secure context
(HTTPS or localhost), which this satisfies.

## Deploying on GitHub Pages

1. Push this folder's contents to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick the branch (and folder, if this isn't at the repo root), and save.
4. GitHub serves it at `https://<username>.github.io/<repo>/` a minute or
   two later, over HTTPS — which is what the camera needs.

No secrets or server-side code are involved, so Pages' static-only hosting
is enough for this app as it stands.

## Limits, honestly

- **Open Food Facts coverage varies.** It's strongest for UK/EU packaged
  foods and weaker for smaller, regional, or newly-launched products. A
  "not found" result means the product isn't catalogued yet — not that
  it's safe or unsafe.
- **This isn't the Monash University FODMAP database.** The traffic-light
  ratings come from a curated list based on published Monash research, not
  Monash's own licensed database or app. Always check the official Monash
  app or a dietitian for anything that matters clinically.
- **Ingredients aren't always in English on Open Food Facts.** When a
  product has no English ingredients text on file, GutCheck can't
  translate it and will say so rather than guess.
- **Camera scanning support varies by browser.** It works well in Chrome,
  Edge and most Android browsers. Safari/iOS support depends on the
  ZXing library rather than a native API; if it doesn't work, typing the
  barcode is always available as a fallback.
- Not medical advice.

## Ideas for later

- A PWA manifest + icons, so it can be added to a phone's home screen.
- Feeding a scanned result straight into Gutwise's food diary (they're
  separate apps today — this one doesn't store anything).
- A second product-database source as a fallback when Open Food Facts
  doesn't have a match.
