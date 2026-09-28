import { addPlant, addPlants, deletePlants, getPlants, updatePlant } from './db.js';
import { STARTER_PLANTS } from './starter-plants.js?v=54';

const dialog = document.querySelector('#plant-dialog');
const browseDialog = document.querySelector('#browse-dialog');
const browseDetail = document.querySelector('#browse-detail');
const browsePhotoInput = document.querySelector('#browse-photo-input');
const form = document.querySelector('#plant-form');
const grid = document.querySelector('#plant-grid');
const emptyState = document.querySelector('#empty-state');
const noResults = document.querySelector('#no-results');
const searchInput = document.querySelector('#search');
const statusFilter = document.querySelector('#status-filter');
const sunFilter = document.querySelector('#sun-filter');
const updateNotice = document.querySelector('#update-notice');
const updateButton = document.querySelector('#update-app');
let plants = [];
let objectUrls = [];
let browseObjectUrls = [];
let expandedPlantId = null;
let activePlantId = null;
let updateWorker = null;
let updateReady = false;
let reloadForUpdate = false;
let reloading = false;

const DISPLAY_LABELS = {
  status: {'Want':'Quiero','Looking For':'Buscando','Bought':'Comprada','Planted':'Plantada','Other':'Otro'},
  sun: {'Full sun':'Pleno sol','Sun / partial shade':'Sol y media sombra','Partial shade':'Media sombra','Shade':'Sombra'},
  layer: {'Canopy':'Dosel','Fruit tree':'Frutal','Shrub':'Arbusto','Herbaceous':'Herbácea','Groundcover':'Cubresuelo','Grass':'Gramínea','Climber':'Trepadora'},
  purpose: {'Bird food':'Alimento para aves','Shelter':'Refugio','Nesting':'Nidificación','Hummingbirds':'Picaflores','Butterflies':'Mariposas','Pollinators':'Polinizadores','Edible':'Comestible','Medicinal tradition':'Uso medicinal'},
  priority: {'High':'Alta','Medium':'Media','Low':'Baja'},
  plantType: {'Tree':'Árbol','Palm':'Palmera','Shrub':'Arbusto','Herb':'Herbácea','Grass':'Gramínea','Climber':'Trepadora'},
  fruitSizeGroup: {'Naturally small':'Hasta 5 m por naturaleza','Easy to keep small':'Hasta 5 m con recortes leves','Needs regular pruning':'Hasta 5 m con poda regular','Needs space':'Necesitan espacio'},
  canopySizeGroup: {'Small':'Árboles bajos','Medium':'Árboles medianos','Large':'Árboles grandes'}
};

const SCHEMA_VERSION = 4;
const STARTER_INFO_FIELDS = ['plantType','layer','description','nativeStatus','nativeRange','ecology','hostPlant','purposes','wildlifeNotes',
  'sun','water','soil','size','fruitSizeGroup','canopySizeGroup','sizeManagement','flowering','fruiting','propagation','edibleUses','medicinalUses','otherUses','safety','sources',
  'status','priority','notes'];
const UNGROUPED_LABEL = 'Otras';
const LAYER_ORDER = ['Groundcover', 'Herbaceous', 'Grass', 'Shrub', 'Climber', 'Fruit tree', 'Canopy'];
const FRUIT_SIZE_ORDER = ['Naturally small', 'Easy to keep small', 'Needs regular pruning', 'Needs space'];
const FRUIT_SIZE_DESCRIPTIONS = {
  'Naturally small': 'Su altura natural suele quedar dentro de los 5 m sin poda de contención.',
  'Easy to keep small': 'Pueden superar 5 m sin poda, pero toleran recortes moderados para mantenerse cerca de ese límite.',
  'Needs regular pruning': 'Pueden superar 5 m sin poda; requieren formación y recortes regulares para mantenerse cerca de ese límite.',
  'Needs space': 'No contar con mantenerlos hasta 5 m; planificar su tamaño adulto.'
};
const CANOPY_SIZE_ORDER = ['Small', 'Medium', 'Large'];
const CANOPY_SIZE_DESCRIPTIONS = {
  Small: 'Altura adulta aproximada de 2–7 m; mirar también el ancho.',
  Medium: 'Pueden llegar a unos 10–15 m; reservar lugar para la copa.',
  Large: 'Árboles altos o muy anchos; no se mantienen chicos con poda sencilla.'
};
const nameCollator = new Intl.Collator(['es', 'en'], {sensitivity: 'base', numeric: true});

