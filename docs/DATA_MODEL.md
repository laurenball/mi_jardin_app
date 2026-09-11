# Plant Data Model

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
  photo,
  createdAt,
  updatedAt,
  schemaVersion: 2
}
```

## Compatibility

Version 1 records remain readable. Old fields are not removed or renamed. New fields are optional, so existing saved plants continue to render.

## Design rules

- `layer` is a view/filter dimension, not a folder.
- `purposes` is multi-valued so a plant can be useful for birds, pollinators, food, shelter, etc. simultaneously.
- Traditional medicinal use is stored separately from edible use and from safety notes.
- Sources are not displayed in the personal app after information is verified.
