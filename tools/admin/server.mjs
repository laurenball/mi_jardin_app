// Local content editor for the garden guide. Run with: npm run admin
// Binds to localhost only. Nothing here ships with the app.
import {createServer} from 'node:http';
import {readFile, writeFile, unlink, readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const CONTENT = path.join(ROOT, 'content', 'plants');
const PHOTO_DIR = path.join(ROOT, 'assets', 'plants');
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY = 24 * 1024 * 1024;

const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,60}$/;
const SAFE_FILE = /^[a-z0-9][a-z0-9-]{0,60}\.jpg$/;

const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {'content-type': type, 'cache-control': 'no-store'});
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

async function listPlants() {
  const names = (await readdir(CONTENT)).filter(name => name.endsWith('.json'));
  const plants = await Promise.all(names.map(async name =>
    JSON.parse(await readFile(path.join(CONTENT, name), 'utf8'))));
  const order = JSON.parse(await readFile(path.join(ROOT, 'content', 'order.json'), 'utf8')).order;
  plants.sort((a, b) => {
    const ia = order.indexOf(a.slug), ib = order.indexOf(b.slug);
    return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib) || a.slug.localeCompare(b.slug);
  });
  return plants;
}

async function writePlant(plant) {
  if (!SAFE_SLUG.test(plant.slug || '')) throw new Error(`Bad slug: ${plant.slug}`);
  const file = path.join(CONTENT, `${plant.slug}.json`);
  await writeFile(file, JSON.stringify(plant, null, 2) + '\n');
  const orderFile = path.join(ROOT, 'content', 'order.json');
  const order = JSON.parse(await readFile(orderFile, 'utf8')).order;
  if (!order.includes(plant.slug)) {
    order.push(plant.slug);
    await writeFile(orderFile, JSON.stringify({order}, null, 2) + '\n');
  }
}

async function nextPhotoName(slug) {
  const existing = new Set(await readdir(PHOTO_DIR));
  for (let n = 1; n < 200; n++) {
    const name = `${slug}-${n}.jpg`;
    if (!existing.has(name)) return name;
  }
  throw new Error('Too many photos for one plant');
}

async function unreferencedPhotos() {
  const plants = await listPlants();
  const used = new Set(plants.flatMap(plant => (plant.photos || []).map(photo => photo.file)));
  return (await readdir(PHOTO_DIR)).filter(name => name.endsWith('.jpg') && !used.has(name));
}

async function serveStatic(res, filePath, fallbackDir) {
  const full = path.join(fallbackDir, filePath);
  if (!full.startsWith(fallbackDir) || !existsSync(full)) return send(res, 404, {error: 'Not found'});
  send(res, 200, await readFile(full), TYPES[path.extname(full)] || 'application/octet-stream');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = decodeURIComponent(url.pathname);
  try {
    if (req.method === 'GET' && (route === '/' || route === '/index.html')) {
      return serveStatic(res, 'index.html', HERE);
    }
    if (req.method === 'GET' && route.startsWith('/assets/plants/')) {
      return serveStatic(res, path.basename(route), PHOTO_DIR);
    }
    if (req.method === 'GET' && route === '/api/plants') {
      return send(res, 200, {plants: await listPlants(), orphans: await unreferencedPhotos()});
    }
    if (req.method === 'PUT' && route.startsWith('/api/plants/')) {
      const plant = await readBody(req);
      if (plant.slug !== route.slice('/api/plants/'.length)) return send(res, 400, {error: 'Slug mismatch'});
      await writePlant(plant);
      return send(res, 200, {ok: true, built: await build()});
    }
    if (req.method === 'DELETE' && route.startsWith('/api/plants/')) {
      const slug = route.slice('/api/plants/'.length);
      if (!SAFE_SLUG.test(slug)) return send(res, 400, {error: 'Bad slug'});
      const plant = JSON.parse(await readFile(path.join(CONTENT, `${slug}.json`), 'utf8'));
      await unlink(path.join(CONTENT, `${slug}.json`));
      for (const photo of plant.photos || []) {
        if (SAFE_FILE.test(photo.file) && existsSync(path.join(PHOTO_DIR, photo.file))) {
          await unlink(path.join(PHOTO_DIR, photo.file));
        }
      }
      const orderFile = path.join(ROOT, 'content', 'order.json');
      const order = JSON.parse(await readFile(orderFile, 'utf8')).order.filter(item => item !== slug);
      await writeFile(orderFile, JSON.stringify({order}, null, 2) + '\n');
      return send(res, 200, {ok: true, built: await build()});
    }
    if (req.method === 'POST' && route.startsWith('/api/photos/')) {
      const slug = route.slice('/api/photos/'.length);
      if (!SAFE_SLUG.test(slug)) return send(res, 400, {error: 'Bad slug'});
      const {dataUrl} = await readBody(req);
      const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
      if (!match) return send(res, 400, {error: 'Expected a JPEG data URL'});
      const name = await nextPhotoName(slug);
      await writeFile(path.join(PHOTO_DIR, name), Buffer.from(match[1], 'base64'));
      return send(res, 200, {file: name});
    }
    if (req.method === 'DELETE' && route.startsWith('/api/photos/')) {
      const file = path.basename(route);
      if (!SAFE_FILE.test(file)) return send(res, 400, {error: 'Bad file name'});
      if (existsSync(path.join(PHOTO_DIR, file))) await unlink(path.join(PHOTO_DIR, file));
      return send(res, 200, {ok: true});
    }
    if (req.method === 'POST' && route === '/api/build') {
      return send(res, 200, {built: await build()});
    }
    return send(res, 404, {error: 'Not found'});
  } catch (error) {
    send(res, 500, {error: error.message});
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Editor de contenido del sanctuario / Garden content editor: http://localhost:${PORT}`);
  console.log('Edits write to content/plants and assets/plants, then rebuild the app files.');
});