function displayValue(group, value) { return DISPLAY_LABELS[group]?.[value] || value || ''; }
function canonicalSun(value) {
  return ({'Pleno sol':'Full sun','Sol y media sombra':'Sun / partial shade','Media sombra':'Partial shade','Sombra':'Shade'})[value] || value || '';
}
function openForm() { form.reset(); dialog.showModal(); }
function closeForm() { dialog.close(); }
function cleanupObjectUrls() { objectUrls.forEach(URL.revokeObjectURL); objectUrls = []; }
function cleanupBrowseObjectUrls() { browseObjectUrls.forEach(URL.revokeObjectURL); browseObjectUrls = []; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function translationPair(value = '') {
  const text = String(value).trim();
  const index = text.lastIndexOf(' / ');
  if (index <= 0) return null;
  const translation = text.slice(index + 3).trim();
  if (!/^[A-Z¿¡]/.test(translation)) return null;
  return {primary: text.slice(0, index).trim(), translation};
}
function textWithTranslation(value = '') {
  const pair = translationPair(value);
  if (!pair) return escapeHtml(value);
  return `<span class="translated-text">${escapeHtml(pair.primary)}</span>
    <button type="button" class="translate-button" data-primary="${escapeHtml(pair.primary)}" data-translation="${escapeHtml(pair.translation)}">Traducir</button>`;
}
function plantPurposes(plant) {
  return plant.purposes || (plant.wildlifeValue ? [plant.wildlifeValue] : []);
}
function plantPhotos(plant) {
  const photos = Array.isArray(plant.photos) ? plant.photos.filter(Boolean) : [];
  return photos.length > 0 ? photos : (plant.photo ? [plant.photo] : []);
}
function starterRecordFor(plant) {
  const commonName = String(plant.commonName || '').trim().toLowerCase();
  const byName = STARTER_PLANTS.find(starter => String(starter.commonName || '').trim().toLowerCase() === commonName);
  if (byName) return byName;
  const scientificName = String(plant.scientificName || '').trim().toLowerCase();
  if (!scientificName) return null;
  const matches = STARTER_PLANTS.filter(starter => String(starter.scientificName || '').trim().toLowerCase() === scientificName);
  return matches.length === 1 ? matches[0] : null;
}

function hasPersonalPlantData(plant) {
  return Boolean(plant.nursery || plant.price || plant.gardenLocation || plant.photosEdited
    || (plant.photo && (typeof plant.photo !== 'string' || !isBundledPhoto(plant.photo)))
    || plantPhotos(plant).some(photo => typeof photo !== 'string' || !isBundledPhoto(photo)));
}

async function cleanupRepeatedStarterPlants() {
  const duplicates = new Map();
  const idsToDelete = [];
  for (const plant of plants) {
    if (String(plant.commonName || '').trim().toLowerCase() === 'arazá'
      && String(plant.scientificName || '').trim().toLowerCase() === 'psidium cattleianum'
      && !hasPersonalPlantData(plant)
      && plantPhotos(plant).some(isBundledPhoto)) {
      idsToDelete.push(plant.id);
      continue;
    }
    const starter = starterRecordFor(plant);
    if (!starter || plant.commonName !== starter.commonName) continue;
    const key = `${plant.commonName}\0${plant.scientificName}`;
    if (!duplicates.has(key)) duplicates.set(key, []);
    duplicates.get(key).push(plant);
  }
  for (const copies of duplicates.values()) {
    if (copies.length < 2) continue;
    copies.sort((a, b) => Number(hasPersonalPlantData(b)) - Number(hasPersonalPlantData(a))
      || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    for (const extra of copies.slice(1)) {
      if (!hasPersonalPlantData(extra)) idsToDelete.push(extra.id);
    }
  }
  if (idsToDelete.length === 0) return;
  await deletePlants(idsToDelete);
  plants = await getPlants();
}
function starterPhotosFor(plant) {
  return (starterRecordFor(plant)?.photos || []).filter(Boolean);
}
function photoUrl(photo, bucket = objectUrls) {
  if (typeof photo === 'string') return photo;
  const url = URL.createObjectURL(photo);
  bucket.push(url);
  return url;
}
function photoMarkup(plant, className = 'plant-photo', bucket = objectUrls) {
  const [photo] = plantPhotos(plant);
  if (!photo) return '<div class="plant-photo photo-placeholder" aria-hidden="true">🌱</div>';
  return `<img class="${className}" src="${escapeHtml(photoUrl(photo, bucket))}" alt="${escapeHtml(plant.commonName)}" />`;
}

function infoRow(label, value) {
  if (!value) return '';
  return `<div class="info-row"><span>${escapeHtml(label)}</span><p>${textWithTranslation(value)}</p></div>`;
}

function linkify(value) {
  return String(value).split(/(https?:\/\/[^\s|]+)/g).map((part, index) => index % 2
    ? `<a href="${escapeHtml(part)}" target="_blank" rel="noopener noreferrer">${escapeHtml(part)}</a>`
    : escapeHtml(part)).join('');
}

function linkRow(label, value) {
  if (!value) return '';
  return `<div class="info-row"><span>${escapeHtml(label)}</span><p>${linkify(value)}</p></div>`;
}

function openPlant(plantId) {
  activePlantId = plantId;
  renderBrowseDialog();
  browseDialog.showModal();
  browseDialog.scrollTop = 0;
  browseDetail.scrollTop = 0;
}

function expandPlant(plantId) {
  expandedPlantId = plantId;
  render();
  grid.querySelector('.expanded-card')?.scrollIntoView({block: 'start'});
}

function collapsePlant() {
  const plantId = expandedPlantId;
  if (!plantId) return;
  expandedPlantId = null;
  render();
  grid.querySelector(`[data-plant-id="${CSS.escape(plantId)}"]`)?.scrollIntoView({block: 'nearest'});
}

function closeBrowseDialog() {
  browseDialog.close();
  cleanupBrowseObjectUrls();
}

function showUpdateNotice(worker) {
  updateWorker = worker || updateWorker;
  updateReady = updateReady || updateWorker?.state === 'activated';
  updateNotice.hidden = false;
}

function reloadAppForUpdate() {
  reloadForUpdate = true;
  updateNotice.hidden = true;
  if (updateWorker && updateWorker.state !== 'activated') updateWorker.postMessage({type: 'SKIP_WAITING'});
  if (updateReady || !updateWorker || updateWorker.state === 'activated') {
    window.location.reload();
    return;
  }
  updateWorker.addEventListener('statechange', () => {
    if (updateWorker.state === 'activated' && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    if (registration.waiting && navigator.serviceWorker.controller) showUpdateNotice(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if ((worker.state === 'installed' || worker.state === 'activated') && navigator.serviceWorker.controller) showUpdateNotice(worker);
      });
    });
    registration.update().catch(console.error);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(console.error);
    });
    setInterval(() => registration.update().catch(console.error), 60 * 60 * 1000);
  } catch (error) {
    console.error(error);
  }
}

