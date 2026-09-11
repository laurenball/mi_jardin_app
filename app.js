import { addPlant, addPlants, getPlants, updatePlant } from './db.js';
import { STARTER_PLANTS } from './starter-plants.js';

const dialog = document.querySelector('#plant-dialog');
const browseDialog = document.querySelector('#browse-dialog');
const browseDetail = document.querySelector('#browse-detail');
const browsePhotoInput = document.querySelector('#browse-photo-input');
const form = document.querySelector('#plant-form');
const grid = document.querySelector('#plant-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search');
const layerFilter = document.querySelector('#layer-filter');
const purposeFilter = document.querySelector('#purpose-filter');
const statusFilter = document.querySelector('#status-filter');
const viewInputs = Array.from(document.querySelectorAll('input[name="plant-view"]'));
let plants = [];
let objectUrls = [];
let browseObjectUrls = [];
let currentView = readSavedView();
let activePlantId = null;
let activeDetailLevel = 'overview';

const DISPLAY_LABELS = {
  status: {'Want':'Want / Quiero','Looking For':'Looking For / Buscando','Bought':'Bought / Comprada','Planted':'Planted / Plantada'},
  sun: {'Full sun':'Full sun / Pleno sol','Sun / partial shade':'Sun / partial shade / Sol y media sombra','Partial shade':'Partial shade / Media sombra','Shade':'Shade / Sombra'},
  layer: {'Canopy':'Canopy / Dosel','Fruit tree':'Fruit tree / Frutal','Shrub':'Shrub / Arbusto','Herbaceous':'Herbaceous / Herbácea','Grass':'Grass / Gramínea','Climber':'Climber / Trepadora'},
  purpose: {'Bird food':'Bird food / Alimento para aves','Shelter':'Shelter / Refugio','Nesting':'Nesting / Nidificación','Hummingbirds':'Hummingbirds / Picaflores','Butterflies':'Butterflies / Mariposas','Pollinators':'Pollinators / Polinizadores','Edible':'Edible / Comestible','Medicinal tradition':'Medicinal tradition / Uso medicinal tradicional'}
};

