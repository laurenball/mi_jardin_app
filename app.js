import { addPlant, addPlants, getPlants } from './db.js';
import { STARTER_PLANTS } from './starter-plants.js';

const dialog = document.querySelector('#plant-dialog');
const form = document.querySelector('#plant-form');
const grid = document.querySelector('#plant-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search');
const layerFilter = document.querySelector('#layer-filter');
const purposeFilter = document.querySelector('#purpose-filter');
const statusFilter = document.querySelector('#status-filter');
let plants = [];
let objectUrls = [];

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
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

function infoRow(label, value) {
  if (!value) return '';
  return `<div class="info-row"><span>${escapeHtml(label)}</span><p>${escapeHtml(value)}</p></div>`;
}

function cardForPlant(plant) {
  const article = document.createElement('article');
  article.className = 'plant-card';
  let photoHtml = '<div class="plant-photo photo-placeholder" aria-hidden="true">🌱</div>';
  if (plant.photo) {
    const url = URL.createObjectURL(plant.photo); objectUrls.push(url);
    photoHtml = `<img class="plant-photo" src="${url}" alt="${escapeHtml(plant.commonName)}" />`;
  }
  const purposes = plant.purposes || (plant.wildlifeValue ? [plant.wildlifeValue] : []);
  const tags = [displayValue('status', plant.status), displayValue('layer', plant.layer), ...purposes.slice(0,4).map(v=>displayValue('purpose',v))]
    .filter(Boolean).map(v=>`<span class="tag">${escapeHtml(v)}</span>`).join('');

  const ecology = [
    infoRow('Native / Nativa', plant.nativeStatus), infoRow('Range / Distribución', plant.nativeRange), infoRow('Ecology / Ecología', plant.ecology), infoRow('Host plant / Hospedera', plant.hostPlant)
  ].join('');
  const growing = [
    infoRow('Sun / Sol', displayValue('sun', plant.sun)), infoRow('Water / Agua', plant.water), infoRow('Soil / Suelo', plant.soil), infoRow('Size / Tamaño', plant.size), infoRow('Flowering / Floración', plant.flowering), infoRow('Fruiting / Fructificación', plant.fruiting), infoRow('Propagation / Propagación', plant.propagation)
  ].join('');
  const uses = [infoRow('Edible / Comestible', plant.edibleUses), infoRow('Traditional medicinal use / Uso medicinal tradicional', plant.medicinalUses), infoRow('Other uses / Otros usos', plant.otherUses), infoRow('Safety / Precauciones', plant.safety)].join('');
  const personal = [infoRow('Priority / Prioridad', plant.priority), infoRow('Nursery / Vivero', plant.nursery), infoRow('Price / Precio', plant.price), infoRow('Garden location / Ubicación', plant.gardenLocation), infoRow('Notes / Notas', plant.notes)].join('');

  article.innerHTML = `${photoHtml}<div class="plant-card-body"><h2>${escapeHtml(plant.commonName)}</h2>${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>`:''}${tags?`<div class="meta">${tags}</div>`:''}${plant.description?`<p>${escapeHtml(plant.description)}</p>`:''}${plant.wildlifeNotes?`<p class="wildlife-callout">🦋 ${escapeHtml(plant.wildlifeNotes)}</p>`:''}<details class="card-details"><summary>More / Más</summary>${ecology?`<h3>Native ecology / Ecología nativa</h3>${ecology}`:''}${growing?`<h3>Growing / Cultivo</h3>${growing}`:''}${uses?`<h3>Human uses / Usos humanos</h3>${uses}`:''}${personal?`<h3>My garden / Mi jardín</h3>${personal}`:''}</details></div>`;
  return article;
}

function searchableText(plant) {
  return Object.values(plant).flatMap(v => Array.isArray(v) ? v : [v]).filter(v => typeof v === 'string').join(' ').toLowerCase();
}

function render() {
  cleanupObjectUrls();
  const query = searchInput.value.trim().toLowerCase();
  const visiblePlants = plants.filter(plant => {
    const purposes = plant.purposes || [];
    return searchableText(plant).includes(query)
      && (!layerFilter.value || plant.layer === layerFilter.value)
      && (!purposeFilter.value || purposes.includes(purposeFilter.value))
      && (!statusFilter.value || plant.status === statusFilter.value);
  });
  grid.replaceChildren(...visiblePlants.map(cardForPlant));
  emptyState.hidden = plants.length > 0;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const now = new Date().toISOString();
  const value = name => String(data.get(name) || '').trim();
  const plant = {
    id: crypto.randomUUID(), commonName: value('commonName'), scientificName: value('scientificName'), plantType: value('plantType'), layer: value('layer'), description: value('description'),
    nativeStatus: value('nativeStatus'), nativeRange: value('nativeRange'), ecology: value('ecology'), hostPlant: value('hostPlant'), purposes: data.getAll('purposes'), wildlifeNotes: value('wildlifeNotes'),
    sun: value('sun'), water: value('water'), soil: value('soil'), size: value('size'), flowering: value('flowering'), fruiting: value('fruiting'), propagation: value('propagation'),
    edibleUses: value('edibleUses'), medicinalUses: value('medicinalUses'), otherUses: value('otherUses'), safety: value('safety'),
    status: value('status'), priority: value('priority'), nursery: value('nursery'), price: value('price'), gardenLocation: value('gardenLocation'), notes: value('notes'),
    photo: document.querySelector('#photo').files[0] || null, createdAt: now, updatedAt: now, schemaVersion: 2
  };
  await addPlant(plant); plants = await getPlants(); closeForm(); render();
});

for (const id of ['open-form','empty-add']) document.querySelector(`#${id}`).addEventListener('click', openForm);
for (const id of ['close-form','cancel-form']) document.querySelector(`#${id}`).addEventListener('click', closeForm);
for (const input of [searchInput, layerFilter, purposeFilter, statusFilter]) input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', render);

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));

plants = await getPlants();
if (plants.length === 0) {
  const now = new Date();
  const seeded = STARTER_PLANTS.map((plant, i) => ({id: crypto.randomUUID(), ...plant, photo: null, createdAt: new Date(now.getTime() - i * 1000).toISOString(), updatedAt: now.toISOString(), schemaVersion: 2}));
  await addPlants(seeded); plants = await getPlants();
}
render();
