# My Garden / Mi Jardín

A private, local-first native-garden field guide and planning app.

## Current version

The app now stores plants as more than a wishlist. Each record can include:

- Identity / Identidad
- Native ecology / Ecología nativa
- Wildlife value / Valor para la fauna
- Growing information / Cultivo
- Human uses / Usos humanos
- My garden / Mi jardín

It includes starter entries for the plants we identified for the Buenos Aires-area garden, plus filters by garden layer, purpose, and status. The plant list has names-only, photo, and card browsing modes for quick mobile scanning; tapping any plant opens more information, then full detail.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Important data behavior

Plant data is stored in IndexedDB on the device/browser where it is entered. Starter plants are added only when the database is completely empty, so restarting the app will not duplicate them.

Existing Version 1 plant records remain compatible.

New records can store multiple photos in `photos`; the first image is also saved as `photo` so older single-photo records and code paths remain compatible. Photos can also be added later from a plant detail view.

## Language approach

English and Spanish are shown together where useful. Scientific names remain single. Longer notes can be in either language.

## Project structure

```text
my-garden-app/
├── index.html
├── styles.css
├── app.js
├── db.js
├── starter-plants.js
├── manifest.webmanifest
├── service-worker.js
├── assets/
└── docs/
```