function displayValue(group, value) { return DISPLAY_LABELS[group]?.[value] || value || ''; }
function openForm() { form.reset(); dialog.showModal(); }
function closeForm() { dialog.close(); }
function cleanupObjectUrls() { objectUrls.forEach(URL.revokeObjectURL); objectUrls = []; }
function cleanupBrowseObjectUrls() { browseObjectUrls.forEach(URL.revokeObjectURL); browseObjectUrls = []; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function readSavedView() {
  try {
    const saved = localStorage.getItem('plantView');
    if (saved === 'detail') return 'cards';
    return ['compact', 'photos', 'cards'].includes(saved) ? saved : 'photos';
  } catch {
    return 'photos';
  }
}
function saveView(value) {
  try { localStorage.setItem('plantView', value); } catch {}
}
function plantPurposes(plant) {
  return plant.purposes || (plant.wildlifeValue ? [plant.wildlifeValue] : []);
}
function plantPhotos(plant) {
  const photos = Array.isArray(plant.photos) ? plant.photos.filter(Boolean) : [];
  return photos.length > 0 ? photos : (plant.photo ? [plant.photo] : []);
}
function starterRecordFor(plant) {
  const commonName = String(plant.commonName || '').toLowerCase();
  const scientificName = String(plant.scientificName || '').toLowerCase();
  return STARTER_PLANTS.find(starter =>
    String(starter.commonName || '').toLowerCase() === commonName
    || String(starter.scientificName || '').toLowerCase() === scientificName
  );
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
  return `<div class="info-row"><span>${escapeHtml(label)}</span><p>${escapeHtml(value)}</p></div>`;
}

function openPlant(plantId, level = 'overview') {
  activePlantId = plantId;
  activeDetailLevel = level;
  renderBrowseDialog();
  browseDialog.showModal();
}

function closeBrowseDialog() {
  browseDialog.close();
  cleanupBrowseObjectUrls();
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

async function enrichStarterPhotos() {
  const updates = plants
    .filter(plant => plantPhotos(plant).length === 0 && starterPhotosFor(plant).length > 0)
    .map(plant => {
      const photos = starterPhotosFor(plant);
      return updatePlant({
        ...plant,
        photos,
        photo: plant.photo || photos[0] || null,
        updatedAt: plant.updatedAt || new Date().toISOString(),
        schemaVersion: Math.max(Number(plant.schemaVersion) || 1, 3)
      });
    });
  if (updates.length === 0) return;
  await Promise.all(updates);
  plants = await getPlants();
}

function sectionHtml(title, rows) {
  const content = rows.filter(Boolean).join('');
  return content ? `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${content}</section>` : '';
}

function plantSections(plant) {
  return [
    sectionHtml('Native ecology / Ecología nativa', [
      infoRow('Native / Nativa', plant.nativeStatus),
      infoRow('Range / Distribución', plant.nativeRange),
      infoRow('Ecology / Ecología', plant.ecology),
      infoRow('Host plant / Hospedera', plant.hostPlant)
    ]),
    sectionHtml('Growing / Cultivo', [
      infoRow('Sun / Sol', displayValue('sun', plant.sun)),
      infoRow('Water / Agua', plant.water),
      infoRow('Soil / Suelo', plant.soil),
      infoRow('Size / Tamaño', plant.size),
      infoRow('Flowering / Floración', plant.flowering),
      infoRow('Fruiting / Fructificación', plant.fruiting),
      infoRow('Propagation / Propagación', plant.propagation)
    ]),
    sectionHtml('Human uses / Usos humanos', [
      infoRow('Edible / Comestible', plant.edibleUses),
      infoRow('Traditional medicinal use / Uso medicinal tradicional', plant.medicinalUses),
      infoRow('Other uses / Otros usos', plant.otherUses),
      infoRow('Safety / Precauciones', plant.safety)
    ]),
    sectionHtml('My garden / Mi jardín', [
      infoRow('Status / Estado', displayValue('status', plant.status)),
      infoRow('Priority / Prioridad', plant.priority),
      infoRow('Nursery / Vivero', plant.nursery),
      infoRow('Price / Precio', plant.price),
      infoRow('Garden location / Ubicación', plant.gardenLocation),
      infoRow('Notes / Notas', plant.notes)
    ])
  ].join('');
}

function tagMarkup(plant, limit = 4) {
  const purposes = plantPurposes(plant);
  return [displayValue('status', plant.status), displayValue('layer', plant.layer), ...purposes.slice(0, limit).map(v => displayValue('purpose', v))]
    .filter(Boolean).map(v => `<span class="tag">${escapeHtml(v)}</span>`).join('');
}

function compactPlant(plant) {
  const article = document.createElement('article');
  article.className = 'compact-plant';
  article.setAttribute('role', 'button');
  article.tabIndex = 0;
  article.dataset.plantId = plant.id;
  article.setAttribute('aria-label', `Open ${plant.commonName} / Abrir ${plant.commonName}`);
  article.innerHTML = `<h2>${escapeHtml(plant.commonName)}</h2>${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}`;
  return article;
}

function photoPlant(plant) {
  const article = document.createElement('article');
  article.className = 'photo-plant';
  article.setAttribute('role', 'button');
  article.tabIndex = 0;
  article.dataset.plantId = plant.id;
  article.setAttribute('aria-label', `Open ${plant.commonName} / Abrir ${plant.commonName}`);
  article.innerHTML = `${photoMarkup(plant, 'plant-thumb')}
    <div>
      <h2>${escapeHtml(plant.commonName)}</h2>
      ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
    </div>`;
  return article;
}

function cardForPlant(plant) {
  const article = document.createElement('article');
  article.className = 'plant-card';
  article.setAttribute('role', 'button');
  article.tabIndex = 0;
  article.dataset.plantId = plant.id;
  article.setAttribute('aria-label', `Open ${plant.commonName} / Abrir ${plant.commonName}`);
  const tags = tagMarkup(plant);
  const facts = [
    displayValue('sun', plant.sun),
    plant.water,
    plant.size
  ].filter(Boolean).slice(0, 3).map(v => `<li>${escapeHtml(v)}</li>`).join('');
  const photoCount = plantPhotos(plant).length;

  article.innerHTML = `${photoMarkup(plant)}
    <div class="plant-card-body">
      <div class="card-title-row">
        <div>
          <h2>${escapeHtml(plant.commonName)}</h2>
          ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
        </div>
        ${photoCount > 1 ? `<span class="photo-count">${photoCount} photos / fotos</span>` : ''}
      </div>
      ${tags ? `<div class="meta">${tags}</div>` : ''}
      ${facts ? `<ul class="fact-list">${facts}</ul>` : ''}
      ${plant.description ? `<p>${escapeHtml(plant.description)}</p>` : ''}
      ${plant.wildlifeNotes ? `<p class="wildlife-callout">${escapeHtml(plant.wildlifeNotes)}</p>` : ''}
    </div>`;
  return article;
}

function galleryMarkup(plant, bucket = objectUrls) {
  const photos = plantPhotos(plant);
  if (photos.length === 0) return '<div class="plant-photo detail-photo photo-placeholder" aria-hidden="true">🌱</div>';
  return `<div class="photo-gallery">${photos.map((photo, index) => `<img src="${escapeHtml(photoUrl(photo, bucket))}" alt="${escapeHtml(`${plant.commonName} photo ${index + 1}`)}" />`).join('')}</div>`;
}

function detailPlant(plant) {
  const tags = tagMarkup(plant, 8);
  return `
    <div class="dialog-toolbar">
      <div class="dialog-actions">
        <button type="button" class="secondary-button" data-action="overview">Less / Menos</button>
        <button type="button" class="secondary-button" data-action="add-photos">Add photos / Agregar fotos</button>
      </div>
      <button type="button" class="icon-button" data-action="close" aria-label="Close / Cerrar">×</button>
    </div>
    <div class="plant-detail full-detail">
      ${galleryMarkup(plant, browseObjectUrls)}
      <div class="plant-detail-body">
        <header class="detail-heading">
          <div>
            <h2>${escapeHtml(plant.commonName)}</h2>
            ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
          </div>
          ${plant.plantType ? `<span class="detail-type">${escapeHtml(plant.plantType)}</span>` : ''}
        </header>
        ${tags ? `<div class="meta">${tags}</div>` : ''}
        ${plant.description ? `<p>${escapeHtml(plant.description)}</p>` : ''}
        ${plant.wildlifeNotes ? `<p class="wildlife-callout">${escapeHtml(plant.wildlifeNotes)}</p>` : ''}
        <div class="detail-sections">${plantSections(plant)}</div>
      </div>
    </div>`;
}

function overviewPlant(plant) {
  const tags = tagMarkup(plant, 5);
  const facts = [
    infoRow('Sun / Sol', displayValue('sun', plant.sun)),
    infoRow('Water / Agua', plant.water),
    infoRow('Size / Tamaño', plant.size),
    infoRow('Status / Estado', displayValue('status', plant.status)),
    infoRow('Priority / Prioridad', plant.priority)
  ].join('');
  return `
    <div class="dialog-toolbar">
      <div class="dialog-actions">
        <button type="button" class="primary-button" data-action="full">Full details / Detalle completo</button>
        <button type="button" class="secondary-button" data-action="add-photos">Add photos / Agregar fotos</button>
      </div>
      <button type="button" class="icon-button" data-action="close" aria-label="Close / Cerrar">×</button>
    </div>
    <div class="plant-detail overview-detail">
      ${photoMarkup(plant, 'plant-photo detail-photo', browseObjectUrls)}
      <div class="plant-detail-body">
      <header class="detail-heading">
        <div>
          <h2>${escapeHtml(plant.commonName)}</h2>
          ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
        </div>
        ${plant.plantType ? `<span class="detail-type">${escapeHtml(plant.plantType)}</span>` : ''}
      </header>
      ${tags ? `<div class="meta">${tags}</div>` : ''}
      ${plant.description ? `<p>${escapeHtml(plant.description)}</p>` : ''}
      ${plant.wildlifeNotes ? `<p class="wildlife-callout">${escapeHtml(plant.wildlifeNotes)}</p>` : ''}
      ${facts ? `<div class="overview-facts">${facts}</div>` : ''}
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
  browseDetail.innerHTML = activeDetailLevel === 'full' ? detailPlant(plant) : overviewPlant(plant);
}

function searchableText(plant) {
  return Object.values(plant).flatMap(v => Array.isArray(v) ? v : [v]).filter(v => typeof v === 'string').join(' ').toLowerCase();
}

function render() {
  cleanupObjectUrls();
  const query = searchInput.value.trim().toLowerCase();
  const visiblePlants = plants.filter(plant => {
    const purposes = plantPurposes(plant);
    return searchableText(plant).includes(query)
      && (!layerFilter.value || plant.layer === layerFilter.value)
      && (!purposeFilter.value || purposes.includes(purposeFilter.value))
      && (!statusFilter.value || plant.status === statusFilter.value);
  });
  grid.className = `plant-grid view-${currentView}`;
  const viewRenderer = currentView === 'compact' ? compactPlant : currentView === 'photos' ? photoPlant : cardForPlant;
  grid.replaceChildren(...visiblePlants.map(viewRenderer));
  emptyState.hidden = plants.length > 0;
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
    sun: value('sun'), water: value('water'), soil: value('soil'), size: value('size'), flowering: value('flowering'), fruiting: value('fruiting'), propagation: value('propagation'),
    edibleUses: value('edibleUses'), medicinalUses: value('medicinalUses'), otherUses: value('otherUses'), safety: value('safety'),
    status: value('status'), priority: value('priority'), nursery: value('nursery'), price: value('price'), gardenLocation: value('gardenLocation'), notes: value('notes'),
    photos, photo: photos[0] || null, createdAt: now, updatedAt: now, schemaVersion: 3
  };
  await addPlant(plant); plants = await getPlants(); closeForm(); render();
});

for (const id of ['open-form','empty-add']) document.querySelector(`#${id}`).addEventListener('click', openForm);
for (const id of ['close-form','cancel-form']) document.querySelector(`#${id}`).addEventListener('click', closeForm);
for (const input of [searchInput, layerFilter, purposeFilter, statusFilter]) input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', render);
grid.addEventListener('click', event => {
  const plantItem = event.target.closest('[data-plant-id]');
  if (plantItem) openPlant(plantItem.dataset.plantId);
});
grid.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const plantItem = event.target.closest('[data-plant-id]');
  if (!plantItem) return;
  event.preventDefault();
  openPlant(plantItem.dataset.plantId);
});
browseDialog.addEventListener('click', event => {
  if (event.target === browseDialog) closeBrowseDialog();
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'close') closeBrowseDialog();
  if (action === 'full') {
    activeDetailLevel = 'full';
    renderBrowseDialog();
  }
  if (action === 'overview') {
    activeDetailLevel = 'overview';
    renderBrowseDialog();
  }
  if (action === 'add-photos') browsePhotoInput.click();
});
browseDialog.addEventListener('close', cleanupBrowseObjectUrls);
browsePhotoInput.addEventListener('change', async () => {
  await appendPhotosToActivePlant(Array.from(browsePhotoInput.files || []));
  browsePhotoInput.value = '';
});
for (const input of viewInputs) {
  input.checked = input.value === currentView;
  input.addEventListener('change', () => {
    currentView = input.value;
    saveView(currentView);
    render();
  });
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));

plants = await getPlants();
if (plants.length === 0) {
  const now = new Date();
  const seeded = STARTER_PLANTS.map((plant, i) => {
    const photos = (plant.photos || []).filter(Boolean);
    return {id: crypto.randomUUID(), ...plant, photos, photo: photos[0] || null, createdAt: new Date(now.getTime() - i * 1000).toISOString(), updatedAt: now.toISOString(), schemaVersion: 3};
  });
  await addPlants(seeded); plants = await getPlants();
} else {
  await enrichStarterPhotos();
}
render();
