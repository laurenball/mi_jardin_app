// The order here is the garden's initial visit order. Groups retain that order within each section.
const BIRDS = [
  {name:'Chingolo', scientific:'Zonotrichia capensis', slug:'chingolo', group:'Semillas', diet:'Semillas e insectos', photo:321114171, code:'rucspa1',
    food:'Busca semillas en el suelo y entre los pastos. También come insectos, sobre todo cuando abundan.',
    identify:'Pequeño, con cabeza gris rayada y un collar castaño detrás del cuello. Suele moverse por el suelo y los arbustos bajos.'},
  {name:'Benteveo', scientific:'Pitangus sulphuratus', slug:'benteveo', group:'Alimentos variados', diet:'Insectos, frutos y más', photo:302089971, code:'grekis',
    food:'Come insectos y frutos, entre otros alimentos. Busca comida en el suelo, el follaje y el aire.',
    identify:'Pecho amarillo, cabeza negra con cejas blancas y un llamado fuerte que suena como su nombre.'},
  {name:'Chimango', scientific:'Daptrius chimango', slug:'chimango', group:'Carroña y presas', diet:'Carroña y pequeños animales', photo:647620977, code:'chicar1',
    food:'Aprovecha carroña y también captura insectos y otros animales pequeños.',
    identify:'Rapaz parda que suele caminar por el suelo y buscar alimento en espacios abiertos.'},
  {name:'Picaflor verde', scientific:'Chlorostilbon lucidus', slug:'picaflor-verde', group:'Néctar', diet:'Néctar e insectos', photo:609791089, code:'glbeme1',
    food:'Visita flores para beber néctar. También captura pequeños insectos y arañas.',
    identify:'El macho luce verde iridiscente y tiene el pico rojo con punta negra; la hembra es más pálida por debajo.'},
  {name:'Tero', scientific:'Vanellus chilensis', slug:'tero', group:'Insectos y otros invertebrados', diet:'Insectos y lombrices', photo:245238091, code:'soulap1',
    food:'Recorre pastizales y céspedes para buscar insectos, lombrices y otros invertebrados.',
    identify:'Patas largas, pecho negro y vientre blanco. Su voz fuerte suele delatarlo antes de verlo.'},
  {name:'Torcaza', scientific:'Zenaida auriculata', slug:'torcaza', group:'Semillas', diet:'Semillas', photo:56643551, code:'eardov1',
    food:'Come principalmente semillas que recoge del suelo.',
    identify:'Paloma esbelta de tonos pardogrisáceos, con pequeñas manchas negras en las alas y el cuello.'},
  {name:'Paloma picazuro', scientific:'Patagioenas picazuro', slug:'paloma-picazuro', group:'Semillas', diet:'Semillas y frutos', photo:74648461, code:'picpig2',
    food:'Busca semillas y frutos en árboles y en el suelo.',
    identify:'Paloma grande y robusta, con un parche claro y escamado en los lados del cuello.'},
  {name:'Zorzal colorado', scientific:'Turdus rufiventris', slug:'zorzal-colorado', group:'Alimentos variados', diet:'Frutos e invertebrados', photo:618569771, code:'rubthr1',
    food:'Come frutos, lombrices e insectos; a menudo busca alimento entre la hojarasca.',
    identify:'Dorso pardo y vientre anaranjado. Su canto melodioso se oye con frecuencia al amanecer.'},
  {name:'Hornero', scientific:'Furnarius rufus', slug:'hornero', group:'Insectos y otros invertebrados', diet:'Insectos y otros invertebrados', photo:95490411, code:'rufhor2',
    food:'Camina por el suelo buscando insectos y otros pequeños invertebrados.',
    identify:'Pardo rojizo con garganta clara. Construye su característico nido de barro en ramas o estructuras.'},
  {name:'Cotorra', scientific:'Myiopsitta monachus', slug:'cotorra', group:'Semillas', diet:'Semillas, frutos y brotes', photo:71547631, code:'monpar',
    food:'Come semillas, frutos, brotes y otras partes vegetales.',
    identify:'Verde brillante con cara y pecho grisáceos. Varias parejas pueden compartir un gran nido de palitos.'},
  {name:'Calandria grande', scientific:'Mimus saturninus', slug:'calandria-grande', group:'Alimentos variados', diet:'Insectos y frutos', photo:352671251, code:'chbmoc1',
    food:'Busca insectos y frutos en arbustos, árboles y en el suelo.',
    identify:'Gris parduzca, con ceja clara y cola larga. Su canto incluye muchas frases distintas.'},
  {name:'Ratona', scientific:'Troglodytes musculus', slug:'ratona', group:'Insectos y otros invertebrados', diet:'Pequeños invertebrados', photo:623004860, code:'houwre4',
    food:'Revisa ramas, rincones y enredaderas en busca de insectos y arañas.',
    identify:'Muy pequeña y parda, con cola corta que suele mantener levantada.'},
  {name:'Tordo renegrido', scientific:'Molothrus bonariensis', slug:'tordo-renegrido', group:'Semillas', diet:'Semillas e insectos', photo:245438551, code:'shicow',
    food:'Recoge semillas e insectos, especialmente en el suelo.',
    identify:'El macho es negro con brillo violáceo; la hembra es parda. Pone sus huevos en nidos de otras aves.'},
  {name:'Tordo músico', scientific:'Agelaioides badius', slug:'tordo-musico', group:'Semillas', diet:'Semillas e insectos', photo:181040551, code:'bawcow4',
    food:'Come semillas e insectos, y suele alimentarse en pequeños grupos.',
    identify:'Pardo grisáceo, con alas y cola de tono castaño rojizo. Macho y hembra se parecen.'},
  {name:'Golondrina doméstica', scientific:'Progne chalybea', slug:'golondrina-domestica', group:'Insectos y otros invertebrados', diet:'Insectos voladores', photo:629454005, code:'gybmar',
    food:'Captura insectos en vuelo sobre espacios abiertos.',
    identify:'Golondrina grande, azul oscura por encima y grisácea por debajo; suele posarse en cables y edificios.'},
  {name:'Jilguero dorado', scientific:'Sicalis flaveola', slug:'jilguero-dorado', group:'Semillas', diet:'Semillas', photo:55142651, code:'saffin',
    food:'Busca semillas de pastos y otras herbáceas.',
    identify:'El macho es amarillo intenso con frente anaranjada; la hembra es más apagada y estriada.'},
  {name:'Carpintero real', scientific:'Colaptes melanochloros', slug:'carpintero-real', group:'Insectos y otros invertebrados', diet:'Insectos y larvas', photo:335603721, code:'grbwoo3',
    food:'Explora troncos y ramas para capturar insectos y larvas.',
    identify:'Dorso verdoso barrado, vientre moteado y una mancha roja en la cabeza.'},
  {name:'Picaflor bronceado', scientific:'Hylocharis chrysura', slug:'picaflor-bronceado', group:'Néctar', diet:'Néctar e insectos', photo:253826921, code:'gilhum1',
    food:'Visita flores para obtener néctar y también consume pequeños insectos.',
    identify:'Picaflor verdoso con brillo cobrizo y cola dorada o bronceada; el pico es rojo con la punta negra.'},
  {name:'Chinchero chico', scientific:'Lepidocolaptes angustirostris', slug:'chinchero-chico', group:'Insectos y otros invertebrados', diet:'Insectos y arañas', photo:660215282, code:'nabwoo1',
    food:'Trepa por los troncos y revisa la corteza en busca de insectos y arañas.',
    identify:'Pardo, con estrías claras y pico fino curvado hacia abajo; usa la cola como apoyo al trepar.'},
  {name:'Pitiayumí', scientific:'Setophaga pitiayumi', slug:'pitiayumi', group:'Insectos y otros invertebrados', diet:'Pequeños insectos', photo:386925251, code:'tropar',
    food:'Busca insectos pequeños entre las hojas y las ramas de los árboles.',
    identify:'Pequeño y activo; luce dorso azul grisáceo, espalda verdosa, pecho amarillo y barras blancas en las alas.'}
];