async function saveActivePlantPhotos(photos) {
  const plant = plants.find(item => item.id === activePlantId);
  if (!plant) return;
  await updatePlant({
    ...plant,
    photos,
    photo: photos[0] || null,
    photosEdited: true,
    updatedAt: new Date().toISOString(),
    schemaVersion: Math.max(Number(plant.schemaVersion) || 1, SCHEMA_VERSION)
  });
  plants = await getPlants();
  render();
  renderBrowseDialog();
}

async function movePhoto(index, delta) {
  const plant = plants.find(item => item.id === activePlantId);
  if (!plant) return;
  const photos = [...plantPhotos(plant)];
  const target = index + delta;
  if (index < 0 || target < 0 || target >= photos.length) return;
  [photos[index], photos[target]] = [photos[target], photos[index]];
  await saveActivePlantPhotos(photos);
}

async function removePhoto(index) {
  const plant = plants.find(item => item.id === activePlantId);
  if (!plant) return;
  const photos = plantPhotos(plant);
  if (index < 0 || index >= photos.length) return;
  if (!window.confirm('¿Borrar esta foto?')) return;
  await saveActivePlantPhotos(photos.filter((_, i) => i !== index));
}

async function appendPhotosToActivePlant(files) {
  if (!activePlantId || files.length === 0) return;
  const plant = plants.find(item => item.id === activePlantId);
  if (!plant) return;
  const photos = [...plantPhotos(plant), ...files];
  const updatedPlant = {
    ...plant,
    photos,
    photo: plant.photo || photos[0] || null,
    updatedAt: new Date().toISOString(),
    schemaVersion: Math.max(Number(plant.schemaVersion) || 1, 3)
  };
  await updatePlant(updatedPlant);
  plants = await getPlants();
  render();
  renderBrowseDialog();
}

