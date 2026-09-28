# Sanctuario de Aves / Bird Sanctuary

A private, local-first native-garden field guide and sanctuary care app.

## Current version

The app now stores plants as more than a wishlist. Each record can include:

- Identidad / Identity
- Ecología nativa / Native ecology
- Valor para la fauna / Wildlife value
- Cuidados / Care
- Usos humanos / Human uses
- Sanctuario de Aves / Bird sanctuary

It includes starter entries for the plants we identified for the Buenos Aires-area garden, plus search, a status filter for all plants, plants we have, active wants, and other reference plants, and a light filter for sun and shade. The primary screen groups plants by garden layer. Have, Want, and Other are filter choices, so someday plants can live in the guide without crowding the next-to-source list. Tap a plant to expand it into a card, then open all information from that card. Both the card and the full view show every photo as a swipeable gallery. Photos can be added, reordered and deleted from the full view; once a record's photos are reordered or one is deleted, the app stops re-syncing its bundled photos.

The Aves page lists twenty visitors, grouped by their main food type. Within each group, birds follow the initial visit order provided for the garden. Each compact card has a local Cornell Macaulay Library photo; one disclosure opens its food and identification notes and links to its eBird/Merlin species page and exact photo record. Bird entries live in `birds.js`; photos live in `assets/birds/` and are cached for offline use.

Garden layer groups appear smallest first: Cubresuelo / Groundcover, Herbácea / Herbaceous, Gramínea / Grass, Arbusto / Shrub, Trepadora / Climber, Frutal / Fruit tree, Dosel / Canopy. Cubresuelo groups low plants that spread across the soil; Herbácea holds upright or clumping herbs. Frutal groups plants with worthwhile human fruit or food use (three or more stars in the planning table), including a few shrubs. The 5 m planning limit separates fruit plants that naturally stay within it, plants easily kept within it, plants needing regular pruning, and plants that need space. Dosel is divided into low, medium, and large trees by their mature height and spread. Frutal and Dosel entries show approximate unpruned height separately from a maintained range where one is sensible; new or unclassified entries appear in a separate group. These are planning categories, not promises of a fixed height: site conditions, cultivar, and pruning can change the outcome. Within each group, active wants appear first, followed by plants we have and then other plants.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing the content

Plant content lives in `content/plants/`, one JSON file per plant, with `content/order.json` holding the order they are written out in. Photos live in `assets/plants/`, and each photo's credit is recorded alongside it in its plant file.

To edit it with a UI:

```bash
npm run admin
```

That opens a local editor at `http://localhost:4173`. It lists every plant, gives you a form for all the fields, and lets you add, reorder, delete and re-credit photos. Dropping in a photo resizes it in the browser to fit 860 by 1150 and compresses it to roughly 140 KB before it is written, so the offline cache stays small. Saving writes the content files and rebuilds the generated ones straight away. The server binds to localhost only.

To rebuild without the UI, after editing the JSON by hand:

```bash
npm run build
```

To see the state of the content, including plants short on photos, photos with no credit, files nothing references, and total photo weight:

```bash
npm run check
```

Three files are generated from `content/` and should not be edited directly:

- `starter-plants.js`
- `docs/PHOTO_SOURCES.md`
- the `PLANT_IMAGES` list in `service-worker.js`; the app URL and cache version advance whenever plant content changes

Both commands need Node. Nothing is installed: there are no dependencies.

Changes reach the app the same way any code change does. Commit, push, and the deployed site picks them up. On each device the startup sync then refreshes the stored records and seeds any plant that device has never held.

## Important data behavior

Plant data is stored in IndexedDB on the device/browser where it is entered. Starter plants are added only when the database is completely empty, so restarting the app will not duplicate them.

Existing Version 1 plant records remain compatible.

New records can store multiple photos in `photos`; the first image is also saved as `photo` so older single-photo records and code paths remain compatible. Photos can also be added later from a plant detail view.

Starter plant photos are bundled in `assets/plants/` and credited in `docs/PHOTO_SOURCES.md`. Each starter plant carries photos chosen to show the best identifying features first. Photos are cached as they are viewed for offline use. On startup the app re-syncs bundled photos and the written content of starter records, so an older install picks up added images, expanded text, and the current Sanctuario labels for status, priority, and notes. Photos the user took themselves are kept and stay after the bundled ones, and fields such as nursery, price, and garden location are never overwritten.

Each entry can also record where its information came from. The Sources field takes free text, separates several references with ` | `, and renders web addresses as links in the detail view.

## Language approach

Spanish appears first in app-facing text, with English shown after it where useful. Scientific names remain single. Longer notes can be in either language.

## Project structure

```text
Sanctuario/
├── index.html
├── birds.html
├── birds.js
├── styles.css
├── app.js
├── db.js
├── starter-plants.js      generated from content/
├── manifest.webmanifest
├── service-worker.js
├── package.json
├── content/               the plant content, edited by you
│   ├── order.json
│   └── plants/*.json
├── tools/
│   ├── build.mjs          regenerates the generated files
│   ├── check.mjs          reports on the state of the content
│   └── admin/             the local content editor
├── assets/
└── docs/
```
