// Reports on the state of the content. Run with: npm run check
import {readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadPlants} from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO_DIR = path.join(ROOT, 'assets', 'plants');
const BUDGET_KB = 200;

const plants = await loadPlants();
const fruitSizeGroups = new Set(['Naturally small', 'Easy to keep small', 'Needs regular pruning', 'Needs space']);
const incompleteFruitSizes = plants.filter(plant => plant.layer === 'Fruit tree'
  && (!fruitSizeGroups.has(plant.fruitSizeGroup) || !plant.size || !plant.sizeManagement));
const canopySizeGroups = new Set(['Small', 'Medium', 'Large']);
const incompleteCanopySizes = plants.filter(plant => plant.layer === 'Canopy'
  && (!canopySizeGroups.has(plant.canopySizeGroup) || !plant.size || !plant.sizeManagement));
const used = new Map();
for (const plant of plants) for (const photo of plant.photos || []) used.set(photo.file, plant);

const files = (await readdir(PHOTO_DIR)).filter(name => name.endsWith('.jpg'));
const sizes = new Map();
let total = 0;
for (const file of files) {
  const {size} = await stat(path.join(PHOTO_DIR, file));
  sizes.set(file, size);
  total += size;
}

const noPhotos = plants.filter(plant => !(plant.photos || []).length);
const onePhoto = plants.filter(plant => (plant.photos || []).length === 1);
const missingFiles = [...used.keys()].filter(file => !sizes.has(file));
const orphans = files.filter(file => !used.has(file));
const heavy = files.filter(file => sizes.get(file) > BUDGET_KB * 1024)
  .map(file => `${file} (${Math.round(sizes.get(file) / 1024)} KB)`);

const line = (label, value) => console.log(`  ${String(label).padEnd(26)} ${value}`);
console.log('\nContent');
line('plants', plants.length);
line('photos', used.size);
line('photo files on disk', files.length);
line('total photo weight', `${(total / 1024 / 1024).toFixed(1)} MB`);

const report = (label, items, hint) => {
  console.log(`\n${label}: ${items.length === 0 ? 'none' : items.length}`);
  for (const item of items) console.log(`  ${item}`);
  if (items.length > 0 && hint) console.log(`  → ${hint}`);
};

report('Plants with no photo', noPhotos.map(p => p.commonName), 'add one in the editor');
report('Frutales missing size guidance', incompleteFruitSizes.map(p => p.commonName), 'set size, fruitSizeGroup and sizeManagement');
report('Dosel missing size guidance', incompleteCanopySizes.map(p => p.commonName), 'set size, canopySizeGroup and sizeManagement');
report('Plants with only one photo', onePhoto.map(p => p.commonName), 'a second view helps identification');
report('Referenced files that are missing', missingFiles, 'the build will fail until these are fixed');
report('Files nothing references', orphans, 'safe to delete');
report(`Photos over ${BUDGET_KB} KB`, heavy, 'only worth caring about if the offline download gets slow');

const problems = missingFiles.length + noPhotos.length + incompleteFruitSizes.length + incompleteCanopySizes.length;
console.log(problems === 0 ? '\nNothing broken.\n' : `\n${problems} thing(s) need fixing.\n`);
if (problems) process.exitCode = 1;
