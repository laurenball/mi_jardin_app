export const HOUSE_POSITION_KEY = 'sanctuario-map-house-position';

async function encodePhoto(photo) {
  if (photo == null) return null;
  if (typeof photo === 'string') return {kind: 'url', value: photo};
  if (!(photo instanceof Blob)) throw new Error('Formato de foto desconocido.');
  const bytes = new Uint8Array(await photo.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  }
  return {
    kind: 'blob', type: photo.type, base64: btoa(binary),
    ...(typeof photo.name === 'string' ? {name: photo.name, lastModified: photo.lastModified} : {})
  };
}

function decodePhoto(photo) {
  if (photo == null) return null;
  if (photo.kind === 'url' && typeof photo.value === 'string'
    && /^(?:\.\/)?assets\/plants\/[^\s]+$|^https?:\/\/|^data:image\//i.test(photo.value)) return photo.value;
  if (photo.kind !== 'blob' || typeof photo.type !== 'string' || typeof photo.base64 !== 'string') {
    throw new Error('El respaldo contiene una foto inválida.');
  }
  const binary = atob(photo.base64);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  if (typeof File !== 'undefined' && typeof photo.name === 'string') {
    return new File([bytes], photo.name, {type: photo.type, lastModified: photo.lastModified});
  }
  return new Blob([bytes], {type: photo.type});
}

function validateHousePosition(position) {
  if (position == null) return null;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)
    || position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100) {
    throw new Error('La posición de la casa no es válida.');
  }
  return {x: position.x, y: position.y};
}

export async function createBackup(plants, housePosition) {
  return {
    app: 'sanctuario', formatVersion: 1, exportedAt: new Date().toISOString(),
    housePosition: validateHousePosition(housePosition),
    plants: await Promise.all(plants.map(async plant => ({
      ...plant,
      photo: await encodePhoto(plant.photo),
      photos: await Promise.all((plant.photos || (plant.photo ? [plant.photo] : [])).map(encodePhoto))
    })))
  };
}

export function readBackup(text) {
  const backup = JSON.parse(text);
  if (backup?.app !== 'sanctuario' || backup.formatVersion !== 1 || !Array.isArray(backup.plants)) {
    throw new Error('Elegí un respaldo de Sanctuario compatible.');
  }
  const ids = new Set();
  const housePosition = validateHousePosition(backup.housePosition);
  const plants = backup.plants.map(plant => {
    if (!plant || typeof plant.id !== 'string' || !plant.id.trim() || ids.has(plant.id)
      || typeof plant.commonName !== 'string' || !plant.commonName.trim()
      || !Array.isArray(plant.photos)) {
      throw new Error('El respaldo contiene una planta inválida o repetida.');
    }
    ids.add(plant.id);
    return {...plant, photo: decodePhoto(plant.photo), photos: plant.photos.map(decodePhoto)};
  });
  return {plants, housePosition};
}
