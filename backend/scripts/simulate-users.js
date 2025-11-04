#!/usr/bin/env node
/*
Simulador de usuarios: registra/login usuarios y los inscribe en eventos futuros usando el API.
Requisitos:
- Backend corriendo (por defecto http://localhost:4000)
- Node 18+ (usa fetch nativo)
Uso:
  BASE_URL=http://localhost:4000 node scripts/simulate-users.js
Opcionales (env):
  USERS=15           # cantidad de usuarios a simular (default 8)
  ENROLLS_PER_USER=1 # inscripciones por usuario (default 1)
*/

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const USERS = parseInt(process.env.USERS || '8', 10);
const ENROLLS_PER_USER = parseInt(process.env.ENROLLS_PER_USER || '1', 10);

function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n, w) { return String(n).padStart(w, '0'); }

function randomBirthDate() {
  const year = randInt(1975, 2005);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${year}-${pad(month,2)}-${pad(day,2)}`;
}

async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const url = `${BASE_URL}${path}`;
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text}`);
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}

async function fetchEvents() {
  const list = await api('/events');
  const future = list.filter(ev => ev.activo !== false && ev.fecha && new Date(ev.fecha).getTime() > Date.now());
  if (!future.length) throw new Error('No hay eventos futuros activos para inscribir.');
  return future;
}

function buildUser(i) {
  const names = ['Juan','María','Sofía','Lucas','Diego','Ana','Carla','Leo','Julieta','Nicolás','Bruno','Flor'];
  const last = ['Gómez','Benítez','Ramírez','Acosta','Rojas','Fernández','López','Martínez','Pereyra','Sosa'];
  const nombre = randPick(names);
  const apellido = randPick(last);
  const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}.${i}@sim.gesport.test`;
  const contrasenia = 'gesport123';
  return { nombre, apellido, email, contrasenia };
}

function buildForm() {
  return {
    dni: String(randInt(20000000, 50000000)),
    fechaNacimiento: randomBirthDate(),
    genero: randPick(['M','F','X']),
    tallaRemera: randPick(['XS','S','M','L','XL','XXL']),
    emergencia: { nombre: 'Contacto Emergencia', telefono: `3704${randInt(100000, 999999)}` },
    aceptoTerminos: true,
    aceptoDescargo: true,
    club: randPick(['Libre','GESport','Formosa Runners','No Aplica']),
    ciudad: randPick(['Formosa','Clorinda','Resistencia','Corrientes']),
    pais: 'AR',
  };
}

async function ensureSignup(user) {
  try {
    await api('/auth/signup', { method: 'POST', body: user });
    console.log(`+ signup OK: ${user.email}`);
  } catch (e) {
    if (e.status === 409) {
      console.log(`= signup existe: ${user.email}`);
    } else {
      console.warn(`! signup fallo: ${user.email} -> ${e.message}`);
    }
  }
}

async function signin(email, contrasenia) {
  const { token, user } = await api('/auth/signin', { method: 'POST', body: { email, contrasenia } });
  return { token, user };
}

async function enroll(token, eventId) {
  const form = buildForm();
  try {
    const enr = await api('/enrollments', { method: 'POST', token, body: { evento_id: eventId, form } });
    return { ok: true, id: enr._id };
  } catch (e) {
    if (e.status === 409) {
      return { ok: false, reason: 'duplicado' };
    }
    return { ok: false, reason: e.message };
  }
}

async function main() {
  console.log(`Simulador apuntando a ${BASE_URL}`);
  const events = await fetchEvents();
  console.log(`Eventos futuros activos: ${events.map(e => `${e.titulo}(${e._id})`).join(', ')}`);

  let created = 0, logged = 0, inscOK = 0, inscDup = 0, inscErr = 0;

  for (let i = 0; i < USERS; i++) {
    const u = buildUser(i);
    await ensureSignup(u);
    created++;
    let token;
    try {
      const s = await signin(u.email, u.contrasenia);
      token = s.token; logged++;
    } catch (e) {
      console.warn(`! signin fallo: ${u.email} -> ${e.message}`);
      continue;
    }

    // elegir eventos al azar para este usuario
    const bag = [...events].sort(() => Math.random() - 0.5).slice(0, ENROLLS_PER_USER);
    for (const ev of bag) {
      const r = await enroll(token, ev._id);
      if (r.ok) { inscOK++; console.log(`✓ ${u.email} inscripto en ${ev.titulo}`); }
      else if (r.reason === 'duplicado') { inscDup++; console.log(`= duplicado ${u.email} en ${ev.titulo}`); }
      else { inscErr++; console.log(`× error inscribiendo ${u.email} en ${ev.titulo}: ${r.reason}`); }
    }
  }

  console.log('\nResumen simulación');
  console.log(`Usuarios preparados: ${created}, logueados: ${logged}`);
  console.log(`Inscripciones OK: ${inscOK}, duplicadas: ${inscDup}, errores: ${inscErr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
