# My Garden App

A tiny private, local-first garden app for keeping track of plants I want, plants I have, and eventually birds, propagation notes, and garden ideas.

## Why this starts simple

The first version is intentionally small. It should be easy to understand, easy to change, and useful on a phone before we add more features.

## Version 0.1

- Add plants
- Attach a photo
- Common name
- Scientific name
- Description
- Notes
- Sun preference
- Native status
- Wildlife value
- Status: Want / Looking For / Bought / Planted
- Search plants
- Store data locally in the browser using IndexedDB
- Basic offline support
- Installable as a PWA on supported phones

## Run it locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

On another device on the same Wi-Fi network, use your computer's local network IP instead of `localhost`.

## Project structure

```text
my-garden-app/
├── index.html
├── styles.css
├── app.js
├── db.js
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   └── icon.svg
├── docs/
│   ├── PROCESS.md
│   ├── ROADMAP.md
│   └── DATA_MODEL.md
└── README.md
```

## Important limitation in this first version

The data lives in the browser on the device where you enter it. That is excellent for privacy and simplicity, but it is not yet synchronized between your computer and phone and is not yet automatically backed up.

Backup/export is therefore an early roadmap item.