function isBundledPhoto(photo) {
  return typeof photo === 'string' && /^\.?\/?assets\/plants\//.test(photo);
}

function starterPhotoUpdate(plant) {
  if (plant.photosEdited) return null;
  const starterPhotos = starterPhotosFor(plant);
  if (starterPhotos.length === 0) return null;
  const current = plantPhotos(plant);
  const ownPhotos = current.filter(photo => !isBundledPhoto(photo));
  const next = [...starterPhotos, ...ownPhotos];
  const unchanged = current.length === next.length && current.every((photo, i) => photo === next[i]);
  return unchanged ? null : next;
}

function sameFieldValue(current, next) {
  if (Array.isArray(current) || Array.isArray(next)) {
    return JSON.stringify(current || []) === JSON.stringify(next || []);
  }
  return (current || '') === (next || '');
}

function starterInfoUpdate(plant) {
  const starter = starterRecordFor(plant);
  if (!starter) return null;
  const changes = {};
  for (const field of STARTER_INFO_FIELDS) {
    const next = field in starter ? starter[field] : (field === 'purposes' ? [] : '');
    if (!sameFieldValue(plant[field], next)) changes[field] = next;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

function starterRecordUpdate(plant) {
  const photos = starterPhotoUpdate(plant);
  const info = starterInfoUpdate(plant);
  if (!photos && !info) return null;
  return {
    ...plant,
    ...(info || {}),
    ...(photos ? {photos, photo: isBundledPhoto(plant.photo) || !plant.photo ? photos[0] : plant.photo} : {}),
    updatedAt: plant.updatedAt || new Date().toISOString(),
    schemaVersion: Math.max(Number(plant.schemaVersion) || 1, SCHEMA_VERSION)
  };
}

function seedRecord(plant, index, now) {
  const photos = (plant.photos || []).filter(Boolean);
  return {
    id: crypto.randomUUID(),
    ...plant,
    photos,
    photo: photos[0] || null,
    createdAt: new Date(now.getTime() - index * 1000).toISOString(),
    updatedAt: now.toISOString(),
    schemaVersion: SCHEMA_VERSION
  };
}

// Seeds a starter plant the device has never held, so an existing install
// picks up plants added to the guide, not only edits to the ones it has.
async function addMissingStarterPlants() {
  const known = new Set(plants.map(starterRecordFor).filter(Boolean));
  const missing = STARTER_PLANTS.filter(starter => !known.has(starter));
  if (missing.length === 0) return;
  const now = new Date();
  await addPlants(missing.map((plant, index) => seedRecord(plant, index, now)));
  plants = await getPlants();
}

async function syncStarterRecords() {
  const updates = plants.map(starterRecordUpdate).filter(Boolean).map(updatePlant);
  if (updates.length === 0) return;
  await Promise.all(updates);
  plants = await getPlants();
}

function sectionHtml(title, rows) {
  const content = rows.filter(Boolean).join('');
  return content ? `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` : '';
}

function careRows(plant) {
  return [
    ['Sol', displayValue('sun', plant.sun)],
    ['Agua', plant.water],
    ['Suelo', plant.soil],
    ['Tamaño', plant.size],
    ['Cómo mantener el tamaño', plant.sizeManagement],
    ['Floración', plant.flowering],
    ['Fructificación', plant.fruiting],
    ['Propagación', plant.propagation]
  ];
}

function careStrip(plant, limit = 3) {
  const items = [
    ['Sol', displayValue('sun', plant.sun)],
    ['Agua', plant.water],
    ['Lugar', plant.gardenLocation],
    ['Tamaño', plant.size]
  ].filter(([, value]) => value).slice(0, limit);
  if (items.length === 0) return '';
  return `<dl class="care-strip">${items.map(([label, value]) => `
    <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>
  `).join('')}</dl>`;
}

function plantSections(plant) {
  return [
    sectionHtml('Cuidados', careRows(plant).map(([label, value]) => infoRow(label, value))),
    sectionHtml('Sanctuario de Aves', [
      infoRow('Estado', displayValue('status', plant.status)),
      infoRow('Prioridad', displayValue('priority', plant.priority)),
      infoRow('Vivero', plant.nursery),
      infoRow('Precio', plant.price),
      infoRow('Ubicación', plant.gardenLocation),
      infoRow('Notas', plant.notes)
    ]),
    sectionHtml('Ecología nativa', [
      infoRow('Nativa', plant.nativeStatus),
      infoRow('Distribución', plant.nativeRange),
      infoRow('Ecología', plant.ecology),
      infoRow('Hospedera', plant.hostPlant)
    ]),
    sectionHtml('Usos humanos', [
      infoRow('Comestible', plant.edibleUses),
      infoRow('Uso medicinal', plant.medicinalUses),
      infoRow('Otros usos', plant.otherUses),
      infoRow('Precauciones', plant.safety)
    ]),
    sectionHtml('Fuentes', [
      linkRow('Referencia', String(plant.sources || '').split(' | ').join('\n'))
    ])
  ].join('');
}

function tagMarkup(plant, limit = 4) {
  const purposes = plantPurposes(plant);
  return [displayValue('status', plant.status), displayValue('priority', plant.priority), displayValue('layer', plant.layer), displayValue('fruitSizeGroup', plant.fruitSizeGroup), displayValue('canopySizeGroup', plant.canopySizeGroup), ...purposes.slice(0, limit).map(v => displayValue('purpose', v))]
    .filter(Boolean).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join('');
}

function groupLabel(plant) {
  return plant.layer ? displayValue('layer', plant.layer) : UNGROUPED_LABEL;
}

function hasPlant(plant) {
  return ['Planted', 'Bought'].includes(plant.status);
}

function wantsPlant(plant) {
  return ['Want', 'Looking For'].includes(plant.status);
}

function statusRank(plant) {
  if (wantsPlant(plant)) return 0;
  if (hasPlant(plant)) return 1;
  return 2;
}

function inventoryBucket(plant) {
  if (hasPlant(plant)) return 'have';
  if (wantsPlant(plant)) return 'want';
  return 'other';
}

function statusClass(plant) {
  if (hasPlant(plant)) return 'status-have';
  if (wantsPlant(plant)) return 'status-want';
  return 'status-other';
}

function groupPlants(list) {
  const priorityRank = {High: 0, Medium: 1, Low: 2};
  const groups = new Map();
  for (const plant of list) {
    const label = groupLabel(plant);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(plant);
  }
  for (const items of groups.values()) {
    items.sort((a, b) =>
      statusRank(a) - statusRank(b)
      || (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3)
      || nameCollator.compare(a.commonName || '', b.commonName || ''));
  }
  return [...groups.entries()].sort(([aLabel, aItems], [bLabel, bItems]) => {
    const aLayer = aItems[0]?.layer;
    const bLayer = bItems[0]?.layer;
    return (aLabel === UNGROUPED_LABEL) - (bLabel === UNGROUPED_LABEL)
      || (LAYER_ORDER.indexOf(aLayer) === -1 ? 99 : LAYER_ORDER.indexOf(aLayer))
        - (LAYER_ORDER.indexOf(bLayer) === -1 ? 99 : LAYER_ORDER.indexOf(bLayer))
      || nameCollator.compare(aLabel, bLabel);
  });
}

function layerGroupSection(label, items) {
  const section = document.createElement('section');
  section.className = 'plant-group';
  const heading = document.createElement('h2');
  heading.className = 'group-heading';
  heading.textContent = label;
  section.append(heading);
  const layer = items[0]?.layer;
  const sizeOrder = layer === 'Fruit tree' ? FRUIT_SIZE_ORDER : layer === 'Canopy' ? CANOPY_SIZE_ORDER : null;
  if (sizeOrder) {
    const field = layer === 'Fruit tree' ? 'fruitSizeGroup' : 'canopySizeGroup';
    const descriptions = layer === 'Fruit tree' ? FRUIT_SIZE_DESCRIPTIONS : CANOPY_SIZE_DESCRIPTIONS;
    for (const group of [...sizeOrder, 'Unclassified']) {
      const plantsInGroup = items.filter(plant => (sizeOrder.includes(plant[field]) ? plant[field] : 'Unclassified') === group);
      if (plantsInGroup.length === 0) continue;
      const subSection = document.createElement('section');
      subSection.className = 'size-section';
      const subHeading = document.createElement('h3');
      subHeading.className = 'size-heading';
      subHeading.textContent = group === 'Unclassified' ? 'Tamaño por clasificar' : displayValue(field, group);
      const description = document.createElement('p');
      description.className = 'size-description';
      description.textContent = descriptions[group] || 'Agregá un grupo de tamaño para ubicar estas plantas.';
      const list = document.createElement('div');
      list.className = 'plant-group-items';
      list.append(...plantsInGroup.map(plant => plant.id === expandedPlantId ? cardForPlant(plant) : photoPlant(plant)));
      subSection.append(subHeading, description, list);
      section.append(subSection);
    }
  } else {
    const list = document.createElement('div');
    list.className = 'plant-group-items';
    list.append(...items.map(plant => plant.id === expandedPlantId ? cardForPlant(plant) : photoPlant(plant)));
    section.append(list);
  }
  return section;
}

function photoPlant(plant) {
  const article = document.createElement('article');
  article.className = `photo-plant ${statusClass(plant)}`;
  article.setAttribute('role', 'button');
  article.tabIndex = 0;
  article.dataset.plantId = plant.id;
  article.setAttribute('aria-label', `Expandir ${plant.commonName}`);
  article.innerHTML = `${photoMarkup(plant, 'plant-thumb')}
    <div>
      <h3>${escapeHtml(plant.commonName)}</h3>
      ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
      ${['Fruit tree', 'Canopy'].includes(plant.layer) && plant.size ? `<p class="plant-size-summary">${escapeHtml(plant.size)}</p>` : ''}
    </div>`;
  return article;
}

function cardForPlant(plant) {
  const article = document.createElement('article');
  article.className = `plant-card expanded-card ${statusClass(plant)}`;
  const tags = tagMarkup(plant);
  const facts = [
    displayValue('sun', plant.sun),
    plant.water,
    plant.size
  ].filter(Boolean).slice(0, 3).map(v => `<li>${escapeHtml(v)}</li>`).join('');
  const photoCount = plantPhotos(plant).length;

  article.innerHTML = `<div class="card-gallery">${galleryMarkup(plant)}</div>
    <div class="plant-card-body">
      <div class="card-title-row">
        <div>
          <h3>${escapeHtml(plant.commonName)}</h3>
          ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
        </div>
        <div class="card-title-aside">
          ${photoCount > 1 ? `<span class="photo-count">${photoCount} fotos</span>` : ''}
          <button type="button" class="icon-button card-close-button" data-action="collapse" aria-label="Cerrar tarjeta">×</button>
        </div>
      </div>
      ${tags ? `<div class="meta">${tags}</div>` : ''}
      ${facts ? `<ul class="fact-list">${facts}</ul>` : ''}
      ${plant.description ? `<p>${textWithTranslation(plant.description)}</p>` : ''}
      ${plant.sizeManagement ? `<p class="size-management">${escapeHtml(plant.sizeManagement)}</p>` : ''}
      ${plant.wildlifeNotes ? `<p class="wildlife-callout">${textWithTranslation(plant.wildlifeNotes)}</p>` : ''}
      <button type="button" class="primary-button card-more-button" data-action="all-info" data-plant-id="${escapeHtml(plant.id)}">Toda la información</button>
    </div>`;
  return article;
}

function photoControls(index, total) {
  const button = (action, label, symbol, disabled) =>
    `<button type="button" class="photo-button" data-action="${action}" data-index="${index}" aria-label="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>${symbol}</button>`;
  return `<div class="photo-controls">
    ${button('photo-earlier', 'Mover foto antes', '‹', index === 0)}
    <span class="photo-position">${index + 1}/${total}</span>
    ${button('photo-later', 'Mover foto después', '›', index === total - 1)}
    ${button('photo-remove', 'Borrar foto', '×', false)}
  </div>`;
}

function galleryMarkup(plant, bucket = objectUrls, editable = false) {
  const photos = plantPhotos(plant);
  if (photos.length === 0) return '<div class="plant-photo detail-photo photo-placeholder" aria-hidden="true">🌱</div>';
  return `<div class="photo-gallery">${photos.map((photo, index) => `<figure class="photo-slide">
      <img src="${escapeHtml(photoUrl(photo, bucket))}" alt="${escapeHtml(`${plant.commonName} foto ${index + 1}`)}" />
      ${editable ? photoControls(index, photos.length) : ''}
    </figure>`).join('')}</div>`;
}

function detailPlant(plant) {
  const tags = tagMarkup(plant, 8);
  return `
    <div class="dialog-toolbar">
      <div class="dialog-actions">
        <button type="button" class="secondary-button" data-action="add-photos">Agregar fotos</button>
      </div>
      <button type="button" class="icon-button" data-action="close" aria-label="Cerrar">×</button>
    </div>
    <div class="plant-detail full-detail">
      ${galleryMarkup(plant, browseObjectUrls, true)}
      <div class="plant-detail-body">
        <header class="detail-heading">
          <div>
            <h2>${escapeHtml(plant.commonName)}</h2>
            ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
          </div>
          ${plant.plantType ? `<span class="detail-type">${escapeHtml(displayValue('plantType', plant.plantType))}</span>` : ''}
        </header>
        ${tags ? `<div class="meta">${tags}</div>` : ''}
        ${careStrip(plant, 4)}
        ${plant.description ? `<p>${textWithTranslation(plant.description)}</p>` : ''}
        ${plant.wildlifeNotes ? `<p class="wildlife-callout">${textWithTranslation(plant.wildlifeNotes)}</p>` : ''}
        <div class="detail-sections">${plantSections(plant)}</div>
      </div>
    </div>`;
}

function renderBrowseDialog() {
  const plant = plants.find(item => item.id === activePlantId);
  if (!plant) {
    closeBrowseDialog();
    return;
  }
  cleanupBrowseObjectUrls();
  browseDetail.innerHTML = detailPlant(plant);
}

function searchableText(plant) {
  return Object.values(plant).flatMap(v => Array.isArray(v) ? v : [v]).filter(v => typeof v === 'string').join(' ').toLowerCase();
}

function render() {
  cleanupObjectUrls();
  const query = searchInput.value.trim().toLowerCase();
  const visiblePlants = plants.filter(plant => {
    return searchableText(plant).includes(query)
      && (!sunFilter.value || canonicalSun(plant.sun) === sunFilter.value)
      && (!statusFilter.value
        || (statusFilter.value === 'have' && hasPlant(plant))
        || (statusFilter.value === 'want' && wantsPlant(plant))
        || (statusFilter.value === 'other' && inventoryBucket(plant) === 'other'));
  });
  if (expandedPlantId && !visiblePlants.some(plant => plant.id === expandedPlantId)) expandedPlantId = null;
  grid.className = 'plant-grid view-photos';
  grid.replaceChildren(...groupPlants(visiblePlants).map(([label, plantsInLayer]) => layerGroupSection(label, plantsInLayer)));
  emptyState.hidden = plants.length > 0;
  noResults.hidden = plants.length === 0 || visiblePlants.length > 0;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const now = new Date().toISOString();
  const value = name => String(data.get(name) || '').trim();
  const photos = Array.from(document.querySelector('#photo').files || []);
  const plant = {
    id: crypto.randomUUID(), commonName: value('commonName'), scientificName: value('scientificName'), plantType: value('plantType'), layer: value('layer'), description: value('description'),
    nativeStatus: value('nativeStatus'), nativeRange: value('nativeRange'), ecology: value('ecology'), hostPlant: value('hostPlant'), purposes: data.getAll('purposes'), wildlifeNotes: value('wildlifeNotes'),
    sun: value('sun'), water: value('water'), soil: value('soil'), size: value('size'), fruitSizeGroup: value('fruitSizeGroup'), canopySizeGroup: value('canopySizeGroup'), sizeManagement: value('sizeManagement'), flowering: value('flowering'), fruiting: value('fruiting'), propagation: value('propagation'),
    edibleUses: value('edibleUses'), medicinalUses: value('medicinalUses'), otherUses: value('otherUses'), safety: value('safety'),
    sources: value('sources'),
    status: value('status'), priority: value('priority'), nursery: value('nursery'), price: value('price'), gardenLocation: value('gardenLocation'), notes: value('notes'),
    photos, photo: photos[0] || null, createdAt: now, updatedAt: now, schemaVersion: SCHEMA_VERSION
  };
  await addPlant(plant); plants = await getPlants(); closeForm(); render();
});

for (const id of ['open-form','empty-add']) document.querySelector(`#${id}`).addEventListener('click', openForm);
for (const id of ['close-form','cancel-form']) document.querySelector(`#${id}`).addEventListener('click', closeForm);
for (const input of [searchInput, statusFilter, sunFilter]) input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', render);
document.querySelector('#clear-filters').addEventListener('click', () => {
  searchInput.value = '';
  statusFilter.value = '';
  sunFilter.value = '';
  render();
});
function activateGridTarget(target) {
  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'collapse') {
    collapsePlant();
    return true;
  }
  const plantId = target.closest('[data-plant-id]')?.dataset.plantId;
  if (!plantId) return false;
  if (action === 'all-info') openPlant(plantId);
  else if (plantId === expandedPlantId) collapsePlant();
  else expandPlant(plantId);
  return true;
}

