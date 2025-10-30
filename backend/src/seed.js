require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Edition = require('./models/Edition');

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

  // Events
  if ((await Event.countDocuments()) === 0) {
    const now = new Date();
    const in10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await Event.create([
      { titulo: 'Media Maratón GESport 21K', descripcion: 'Circuito urbano', fecha: in30, lugar: 'Ciudad', categoria: 'CARRERA', afiche: '', cupos: 500, precio: 20, activo: true },
      { titulo: 'Entrenamiento Grupal', descripcion: 'Ritmo progresivo', fecha: in10, lugar: 'Parque Central', categoria: 'ENTRENAMIENTO', afiche: '', cupos: 50, precio: 0, activo: true },
    ]);
    console.log('Seeded events');
  }

  // Editions
  if ((await Edition.countDocuments()) === 0) {
    await Edition.create([
      {
        slug: 'edicion-2023',
        anio: 2023,
        fecha: '2023-09-10',
        lugar: 'Ciudad',
        descripcion: 'Una edición inolvidable con más de 2000 corredores.',
        imagenPortada: 'https://picsum.photos/seed/gesport2023/1200/600',
        galeria: [
          'https://picsum.photos/seed/gesport2023a/800/600',
          'https://picsum.photos/seed/gesport2023b/800/600',
          'https://picsum.photos/seed/gesport2023c/800/600'
        ],
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
        imagenPortada: 'https://picsum.photos/seed/gesport2022/1200/600',
        galeria: [
          'https://picsum.photos/seed/gesport2022a/800/600',
          'https://picsum.photos/seed/gesport2022b/800/600'
        ],
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

  await mongoose.disconnect();
  console.log('Seed completed.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
