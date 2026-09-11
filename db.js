const DB_NAME = 'my-garden';
const DB_VERSION = 1;
const PLANT_STORE = 'plants';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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

export async function getPlants() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLANT_STORE, 'readonly');
    const request = tx.objectStore(PLANT_STORE).getAll();
    request.onsuccess = () => {
      const plants = request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      resolve(plants);
    };
    request.onerror = () => reject(request.error);
  });
}
