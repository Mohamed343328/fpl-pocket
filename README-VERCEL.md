# FPL Pocket — Vercel edition

This is the Vercel-compatible version of FPL Pocket. It contains a static PWA frontend and serverless Node.js API routes that proxy the official Fantasy Premier League API.

## Files
- `index.html`, `app.js`, `styles.css`: mobile app
- `manifest.webmanifest`, `sw.js`, `icon.svg`: installable PWA assets
- `api/bootstrap-static.js`: FPL bootstrap data
- `api/entry/[id].js`: team entry plus picks for the active/current gameweek
- `api/event/[id]/live.js`: live gameweek player statistics
- `lib/fpl.js`: shared API helper
- `vercel.json`: Vercel function configuration

## Deploy
1. Replace the old repository contents with the contents of this ZIP. Upload the *contents* of the folder to the repository root; do not upload the enclosing folder.
2. In Vercel, import the GitHub repository.
3. Framework Preset: Other.
4. Root Directory: `./`.
5. Build Command: leave empty.
6. Output Directory: leave empty (or `.` if the UI requires a value).
7. Install Command: leave empty.
8. Deploy.

The frontend polls while it is open. Browser notifications in this starter require the app to be open and permission granted; true background push notifications are not included. Live points shown are a basic starting-XI estimate and may differ from official FPL totals because automatic substitutions, bonus recalculation, and some chip rules need further refinement.

Vercel Hobby is intended for personal, non-commercial use and has usage limits. Check the current Vercel plan terms before deploying.
