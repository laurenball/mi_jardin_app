import { addPlant, getPlants } from './db.js';

const dialog = document.querySelector('#plant-dialog');
const form = document.querySelector('#plant-form');
const grid = document.querySelector('#plant-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search');

let plants = [];
let objectUrls = [];

function openForm() {
  form.reset();
  dialog.showModal();
}

function closeForm() {
  dialog.close();
}

function cleanupObjectUrls() {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls = [];
}

function cardForPlant(plant) {
  const article = document.createElement('article');
  article.className = 'plant-card';

  let photoHtml = '<div class="plant-photo photo-placeholder" aria-hidden="true">🌱</div>';
  if (plant.photo) {
    const url = URL.createObjectURL(plant.photo);
    objectUrls.push(url);
    photoHtml = `<img class="plant-photo" src="${url}" alt="${escapeHtml(plant.commonName)}" />`;
  }

  const tags = [plant.status, plant.sun, plant.nativeStatus, plant.wildlifeValue]
    .filter(Boolean)
    .map((value) => `<span class="tag">${escapeHtml(value)}</span>`)
    .join('');

  article.innerHTML = `
    ${photoHtml}
    <div class="plant-card-body">
      <h2>${escapeHtml(plant.commonName)}</h2>
      ${plant.scientificName ? `<p class="scientific">${escapeHtml(plant.scientificName)}</p>` : ''}
      ${tags ? `<div class="meta">${tags}</div>` : ''}
      ${plant.description ? `<p>${escapeHtml(plant.description)}</p>` : ''}
      ${plant.notes ? `<p class="notes">${escapeHtml(plant.notes)}</p>` : ''}
    </div>
  `;

  return article;
}

function render() {
  cleanupObjectUrls();
  const query = searchInput.value.trim().toLowerCase();
  const visiblePlants = plants.filter((plant) => {
    const haystack = [
      plant.commonName,
      plant.scientificName,
      plant.description,
      plant.notes,
      plant.sun,
      plant.nativeStatus,
      plant.wildlifeValue,
      plant.status,
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  grid.replaceChildren(...visiblePlants.map(cardForPlant));
  emptyState.hidden = plants.length > 0;
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  }[character]));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const photoFile = document.querySelector('#photo').files[0] || null;
  const now = new Date().toISOString();

  const plant = {
    id: crypto.randomUUID(),
    commonName: data.get('commonName').trim(),
    scientificName: data.get('scientificName').trim(),
    description: data.get('description').trim(),
    notes: data.get('notes').trim(),
    sun: data.get('sun'),
    nativeStatus: data.get('nativeStatus').trim(),
    wildlifeValue: data.get('wildlifeValue').trim(),
    status: data.get('status'),
    photo: photoFile,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };

  await addPlant(plant);
  plants = await getPlants();
  closeForm();
  render();
});

document.querySelector('#open-form').addEventListener('click', openForm);
document.querySelector('#empty-add').addEventListener('click', openForm);
document.querySelector('#close-form').addEventListener('click', closeForm);
document.querySelector('#cancel-form').addEventListener('click', closeForm);
searchInput.addEventListener('input', render);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  });
}

plants = await getPlants();
render();
