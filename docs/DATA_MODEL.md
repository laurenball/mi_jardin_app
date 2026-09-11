# Plant Data Model

Version 1 plant record:

```js
{
  id: string,
  commonName: string,
  scientificName: string,
  description: string,
  notes: string,
  sun: string,
  nativeStatus: string,
  wildlifeValue: string,
  status: string,
  photo: Blob | null,
  createdAt: string,
  updatedAt: string,
  schemaVersion: 1
}
```

## Rule

Once a field has been used in saved data, do not remove or rename it without a migration plan.
