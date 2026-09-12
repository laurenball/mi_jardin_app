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

It includes starter entries for the plants we identified for the Buenos Aires-area garden, plus filters by garden layer, purpose, and status. The plant list uses a photo-first mobile flow: tap a plant to expand it into a card, then open all information from that card.

The list is grouped by garden layer, using the same bilingual labels as the layer filter: Canopy / Dosel, Climber / Trepadora, Fruit tree / Frutal, Grass / Gramínea, Herbaceous / Herbácea, Shrub / Arbusto. Group headings are alphabetical and plants are alphabetical by common name within each group, compared with Spanish collation so accented names sort correctly. Plants with no layer set appear in a final Other / Otras group.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Important data behavior

Plant data is stored in IndexedDB on the device/browser where it is entered. Starter plants are added only when the database is completely empty, so restarting the app will not duplicate them.

Existing Version 1 plant records remain compatible.

New records can store multiple photos in `photos`; the first image is also saved as `photo` so older single-photo records and code paths remain compatible. Photos can also be added later from a plant detail view.

Starter plant photos are bundled in `assets/plants/` and credited in `docs/PHOTO_SOURCES.md`. Each starter plant carries three photos chosen to show the whole plant, its leaves, and its flowers or fruit. On startup the app re-syncs bundled photos and the written content of starter records, so an older install picks up added images and expanded text. Photos the user took themselves are kept and stay after the bundled ones, and personal fields such as status, notes, nursery and price are never overwritten.

Each entry can also record where its information came from. The Sources field takes free text, separates several references with ` | `, and renders web addresses as links in the detail view.

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
