import {getPlants, replacePlants} from './db.js';
import {createBackup, readBackup, HOUSE_POSITION_KEY} from './backup-data.js';

const exportButton = document.querySelector('#export-backup');
const restoreButton = document.querySelector('#restore-backup');
const fileInput = document.querySelector('#backup-file');
const preview = document.querySelector('#backup-preview');
const status = document.querySelector('#backup-status');
let pendingBackup = null;
let busy = false;

function setBusy(value) {
  busy = value;
  exportButton.disabled = value;
  fileInput.disabled = value;
  restoreButton.disabled = value || !pendingBackup;
}

exportButton.addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  status.textContent = 'Preparando respaldo…';
  try {
    const plants = await getPlants();
    const housePosition = JSON.parse(localStorage.getItem(HOUSE_POSITION_KEY));
    const backup = await createBackup(plants, housePosition);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanctuario-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = `Respaldo descargado: ${plants.length} plantas, con sus fotos y ubicaciones guardadas.`;
  } catch (error) {
    status.textContent = `No se pudo guardar el respaldo: ${error.message}`;
  } finally {
    setBusy(false);
  }
});

fileInput.addEventListener('change', async () => {
  pendingBackup = null;
  preview.hidden = true;
  status.textContent = '';
  restoreButton.disabled = true;
  const file = fileInput.files[0];
  if (!file) return;
  setBusy(true);
  try {
    pendingBackup = readBackup(await file.text());
    preview.textContent = `${pendingBackup.plants.length} plantas listas para restaurar, con sus fotos y ubicaciones.`;
    preview.hidden = false;
  } catch (error) {
    status.textContent = `No se pudo leer el respaldo: ${error.message}`;
  } finally {
    setBusy(false);
  }
});

restoreButton.addEventListener('click', async () => {
  if (busy || !pendingBackup) return;
  if (!window.confirm(`¿Reemplazar la colección de este navegador con las ${pendingBackup.plants.length} plantas del respaldo?`)) return;
  setBusy(true);
  status.textContent = 'Restaurando respaldo…';
  try {
    await replacePlants(pendingBackup.plants);
    let houseRestored = true;
    try {
      if (pendingBackup.housePosition) localStorage.setItem(HOUSE_POSITION_KEY, JSON.stringify(pendingBackup.housePosition));
      else localStorage.removeItem(HOUSE_POSITION_KEY);
    } catch {
      houseRestored = false;
    }
    status.textContent = houseRestored
      ? 'Respaldo restaurado. Abrí Plantas o Mapa para ver tu colección; recargá las otras pestañas si estaban abiertas.'
      : 'Plantas y fotos restauradas. No se pudo guardar la posición de la casa; podés ubicarla de nuevo en Mapa.';
    pendingBackup = null;
    preview.hidden = true;
    fileInput.value = '';
  } catch (error) {
    status.textContent = `No se pudo restaurar el respaldo: ${error.message}`;
  } finally {
    setBusy(false);
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
