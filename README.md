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

## Optional: accounts and cross-device sync (Firebase)

By default there's no sign-in and no backend — every install of this file
just works, storing everything in that browser's `localStorage`, as
described above. If you'd rather have a real sign-in page and have your
data follow you across devices, this app also supports Firebase
Authentication + Firestore, off by default until you configure it.

**1. Create a Firebase project.** Go to
[console.firebase.google.com](https://console.firebase.google.com), create
a project (the free "Spark" plan is enough for personal use).

**2. Turn on sign-in.** In the console: **Build → Authentication → Get
started → Sign-in method**. Enable **Email/Password**, and optionally
**Google**.

**3. Turn on the database.** **Build → Firestore Database → Create
database**. Any region is fine; start in production mode.

**4. Set the security rules.** In Firestore, go to the **Rules** tab and
replace the contents with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
This is what actually protects your data — it means only a signed-in
user can read or write their own document, nobody else's.

**5. Get your config.** **Project settings** (the gear icon) → **General**
→ scroll to **Your apps** → add a **web app** (the `</>` icon) → copy the
`firebaseConfig` object it gives you.

**6. Paste it in.** Open `firebase-config.js` in this repo and replace the
placeholder values with the ones you just copied, then commit and push.
These values aren't secret — they're meant to be public in client code;
the security rules above are what actually protect your data.

That's it — reload the page and you'll see a sign-in screen. Once signed
in, `S` (the app's whole data object) is mirrored to a Firestore document
at `users/{your-uid}`, debounced by about a second after each change, and
pulled back down the next time you sign in on any device. Meal **photos
are not synced** (Firestore caps a document at 1&nbsp;MB, and photos alone
can exceed that) — they stay local to whichever device took them.

To turn the sign-in gate back off, put the placeholder values back in
`firebase-config.js`.

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
