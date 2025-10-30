// Centraliza aquí las ediciones anteriores para mantenerlas en un solo lugar
// Puedes usar URLs o require() desde assets/images

export type RaceItem = {
  id: string; // ej: '5k', '10k'
  name: string; // nombre visible, ej: '5K Recreativa'
  distanceKm: number;
  participants?: number;
  winnerMale?: { name: string; time: string };
  winnerFemale?: { name: string; time: string };
  image?: any; // opcional: portada específica de la carrera
  results?: Array<{ position: number; name: string; time: string }>; // top 10
};

export type EditionItem = {
  id: string; // slug único para routing, ej: 'gesport-2025'
  year: string;
  image: any; // string URL o require(local)
  description: string;
  races?: RaceItem[]; // carreras de esa edición
  location?: string;
  startTime?: string;
  weather?: string;
  gallery?: any[];
  date?: string; // fecha del evento, p.ej. 'Domingo, 25 de Agosto 2025'
  info?: string; // texto libre con información adicional
};

export const PAST_EDITIONS: EditionItem[] = [
  {
    id: 'gesport-2025',
    year: 'GeSPORT 2025',
    image: require('../assets/images/edition1.jpeg'),
    description:
      'Una edición marcada por récords personales y un ambiente inolvidable en cada kilómetro.',
    races: [
      { id: '5k', name: '5K Recreativa', distanceKm: 5, participants: 3200, winnerMale: { name: 'J. Pérez', time: '00:16:42' }, winnerFemale: { name: 'L. García', time: '00:19:05' } },
      { id: '10k', name: '10K Competitiva', distanceKm: 10, participants: 2100, winnerMale: { name: 'M. Ruiz', time: '00:31:10' }, winnerFemale: { name: 'A. Torres', time: '00:36:48' }, results: [
        { position: 1, name: 'M. Ruiz', time: '00:31:10' },
        { position: 2, name: 'D. Vargas', time: '00:31:35' },
        { position: 3, name: 'S. Molina', time: '00:32:02' },
        { position: 4, name: 'H. Cárdenas', time: '00:32:18' },
        { position: 5, name: 'L. Prieto', time: '00:32:41' },
        { position: 6, name: 'R. Acosta', time: '00:33:05' },
        { position: 7, name: 'E. Méndez', time: '00:33:22' },
        { position: 8, name: 'P. Gómez', time: '00:33:40' },
        { position: 9, name: 'K. Silva', time: '00:34:02' },
        { position: 10, name: 'J. Torres', time: '00:34:20' },
      ] },
      { id: '21k', name: 'Media Maratón 21K', distanceKm: 21, participants: 1400, winnerMale: { name: 'C. Gómez', time: '01:07:55' }, winnerFemale: { name: 'P. Silva', time: '01:16:23' }, results: [
        { position: 1, name: 'C. Gómez', time: '01:07:55' },
        { position: 2, name: 'A. Roldán', time: '01:08:30' },
        { position: 3, name: 'J. Hernández', time: '01:09:10' },
        { position: 4, name: 'N. Ortega', time: '01:09:45' },
        { position: 5, name: 'T. Pérez', time: '01:10:15' },
        { position: 6, name: 'F. Rivas', time: '01:10:58' },
        { position: 7, name: 'S. Caballero', time: '01:11:22' },
        { position: 8, name: 'R. Lozano', time: '01:11:59' },
        { position: 9, name: 'O. Buitrago', time: '01:12:24' },
        { position: 10, name: 'E. Contreras', time: '01:12:40' },
      ] },
    ],
  location: 'Costanera de Formosa',
    startTime: '05:30 AM',
    weather: 'Soleado • 18°C',
    gallery: [
      'https://images.unsplash.com/photo-1520975682031-ae4e5a62f9ca?w=900&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1521417531039-86b8de2f7b1b?w=900&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=60',
    ],
    date: 'Domingo, 31 de Agosto 2025',
    info: 'Circuito certificado con puntos de hidratación cada 3 km y servicios médicos en meta y ruta.',
  },
  {
    id: 'gesport-2024',
    year: 'GeSPORT 2024',
    image: require('../assets/images/edition2.jpeg'),
    description: 'Gran participación de clubes y una llegada espectacular en el Estadio Olímpico.',
    races: [
      { id: '5k', name: '5K Recreativa', distanceKm: 5, participants: 2800, winnerMale: { name: 'R. Díaz', time: '00:16:58' }, winnerFemale: { name: 'S. Arias', time: '00:19:22' }, results: [
        { position: 1, name: 'R. Díaz', time: '00:16:58' },
        { position: 2, name: 'E. Salgado', time: '00:17:15' },
        { position: 3, name: 'C. Muñoz', time: '00:17:33' },
        { position: 4, name: 'I. Pineda', time: '00:17:50' },
        { position: 5, name: 'G. Camacho', time: '00:18:04' },
        { position: 6, name: 'B. Álvarez', time: '00:18:22' },
        { position: 7, name: 'T. Bravo', time: '00:18:35' },
        { position: 8, name: 'S. Castaño', time: '00:18:49' },
        { position: 9, name: 'J. Moya', time: '00:19:05' },
        { position: 10, name: 'A. Pardo', time: '00:19:14' },
      ] },
      { id: '10k', name: '10K Competitiva', distanceKm: 10, participants: 1950, winnerMale: { name: 'L. Castro', time: '00:31:44' }, winnerFemale: { name: 'D. Medina', time: '00:37:12' }, results: [
        { position: 1, name: 'L. Castro', time: '00:31:44' },
        { position: 2, name: 'J. Barrios', time: '00:32:01' },
        { position: 3, name: 'H. Beltrán', time: '00:32:17' },
        { position: 4, name: 'M. Fajardo', time: '00:32:39' },
        { position: 5, name: 'S. Lugo', time: '00:32:55' },
        { position: 6, name: 'C. Rangel', time: '00:33:10' },
        { position: 7, name: 'E. Parra', time: '00:33:26' },
        { position: 8, name: 'D. Torres', time: '00:33:44' },
        { position: 9, name: 'V. Sierra', time: '00:34:03' },
        { position: 10, name: 'A. Niño', time: '00:34:18' },
      ] },
    ],
  location: 'Costanera de Formosa',
    startTime: '06:00 AM',
    weather: 'Parcial nublado • 20°C',
    gallery: [
      'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=900&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=900&auto=format&fit=crop&q=60',
    ],
    date: 'Domingo, 25 de Agosto 2024',
    info: 'Edición con salida escalonada por oleadas y animación en puntos clave del recorrido.',
  },
  {
    id: 'gesport-2023',
    year: 'GeSPORT 2023',
    image: require('../assets/images/edition3.jpeg'),
    description: 'La lluvia no detuvo a miles de corredores que vivieron una jornada épica.',
    races: [
      { id: '10k', name: '10K Competitiva', distanceKm: 10, participants: 1700, winnerMale: { name: 'A. López', time: '00:32:05' }, winnerFemale: { name: 'B. Rincón', time: '00:37:40' }, results: [
        { position: 1, name: 'A. López', time: '00:32:05' },
        { position: 2, name: 'D. Arévalo', time: '00:32:20' },
        { position: 3, name: 'O. Páez', time: '00:32:40' },
        { position: 4, name: 'K. Galeano', time: '00:33:02' },
        { position: 5, name: 'J. Bonilla', time: '00:33:20' },
        { position: 6, name: 'Y. Rojas', time: '00:33:42' },
        { position: 7, name: 'R. Díaz', time: '00:33:55' },
        { position: 8, name: 'G. Caro', time: '00:34:10' },
        { position: 9, name: 'N. Sierra', time: '00:34:25' },
        { position: 10, name: 'L. Pacheco', time: '00:34:40' },
      ] },
      { id: '21k', name: 'Media Maratón 21K', distanceKm: 21, participants: 1200, winnerMale: { name: 'E. Salas', time: '01:09:12' }, winnerFemale: { name: 'V. Rojas', time: '01:17:18' }, results: [
        { position: 1, name: 'E. Salas', time: '01:09:12' },
        { position: 2, name: 'M. Rincón', time: '01:09:45' },
        { position: 3, name: 'S. Guerrero', time: '01:10:12' },
        { position: 4, name: 'C. Vargas', time: '01:10:44' },
        { position: 5, name: 'J. Tovar', time: '01:11:10' },
        { position: 6, name: 'P. Galeano', time: '01:11:36' },
        { position: 7, name: 'H. Riaño', time: '01:12:00' },
        { position: 8, name: 'E. Rojas', time: '01:12:24' },
        { position: 9, name: 'V. Becerra', time: '01:12:50' },
        { position: 10, name: 'T. Quintero', time: '01:13:20' },
      ] },
    ],
  location: 'Costanera de Formosa',
    startTime: '05:45 AM',
    weather: 'Lluvioso • 16°C',
    gallery: [
      'https://images.unsplash.com/photo-1448387473223-5c37445527e7?w=900&auto=format&fit=crop&q=60',
    ],
    date: 'Domingo, 27 de Agosto 2023',
    info: 'Se implementaron rutas alternativas por clima, manteniendo la seguridad y experiencia del corredor.',
    },
];

