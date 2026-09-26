const DB_NAME = 'santuario-de-aves';
const LEGACY_DB_NAME = ['my', 'garden'].join('-');
const DB_VERSION = 1;
const PLANT_STORE = 'plants';
let databasePromise;

function openRawDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PLANT_STORE)) {
        const store = db.createObjectStore(PLANT_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function countPlants(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readonly');
    const request = tx.objectStore(PLANT_STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readPlants(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readonly');
    const request = tx.objectStore(PLANT_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function writePlants(db, plants) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readwrite');
    const store = tx.objectStore(PLANT_STORE);
    plants.forEach((plant) => store.put(plant));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function migrateLegacyDatabase(db) {
  if (await countPlants(db) > 0) return;
  const legacyDb = await openRawDatabase(LEGACY_DB_NAME);
  try {
    const legacyPlants = await readPlants(legacyDb);
    if (legacyPlants.length > 0) await writePlants(db, legacyPlants);
  } finally {
    legacyDb.close();
  }
}

async function openDatabase() {
  if (!databasePromise) {
    databasePromise = openRawDatabase(DB_NAME).then(async (db) => {
      await migrateLegacyDatabase(db);
      return db;
    });
  }
  return databasePromise;
}

export async function addPlant(plant) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readwrite');
    tx.objectStore(PLANT_STORE).add(plant);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function addPlants(plants) {
  const db = await openDatabase();
  return writePlants(db, plants);
}

export async function updatePlant(plant) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readwrite');
    tx.objectStore(PLANT_STORE).put(plant);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getPlants() {
  const db = await openDatabase();
  const result = await readPlants(db);
  return result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
