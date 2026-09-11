# Plant Data Model

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