export function getEditionById(id: string): EditionItem | undefined {
  return PAST_EDITIONS.find(e => e.id === id);
}

// ====== Mapear desde un posible payload del backend a EditionItem ======
export function mapApiEditionToItem(api: any): EditionItem {
  const racesSrc = api?.races || api?.carreras || [];
  const gallery = api?.gallery || api?.images || api?.galeria || [];
  const image = api?.image || api?.coverImage || api?.portada || api?.imagenPortada || (Array.isArray(gallery) && gallery[0]) || null;

  const mapRace = (r: any): RaceItem => ({
    id: String(r?.id ?? r?._id ?? r?.slug ?? r?.name ?? 'race'),
    name: String(r?.name ?? r?.nombre ?? 'Carrera'),
    distanceKm: Number(r?.distanceKm ?? r?.distanciaKm ?? r?.distancia ?? 0),
    participants: r?.participants ?? r?.participantes,
    winnerMale: r?.winnerMale ?? r?.ganadorHombre,
    winnerFemale: r?.winnerFemale ?? r?.ganadoraMujer,
    image: r?.image ?? r?.portada ?? null,
    results: Array.isArray(r?.results)
      ? r.results.map((x: any, i: number) => ({
          position: Number(x?.position ?? x?.puesto ?? i + 1),
          name: String(x?.name ?? x?.nombre ?? 'N/D'),
          time: String(x?.time ?? x?.tiempo ?? '—'),
        }))
      : undefined,
  });

  return {
    id: String(api?.id ?? api?._id ?? api?.slug ?? 'edition'),
    year: String(api?.year ?? api?.title ?? api?.nombre ?? 'Edición'),
    image: image ?? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&auto=format&fit=crop&q=60',
    description: String(api?.description ?? api?.descripcion ?? api?.resumen ?? ''),
    races: Array.isArray(racesSrc) ? racesSrc.map(mapRace) : undefined,
    location: api?.location ?? api?.ubicacion,
    startTime: api?.startTime ?? api?.hora,
    weather: api?.weather ?? api?.clima,
    gallery: Array.isArray(gallery) ? gallery : undefined,
    date: api?.date ?? api?.fecha,
    info: api?.info ?? api?.informacion ?? api?.detalle,
  } as EditionItem;
}
