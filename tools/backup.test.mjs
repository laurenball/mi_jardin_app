import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup, readBackup} from '../backup-data.js';

const plant = {
  id: 'personal-plant', commonName: 'Mi planta', scientificName: 'Example species',
  nursery: 'Vivero', price: '1500', notes: 'Notas personales', gardenLocation: 'Patio',
  photosEdited: true, mapPins: [{id: 'pin-1', number: 3, x: 35, y: 71}],
  photo: './assets/plants/tala-1.jpg', photos: ['./assets/plants/tala-1.jpg']
};

test('JSON round trip preserves personal fields, IDs, map pins and house position', async () => {
  const backup = await createBackup([plant], {x: 22, y: 15});
  assert.equal(backup.app, 'sanctuario');
  assert.equal(backup.formatVersion, 1);
  const result = readBackup(JSON.stringify(backup));
  assert.deepEqual(result.plants, [plant]);
  assert.deepEqual(result.housePosition, {x: 22, y: 15});
});

test('personal photo bytes survive JSON serialization alongside bundled photos', async () => {
  const bytes = Uint8Array.from({length: 100000}, (_, index) => index % 256);
  const photo = new Blob([bytes], {type: 'image/jpeg'});
  const source = {...plant, photo, photos: [plant.photo, photo]};
  const backup = await createBackup([source], null);
  const {plants, housePosition} = readBackup(JSON.stringify(backup));
  assert.equal(housePosition, null);
  assert.equal(plants[0].photo.type, 'image/jpeg');
  assert.deepEqual(new Uint8Array(await plants[0].photo.arrayBuffer()), bytes);
  assert.deepEqual(new Uint8Array(await plants[0].photos[1].arrayBuffer()), bytes);
  assert.equal(plants[0].photos[0], plant.photo);
});

test('File photos retain their name and modification time', async () => {
  if (typeof File === 'undefined') return;
  const photo = new File(['personal image'], 'jardin.jpg', {type: 'image/jpeg', lastModified: 123456});
  const backup = await createBackup([{...plant, photo, photos: [photo]}], null);
  const result = readBackup(JSON.stringify(backup));
  assert.equal(result.plants[0].photo.name, photo.name);
  assert.equal(result.plants[0].photo.lastModified, photo.lastModified);
  assert.equal(await result.plants[0].photo.text(), 'personal image');
});

test('legacy single-photo records remain usable after restore', async () => {
  const source = {...plant};
  delete source.photos;
  const backup = await createBackup([source], null);
  const result = readBackup(JSON.stringify(backup));
  assert.equal(result.plants[0].photo, plant.photo);
  assert.deepEqual(result.plants[0].photos, [plant.photo]);
});

test('empty collection and records without photos can be backed up', async () => {
  assert.deepEqual(readBackup(JSON.stringify(await createBackup([], null))), {plants: [], housePosition: null});
  const source = {...plant, photo: null, photos: []};
  assert.deepEqual(readBackup(JSON.stringify(await createBackup([source], null))).plants, [source]);
});

test('rejects malformed JSON and foreign or future formats', () => {
  assert.throws(() => readBackup('{'));
  for (const value of [null, {}, {app: 'another-app', formatVersion: 1, plants: []},
    {app: 'sanctuario', formatVersion: 2, plants: []}]) {
    assert.throws(() => readBackup(JSON.stringify(value)));
  }
});

test('validates the entire file, including duplicate IDs and corrupt photo bytes', async () => {
  const backup = await createBackup([plant], null);
  for (const value of [
    {...backup, plants: [...backup.plants, ...backup.plants]},
    {...backup, plants: [{...backup.plants[0], id: ''}]},
    {...backup, plants: [{...backup.plants[0], photos: [{kind: 'blob', type: 'image/jpeg', base64: '@@@'}]}]},
    {...backup, plants: [{...backup.plants[0], photo: {kind: 'url', value: 'blob:temporary'}}]},
    {...backup, housePosition: {x: 101, y: 5}}
  ]) {
    assert.throws(() => readBackup(JSON.stringify(value)));
  }
});