const guide = document.querySelector('#bird-guide');
const groups = new Map();
for (const [index, bird] of BIRDS.entries()) {
  if (!groups.has(bird.group)) groups.set(bird.group, []);
  groups.get(bird.group).push({...bird, rank:index + 1});
}

for (const [index, [name, birds]] of [...groups].entries()) {
  const section = document.createElement('section');
  section.className = 'plant-group';
  const headingId = `bird-group-${index + 1}`;
  section.setAttribute('aria-labelledby', headingId);
  const heading = document.createElement('h2');
  heading.className = 'group-heading';
  heading.id = headingId;
  heading.textContent = name;
  const items = document.createElement('div');
  items.className = 'plant-group-items';
  for (const bird of birds) {
    const card = document.createElement('article');
    card.className = 'bird-card';
    card.innerHTML = `
      <img class="bird-photo" src="./assets/birds/${bird.slug}.jpg" alt="${bird.name}" loading="lazy" decoding="async" width="160" height="160" />
      <div class="bird-card-body">
        <div class="bird-card-heading"><div><p class="bird-rank">${bird.rank} · Orden de visitas</p><h3>${bird.name}</h3><p class="scientific">${bird.scientific}</p></div><span class="detail-type">${bird.diet}</span></div>
        <p>${bird.food}</p>
        <details class="bird-details"><summary>Cómo reconocerlo</summary><p>${bird.identify}</p><p class="bird-source">Identificación: <a href="https://ebird.org/species/${bird.code}" target="_blank" rel="noopener noreferrer">eBird / Merlin</a> · Foto: <a href="https://macaulaylibrary.org/asset/${bird.photo}" target="_blank" rel="noopener noreferrer">Macaulay Library ML${bird.photo}</a></p></details>
      </div>`;
    items.append(card);
  }
  section.append(heading, items);
  guide.append(section);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
