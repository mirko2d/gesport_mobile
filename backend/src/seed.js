require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Edition = require('./models/Edition');
const Result = require('./models/Result');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gesport';

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: 'gesport' });
  console.log('MongoDB connected for seeding');

  // Superadmin desde variables de entorno (no hardcodear credenciales)
  const saEmail = process.env.SUPERADMIN_EMAIL;
  const saPass = process.env.SUPERADMIN_PASSWORD;
  const saNombre = process.env.SUPERADMIN_NAME || 'Super';
  const saApellido = process.env.SUPERADMIN_LASTNAME || 'Admin';
  if (saEmail && saPass) {
    let sa = await User.findOne({ email: saEmail });
    if (!sa) {
      sa = await User.create({ nombre: saNombre, apellido: saApellido, email: saEmail, contrasenia: saPass, role: 'superadmin' });
      console.log('Superadmin creado:', saEmail);
    } else {
      sa.nombre = saNombre;
      sa.apellido = saApellido;
      sa.role = 'superadmin';
      sa.contrasenia = saPass; // se hashea en pre('save')
      await sa.save();
      console.log('Superadmin actualizado:', saEmail);
    }
  } else {
    console.log('SUPERADMIN_EMAIL y/o SUPERADMIN_PASSWORD no definidos; no se creó superadmin.');
  }

  // Admin desde variables de entorno (opcional)
  const adEmail = process.env.ADMIN_EMAIL;
  const adPass = process.env.ADMIN_PASSWORD;
  const adNombre = process.env.ADMIN_NAME || 'Admin';
  const adApellido = process.env.ADMIN_LASTNAME || 'App';
  if (adEmail && adPass) {
    let ad = await User.findOne({ email: adEmail });
    if (!ad) {
      ad = await User.create({ nombre: adNombre, apellido: adApellido, email: adEmail, contrasenia: adPass, role: 'admin' });
      console.log('Admin creado:', adEmail);
    } else {
      ad.nombre = adNombre;
      ad.apellido = adApellido;
      ad.role = 'admin';
      ad.contrasenia = adPass;
      await ad.save();
      console.log('Admin actualizado:', adEmail);
    }
  }

  // Usuarios demo opcionales (solo si SEED_DEMO_USERS=1)
  if (process.env.SEED_DEMO_USERS === '1') {
    const demos = [
      { nombre: 'Ana', apellido: 'Admin', email: 'admin@gesport.test', contrasenia: 'admin123', role: 'admin' },
      { nombre: 'Juan', apellido: 'Pérez', email: 'user@gesport.test', contrasenia: 'user123', role: 'user' },
    ];
    for (const du of demos) {
      const ex = await User.findOne({ email: du.email });
      if (ex) {
        ex.nombre = du.nombre; ex.apellido = du.apellido; ex.role = du.role; ex.contrasenia = du.contrasenia; await ex.save();
      } else {
        await User.create(du);
      }
    }
    console.log('Usuarios demo listos (SEED_DEMO_USERS=1)');
  }

  // Eventos: agregar Costanera de Formosa con imágenes
  const ensureEvent = async (payload) => {
    const exists = await Event.findOne({ titulo: payload.titulo });
    if (exists) return exists;
    return Event.create(payload);
  };

  const now = new Date();
  const in12 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
  const in25 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // Imágenes de referencia de gente corriendo / costanera (libres de uso de Unsplash)
  const runningImgs = [
    'https://images.unsplash.com/photo-1546484959-f90638d2fc01?q=80&w=1200&auto=format&fit=crop', // grupo corriendo
    'https://images.unsplash.com/photo-1517504734586-058f9b133ff8?q=80&w=1200&auto=format&fit=crop', // corredor en ruta
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?q=80&w=1200&auto=format&fit=crop', // jogging atardecer
    'https://images.unsplash.com/photo-1526405074750-76fce69379e6?q=80&w=1200&auto=format&fit=crop', // grupo urbano
    'https://images.unsplash.com/photo-1508606572321-901ea443707f?q=80&w=1200&auto=format&fit=crop', // pista atletismo
    'https://images.unsplash.com/photo-1517837016564-cb6f2b1e56a0?q=80&w=1200&auto=format&fit=crop', // zapatillas running
  ];

  const evMaraton = await ensureEvent({
    titulo: 'Maratón Costanera de Formosa 2025',
    descripcion: 'Recorrido bordeando la Costanera de Formosa. Largada y llegada sobre la Av. Costanera.',
    fecha: yesterday,
    lugar: 'Costanera de Formosa',
    categoria: 'CARRERA',
    afiche: runningImgs[0],
    cupos: 2000,
    precio: 0,
    activo: true,
  });

  // Opcional: no crear eventos extra (solo maratón)
  console.log('Evento principal de la Costanera listo');

  // Editions
  if ((await Edition.countDocuments()) === 0) {
    await Edition.create([
      {
        slug: 'edicion-2023',
        anio: 2023,
        fecha: '2023-09-10',
        lugar: 'Ciudad',
        descripcion: 'Una edición inolvidable con más de 2000 corredores.',
        imagenPortada: runningImgs[3],
        galeria: [runningImgs[3], runningImgs[4], runningImgs[5]],
        carreras: [
          {
            nombre: '21K',
            horaInicio: '07:00',
            clima: 'Soleado 18°C',
            top10: Array.from({ length: 10 }).map((_, i) => ({ posicion: i + 1, nombre: `Atleta ${i + 1}`, tiempo: `1:${10 + i}:0${i}`, dorsal: `${100 + i}`, categoria: 'General', pais: 'AR' })),
          },
          {
            nombre: '10K',
            horaInicio: '09:30',
            clima: 'Soleado 20°C',
            top10: Array.from({ length: 10 }).map((_, i) => ({ posicion: i + 1, nombre: `Corredor ${i + 1}`, tiempo: `0:${35 + i}:2${i}`, dorsal: `${200 + i}`, categoria: 'General', pais: 'AR' })),
          },
        ],
        infoExtra: 'Auspiciado por GESport. Hidratación en km 5/10/15.'
      },
      {
        slug: 'edicion-2022',
        anio: 2022,
        fecha: '2022-09-11',
        lugar: 'Ciudad',
        descripcion: 'Regreso a las calles con récord de participación.',
        imagenPortada: runningImgs[4],
        galeria: [runningImgs[4], runningImgs[5]],
        carreras: [
          {
            nombre: '21K',
            horaInicio: '07:30',
            clima: 'Nublado 16°C',
            top10: Array.from({ length: 10 }).map((_, i) => ({ posicion: i + 1, nombre: `Atleta ${i + 1}`, tiempo: `1:${12 + i}:1${i}`, dorsal: `${300 + i}`, categoria: 'General', pais: 'AR' })),
          }
        ],
        infoExtra: 'Recorrido homologado AIMS.'
      }
    ]);
    console.log('Seeded editions');
  }

  // Opcional: actualizar imágenes de eventos existentes si SEED_UPDATE_IMAGES=1
  if (process.env.SEED_UPDATE_IMAGES === '1') {
    const updates = [
      { titulo: 'Maratón Costanera de Formosa 2025', afiche: runningImgs[0] },
    ];
    for (const u of updates) {
      await Event.findOneAndUpdate({ titulo: u.titulo }, { $set: { afiche: u.afiche } });
    }
    console.log('Actualizadas imágenes de eventos (SEED_UPDATE_IMAGES=1)');
  }

  // Limpieza: eliminar eventos extra creados previamente (entrenamientos u otros de demo)
  const toRemoveTitles = [
    'Nocturna 10K Costanera',
    'Entrenamiento en la Costanera',
  ];
  const removed = await Event.deleteMany({ titulo: { $in: toRemoveTitles } });
  if (removed?.deletedCount) {
    console.log(`Eventos de demo eliminados: ${removed.deletedCount}`);
  }

  // Opcional: actualizar imágenes de ediciones existentes si SEED_UPDATE_EDITION_IMAGES=1
  if (process.env.SEED_UPDATE_EDITION_IMAGES === '1') {
    const eds = await Edition.find().lean();
    for (const [i, ed] of eds.entries()) {
      const portada = runningImgs[(i + 3) % runningImgs.length];
      const galeria = [runningImgs[(i + 3) % runningImgs.length], runningImgs[(i + 4) % runningImgs.length], runningImgs[(i + 5) % runningImgs.length]];
      await Edition.findByIdAndUpdate(ed._id, { $set: { imagenPortada: portada, galeria } });
    }
    console.log('Actualizadas imágenes de ediciones (SEED_UPDATE_EDITION_IMAGES=1)');
  }

  // Usuarios y resultados de la maratón
  const runners = [
    { nombre: 'María', apellido: 'Gómez', email: 'maria.gomez@gesport.test', contrasenia: 'gesport123' },
    { nombre: 'José', apellido: 'Benítez', email: 'jose.benitez@gesport.test', contrasenia: 'gesport123' },
    { nombre: 'Lucas', apellido: 'Ramírez', email: 'lucas.ramirez@gesport.test', contrasenia: 'gesport123' },
    { nombre: 'Sofía', apellido: 'Acosta', email: 'sofia.acosta@gesport.test', contrasenia: 'gesport123' },
    { nombre: 'Diego', apellido: 'Rojas', email: 'diego.rojas@gesport.test', contrasenia: 'gesport123' },
  ];

  const createdUsers = [];
  for (const ru of runners) {
    let u = await User.findOne({ email: ru.email });
    if (!u) u = await User.create(ru);
    createdUsers.push(u);
  }

  // Crear resultados si no existen para este evento
  const existingResults = await Result.countDocuments({ event: evMaraton._id });
  if (existingResults === 0) {
    const baseFinish = new Date(evMaraton.fecha || new Date());
    const resultsPayload = createdUsers.map((u, idx) => ({
      event: evMaraton._id,
      user: u._id,
      position: idx + 1,
      dorsal: String(100 + idx),
      timeMs: (60 * 60 * 1000) + idx * 90 * 1000, // ~1:00:00 + 1:30 min
      finishedAt: new Date(baseFinish.getTime() + (idx + 60) * 60 * 1000),
      note: 'Llegada oficial',
    }));
    await Result.insertMany(resultsPayload);
    console.log('Resultados de maratón cargados');
  } else {
    console.log('Resultados existentes para maratón; no se duplican');
  }

  await mongoose.disconnect();
  console.log('Seed completed.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
