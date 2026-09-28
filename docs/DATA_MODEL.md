# Plant Data Model

## Where starter content lives

Starter plant content is authored in `content/plants/*.json` and compiled into `starter-plants.js` by `tools/build.mjs`. The content files are the source of truth. Each photo entry there carries its own credit:

```js
{
  file, shows, sourceFile, sourcePage, author, license, licenseUrl
}
```

Only `file` reaches the app. The rest is used to generate `docs/PHOTO_SOURCES.md`.

Fields that are empty are omitted from the compiled module rather than written as empty strings. The startup sync treats a missing field as empty, so the two are equivalent for stored records.

## Version 4

Version 4 adds one optional field without changing the IndexedDB store.

```js
{
  sources,
  photosEdited
}
```

`photosEdited` is set the first time the user reorders or deletes a photo on a record. From then on the app stops managing that record's bundled photos, so a deleted starter photo does not come back on the next startup. Adding a photo does not set it, because appended photos survive the sync anyway.

`sources` records where the information in an entry came from. It is free text, and several references can be separated with ` | `. The detail view renders it as a Sources section and turns any `http` or `https` address into a link.

Starter records now also carry their descriptive content in the app rather than only in a first seeding. On startup the app refreshes the informational fields of records that match a starter plant, so an existing install receives corrected or expanded text:

```text
plantType, layer, description, nativeStatus, nativeRange, ecology, hostPlant, purposes, wildlifeNotes,
sun, water, soil, size, flowering, fruiting, propagation,
edibleUses, medicinalUses, otherUses, safety, sources
```

The starter record is the source of truth for the informational fields, classification (`plantType` and `layer`), and for the current Sanctuario labels: `status`, `priority`, and `notes`. That lets the app re-sort the Sanctuario as the real planting plan changes. Operational fields such as `nursery`, `price`, and `gardenLocation` are left alone, as are photos the user added. If a starter-managed field is no longer set in the source content, it is cleared rather than left holding old text.

On startup the app also seeds any starter plant the device has never held, matched by common or scientific name, so plants added to the guide reach existing installs rather than new ones only. A plant the user created themselves is never touched by either step.

Both steps exist because a device seeds plants only once. Without them, new plants and corrected content would reach new installs only.

## Version 3

Version 3 adds multi-photo support without changing the IndexedDB store.

```js
{
  photos: [],
  photo
}
```

`photos` is the preferred gallery field. `photo` is still kept as the primary image for compatibility with older records and older app code.

Photos can be appended to an existing plant from the plant detail view. The app preserves the existing primary `photo` when adding more images.

Starter records include bundled local image paths, up to three per plant. On startup the app re-syncs those paths onto matching IndexedDB records so an older install picks up added or renamed bundled images. A record's bundled paths are replaced with the current set; photos the user added themselves are never removed and keep their place after the bundled ones. The primary `photo` field is repointed only when it still holds a bundled path.

## Version 2

Plant records now separate identity, native ecology, wildlife, growing information, human uses, and personal garden information.

Important fields:

```js
{
  id,
  commonName,
  scientificName,
  plantType,
  layer,
  description,
  nativeStatus,
  nativeRange,
  ecology,
  hostPlant,
  purposes: [],
  wildlifeNotes,
  sun,
  water,
  soil,
  size,
  flowering,
  fruiting,
  propagation,
  edibleUses,
  medicinalUses,
  otherUses,
  safety,
  status,
  priority,
  nursery,
  price,
  gardenLocation,
  notes,
  photos,
  photo,
  createdAt,
  updatedAt,
  schemaVersion: 3
}
```

## Compatibility

Version 1 and Version 2 records remain readable. Old fields are not removed or renamed. New fields are optional, so existing saved plants continue to render.

## Design rules

- `layer` is a view/filter dimension, not a folder.
- `purposes` is multi-valued so a plant can be useful for birds, pollinators, food, shelter, etc. simultaneously.
- Traditional medicinal use is stored separately from edible use and from safety notes.
- Sources are not displayed in the personal app after information is verified.