grid.addEventListener('click', event => { activateGridTarget(event.target); });
document.addEventListener('click', event => {
  const button = event.target.closest('.translate-button');
  if (!button) return;
  const text = button.closest('p')?.querySelector('.translated-text');
  if (!text) return;
  const showingTranslation = button.dataset.showingTranslation === 'true';
  text.textContent = showingTranslation ? button.dataset.primary : button.dataset.translation;
  button.textContent = showingTranslation ? 'Traducir' : 'Ver español';
  button.dataset.showingTranslation = String(!showingTranslation);
});
grid.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.closest('button')) return;
  if (activateGridTarget(event.target)) event.preventDefault();
});
browseDialog.addEventListener('click', event => {
  if (event.target === browseDialog) closeBrowseDialog();
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'close') closeBrowseDialog();
  if (action === 'add-photos') browsePhotoInput.click();
  const index = Number(event.target.closest('[data-index]')?.dataset.index);
  if (action === 'photo-earlier') movePhoto(index, -1);
  if (action === 'photo-later') movePhoto(index, 1);
  if (action === 'photo-remove') removePhoto(index);
});
browseDialog.addEventListener('close', cleanupBrowseObjectUrls);
browsePhotoInput.addEventListener('change', async () => {
  await appendPhotosToActivePlant(Array.from(browsePhotoInput.files || []));
  browsePhotoInput.value = '';
});
updateButton.addEventListener('click', reloadAppForUpdate);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    updateReady = true;
    if (reloadForUpdate && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'NEW_VERSION_READY') showUpdateNotice(navigator.serviceWorker.controller);
  });
  window.addEventListener('load', registerServiceWorker);
}

plants = await getPlants();
await cleanupRepeatedStarterPlants();
await addMissingStarterPlants();
await syncStarterRecords();
render();
