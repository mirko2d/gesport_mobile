// Centraliza aquÃ­ las ediciones anteriores para mantenerlas en un solo lugar
// Puedes usar URLs o require() desde assets/images

export type CategoryResult = {
  position: number;
  name: string;
  time: string;
  dorsal?: number;
};

export type RaceCategory = {
  id: string; // ej: 'masculino', 'femenino', 'general'
  name: string; // ej: 'CategorÃ­a Masculina', 'CategorÃ­a Femenina'
  participants?: number;
  results?: CategoryResult[]; // top 10 de la categorÃ­a
};

export type RaceItem = {
  id: string; // ej: '5k', '10k'
  name: string; // nombre visible, ej: '5K Recreativa'
  distanceKm: number;
  totalParticipants?: number; // participantes totales de la maratÃ³n
  categories?: RaceCategory[]; // categorÃ­as dentro de esta maratÃ³n
  winnerMale?: { name: string; time: string };
  winnerFemale?: { name: string; time: string };
  image?: any; // opcional: portada especÃ­fica de la carrera
};

export type EditionItem = {
  id: string; // slug Ãºnico para routing, ej: 'gesport-2025'
  year: string;
  image: any; // string URL o require(local)
  description: string;
  races?: RaceItem[]; // carreras de esa ediciÃ³n
  location?: string;
  startTime?: string;
  weather?: string;
  gallery?: any[];
  date?: string; // fecha del evento, p.ej. 'Domingo, 25 de Agosto 2025'
  info?: string; // texto libre con informaciÃ³n adicional
};

export const PAST_EDITIONS: EditionItem[] = [
  {
    id: 'gesport-2025',
    year: 'GeSPORT 2025',
    image: require('../assets/images/edition1.jpeg'),
    description: 'Una ediciÃ³n marcada por rÃ©cords personales y un ambiente inolvidable en cada kilÃ³metro.',
    races: [
      {
        id: '5k-1',
        name: '5K Costanera Sur',
        distanceKm: 5,
        totalParticipants: 3200,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1920,
            results: [
              { position: 1, name: 'J. PÃ©rez', time: '00:16:42', dorsal: 101 },
              { position: 2, name: 'E. LÃ³pez', time: '00:16:58', dorsal: 145 },
              { position: 3, name: 'R. GÃ³mez', time: '00:17:15', dorsal: 189 },
              { position: 4, name: 'A. Silva', time: '00:17:32', dorsal: 223 },
              { position: 5, name: 'M. GonzÃ¡lez', time: '00:17:49', dorsal: 267 },
              { position: 6, name: 'S. MartÃ­nez', time: '00:18:05', dorsal: 301 },
              { position: 7, name: 'C. RodrÃ­guez', time: '00:18:22', dorsal: 345 },
              { position: 8, name: 'T. VelÃ¡squez', time: '00:18:40', dorsal: 389 },
              { position: 9, name: 'D. HernÃ¡ndez', time: '00:18:57', dorsal: 433 },
              { position: 10, name: 'F. Iglesias', time: '00:19:14', dorsal: 477 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 1280,
            results: [
              { position: 1, name: 'L. GarcÃ­a', time: '00:19:05', dorsal: 521 },
              { position: 2, name: 'A. RodrÃ­guez', time: '00:19:32', dorsal: 565 },
              { position: 3, name: 'M. LÃ³pez', time: '00:19:58', dorsal: 609 },
              { position: 4, name: 'C. MartÃ­nez', time: '00:20:25', dorsal: 653 },
              { position: 5, name: 'B. FernÃ¡ndez', time: '00:20:52', dorsal: 697 },
              { position: 6, name: 'S. GÃ³mez', time: '00:21:18', dorsal: 741 },
              { position: 7, name: 'P. SÃ¡nchez', time: '00:21:45', dorsal: 785 },
              { position: 8, name: 'T. DÃ­az', time: '00:22:12', dorsal: 829 },
              { position: 9, name: 'V. Rivera', time: '00:22:38', dorsal: 873 },
              { position: 10, name: 'K. Silva', time: '00:23:05', dorsal: 917 },
            ]
          }
        ]
      },
      {
        id: '10k-1',
        name: '10K Competitiva Centro',
        distanceKm: 10,
        totalParticipants: 2100,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1260,
            results: [
              { position: 1, name: 'M. Ruiz', time: '00:31:10', dorsal: 201 },
              { position: 2, name: 'D. Vargas', time: '00:31:35', dorsal: 245 },
              { position: 3, name: 'S. Molina', time: '00:32:02', dorsal: 289 },
              { position: 4, name: 'H. CÃ¡rdenas', time: '00:32:18', dorsal: 333 },
              { position: 5, name: 'L. Prieto', time: '00:32:41', dorsal: 377 },
              { position: 6, name: 'R. Acosta', time: '00:33:05', dorsal: 421 },
              { position: 7, name: 'E. MÃ©ndez', time: '00:33:22', dorsal: 465 },
              { position: 8, name: 'P. GÃ³mez', time: '00:33:40', dorsal: 509 },
              { position: 9, name: 'K. Silva', time: '00:34:02', dorsal: 553 },
              { position: 10, name: 'J. Torres', time: '00:34:20', dorsal: 597 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 840,
            results: [
              { position: 1, name: 'A. Torres', time: '00:36:48', dorsal: 641 },
              { position: 2, name: 'B. Ruiz', time: '00:37:15', dorsal: 685 },
              { position: 3, name: 'C. SÃ¡nchez', time: '00:37:42', dorsal: 729 },
              { position: 4, name: 'D. GarcÃ­a', time: '00:38:08', dorsal: 773 },
              { position: 5, name: 'E. LÃ³pez', time: '00:38:35', dorsal: 817 },
              { position: 6, name: 'F. MartÃ­nez', time: '00:39:02', dorsal: 861 },
              { position: 7, name: 'G. RodrÃ­guez', time: '00:39:28', dorsal: 905 },
              { position: 8, name: 'H. FernÃ¡ndez', time: '00:39:55', dorsal: 949 },
              { position: 9, name: 'I. DÃ­az', time: '00:40:22', dorsal: 993 },
              { position: 10, name: 'J. GÃ³mez', time: '00:40:48', dorsal: 1037 },
            ]
          }
        ]
      },
      {
        id: '21k-1',
        name: 'Media MaratÃ³n 21K Elite',
        distanceKm: 21,
        totalParticipants: 1400,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 840,
            results: [
              { position: 1, name: 'C. GÃ³mez', time: '01:07:55', dorsal: 401 },
              { position: 2, name: 'A. RoldÃ¡n', time: '01:08:30', dorsal: 445 },
              { position: 3, name: 'J. HernÃ¡ndez', time: '01:09:10', dorsal: 489 },
              { position: 4, name: 'N. Ortega', time: '01:09:45', dorsal: 533 },
              { position: 5, name: 'T. PÃ©rez', time: '01:10:15', dorsal: 577 },
              { position: 6, name: 'F. Rivas', time: '01:10:58', dorsal: 621 },
              { position: 7, name: 'S. Caballero', time: '01:11:22', dorsal: 665 },
              { position: 8, name: 'R. Lozano', time: '01:11:59', dorsal: 709 },
              { position: 9, name: 'M. Campos', time: '01:12:24', dorsal: 753 },
              { position: 10, name: 'E. Contreras', time: '01:12:40', dorsal: 797 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 560,
            results: [
              { position: 1, name: 'P. Silva', time: '01:16:23', dorsal: 841 },
              { position: 2, name: 'Q. Bravo', time: '01:17:05', dorsal: 885 },
              { position: 3, name: 'R. Castro', time: '01:17:48', dorsal: 929 },
              { position: 4, name: 'S. Delgado', time: '01:18:32', dorsal: 973 },
              { position: 5, name: 'T. Estrada', time: '01:19:15', dorsal: 1017 },
              { position: 6, name: 'U. Franco', time: '01:20:02', dorsal: 1061 },
              { position: 7, name: 'V. GarcÃ­a', time: '01:20:45', dorsal: 1105 },
              { position: 8, name: 'W. HenrÃ­quez', time: '01:21:28', dorsal: 1149 },
              { position: 9, name: 'X. Iglesias', time: '01:22:12', dorsal: 1193 },
              { position: 10, name: 'Y. JimÃ©nez', time: '01:22:55', dorsal: 1237 },
            ]
          }
        ]
      },
      {
        id: '42k-1',
        name: 'MaratÃ³n Completa 42K',
        distanceKm: 42,
        totalParticipants: 950,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 570,
            results: [
              { position: 1, name: 'X. Aguirre', time: '02:15:30', dorsal: 701 },
              { position: 2, name: 'W. Bravo', time: '02:16:42', dorsal: 745 },
              { position: 3, name: 'V. Castro', time: '02:17:58', dorsal: 789 },
              { position: 4, name: 'U. Delgado', time: '02:19:15', dorsal: 833 },
              { position: 5, name: 'T. Estrada', time: '02:20:32', dorsal: 877 },
              { position: 6, name: 'S. Franco', time: '02:21:48', dorsal: 921 },
              { position: 7, name: 'R. GonzÃ¡lez', time: '02:23:05', dorsal: 965 },
              { position: 8, name: 'Q. Herrera', time: '02:24:22', dorsal: 1009 },
              { position: 9, name: 'P. IbÃ¡Ã±ez', time: '02:25:38', dorsal: 1053 },
              { position: 10, name: 'O. JimÃ©nez', time: '02:26:55', dorsal: 1097 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 380,
            results: [
              { position: 1, name: 'V. Franco', time: '02:28:45', dorsal: 1141 },
              { position: 2, name: 'W. GarcÃ­a', time: '02:30:12', dorsal: 1185 },
              { position: 3, name: 'X. HenrÃ­quez', time: '02:31:38', dorsal: 1229 },
              { position: 4, name: 'Y. Iglesias', time: '02:33:05', dorsal: 1273 },
              { position: 5, name: 'Z. JimÃ©nez', time: '02:34:32', dorsal: 1317 },
              { position: 6, name: 'A. Keller', time: '02:35:58', dorsal: 1361 },
              { position: 7, name: 'B. LÃ³pez', time: '02:37:25', dorsal: 1405 },
              { position: 8, name: 'C. MuÃ±oz', time: '02:38:52', dorsal: 1449 },
              { position: 9, name: 'D. NarvÃ¡ez', time: '02:40:18', dorsal: 1493 },
              { position: 10, name: 'E. Oliva', time: '02:41:45', dorsal: 1537 },
            ]
          }
        ]
      },
      {
        id: 'marcha-20k',
        name: 'Marcha Deportiva 20K TÃ©cnica',
        distanceKm: 20,
        totalParticipants: 650,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 390,
            results: [
              { position: 1, name: 'E. Sanz', time: '01:34:20', dorsal: 1601 },
              { position: 2, name: 'F. Soto', time: '01:35:45', dorsal: 1645 },
              { position: 3, name: 'G. SuÃ¡rez', time: '01:37:12', dorsal: 1689 },
              { position: 4, name: 'H. Tapia', time: '01:38:38', dorsal: 1733 },
              { position: 5, name: 'I. Tello', time: '01:40:05', dorsal: 1777 },
              { position: 6, name: 'J. Trejo', time: '01:41:32', dorsal: 1821 },
              { position: 7, name: 'K. Uribe', time: '01:42:58', dorsal: 1865 },
              { position: 8, name: 'L. ValdÃ©s', time: '01:44:25', dorsal: 1909 },
              { position: 9, name: 'M. Valenzuela', time: '01:45:52', dorsal: 1953 },
              { position: 10, name: 'N. Vanegas', time: '01:47:18', dorsal: 1997 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 260,
            results: [
              { position: 1, name: 'D. Toro', time: '01:42:15', dorsal: 2041 },
              { position: 2, name: 'E. Uribe', time: '01:43:42', dorsal: 2085 },
              { position: 3, name: 'F. Vera', time: '01:45:08', dorsal: 2129 },
              { position: 4, name: 'G. Vickers', time: '01:46:35', dorsal: 2173 },
              { position: 5, name: 'H. Videla', time: '01:48:02', dorsal: 2217 },
              { position: 6, name: 'I. Vidal', time: '01:49:28', dorsal: 2261 },
              { position: 7, name: 'J. Vilches', time: '01:50:55', dorsal: 2305 },
              { position: 8, name: 'K. Villagomez', time: '01:52:22', dorsal: 2349 },
              { position: 9, name: 'L. Villalba', time: '01:53:48', dorsal: 2393 },
              { position: 10, name: 'M. Villalobos', time: '01:55:15', dorsal: 2437 },
            ]
          }
        ]
      }
    ],
    location: 'Costanera de Formosa',
    startTime: '05:30 AM',
    weather: 'Soleado â€¢ 18Â°C',
    gallery: [],
    date: 'Domingo, 31 de Agosto 2025',
    info: 'Circuito certificado con puntos de hidrataciÃ³n cada 3 km y servicios mÃ©dicos en meta y ruta.',
  },
  {
    id: 'gesport-2024',
    year: 'GeSPORT 2024',
    image: require('../assets/images/edition2.jpeg'),
    description: 'Gran participaciÃ³n de clubes y una llegada espectacular en el Estadio OlÃ­mpico.',
    races: [
      {
        id: '5k-1',
        name: '5K Costanera Sur',
        distanceKm: 5,
        totalParticipants: 2800,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1680,
            results: [
              { position: 1, name: 'R. DÃ­az', time: '00:16:58', dorsal: 110 },
              { position: 2, name: 'E. Salgado', time: '00:17:15', dorsal: 154 },
              { position: 3, name: 'C. MuÃ±oz', time: '00:17:33', dorsal: 198 },
              { position: 4, name: 'I. Pineda', time: '00:17:50', dorsal: 242 },
              { position: 5, name: 'G. Camacho', time: '00:18:04', dorsal: 286 },
              { position: 6, name: 'B. Ãlvarez', time: '00:18:22', dorsal: 330 },
              { position: 7, name: 'T. Bravo', time: '00:18:35', dorsal: 374 },
              { position: 8, name: 'S. CastaÃ±o', time: '00:18:49', dorsal: 418 },
              { position: 9, name: 'J. Moya', time: '00:19:05', dorsal: 462 },
              { position: 10, name: 'A. Pardo', time: '00:19:22', dorsal: 506 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 1120,
            results: [
              { position: 1, name: 'S. Arias', time: '00:19:22', dorsal: 550 },
              { position: 2, name: 'T. BÃ¡ez', time: '00:19:48', dorsal: 594 },
              { position: 3, name: 'U. Cabrera', time: '00:20:15', dorsal: 638 },
              { position: 4, name: 'V. Campos', time: '00:20:42', dorsal: 682 },
              { position: 5, name: 'W. CÃ¡rdenas', time: '00:21:08', dorsal: 726 },
              { position: 6, name: 'X. Carrillo', time: '00:21:35', dorsal: 770 },
              { position: 7, name: 'Y. Casanova', time: '00:22:02', dorsal: 814 },
              { position: 8, name: 'Z. Castillo', time: '00:22:28', dorsal: 858 },
              { position: 9, name: 'A. CastaÃ±o', time: '00:22:55', dorsal: 902 },
              { position: 10, name: 'B. Castro', time: '00:23:22', dorsal: 946 },
            ]
          }
        ]
      },
      {
        id: '10k-1',
        name: '10K Competitiva Centro',
        distanceKm: 10,
        totalParticipants: 1950,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1170,
            results: [
              { position: 1, name: 'L. Castro', time: '00:31:44', dorsal: 112 },
              { position: 2, name: 'J. Barrios', time: '00:32:01', dorsal: 156 },
              { position: 3, name: 'H. BeltrÃ¡n', time: '00:32:17', dorsal: 200 },
              { position: 4, name: 'M. Fajardo', time: '00:32:39', dorsal: 244 },
              { position: 5, name: 'S. Lugo', time: '00:32:55', dorsal: 288 },
              { position: 6, name: 'C. Rangel', time: '00:33:10', dorsal: 332 },
              { position: 7, name: 'E. Parra', time: '00:33:26', dorsal: 376 },
              { position: 8, name: 'D. Torres', time: '00:33:44', dorsal: 420 },
              { position: 9, name: 'V. Sierra', time: '00:34:03', dorsal: 464 },
              { position: 10, name: 'A. NiÃ±o', time: '00:34:18', dorsal: 508 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 780,
            results: [
              { position: 1, name: 'D. Medina', time: '00:37:12', dorsal: 552 },
              { position: 2, name: 'E. Mendoza', time: '00:37:45', dorsal: 596 },
              { position: 3, name: 'F. Merino', time: '00:38:18', dorsal: 640 },
              { position: 4, name: 'G. Meza', time: '00:38:52', dorsal: 684 },
              { position: 5, name: 'H. Molina', time: '00:39:25', dorsal: 728 },
              { position: 6, name: 'I. Montero', time: '00:39:58', dorsal: 772 },
              { position: 7, name: 'J. Montoya', time: '00:40:32', dorsal: 816 },
              { position: 8, name: 'K. Mora', time: '00:41:05', dorsal: 860 },
              { position: 9, name: 'L. Morales', time: '00:41:38', dorsal: 904 },
              { position: 10, name: 'M. Moreno', time: '00:42:12', dorsal: 948 },
            ]
          }
        ]
      },
      {
        id: '21k-1',
        name: 'Media MaratÃ³n 21K Elite',
        distanceKm: 21,
        totalParticipants: 1200,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 720,
            results: [
              { position: 1, name: 'T. Navarro', time: '01:08:22', dorsal: 300 },
              { position: 2, name: 'V. Parra', time: '01:09:05', dorsal: 344 },
              { position: 3, name: 'W. Quiroz', time: '01:09:48', dorsal: 388 },
              { position: 4, name: 'X. RamÃ­rez', time: '01:10:32', dorsal: 432 },
              { position: 5, name: 'Y. Riquelme', time: '01:11:15', dorsal: 476 },
              { position: 6, name: 'Z. Rivera', time: '01:11:58', dorsal: 520 },
              { position: 7, name: 'A. Robles', time: '01:12:42', dorsal: 564 },
              { position: 8, name: 'B. Romero', time: '01:14:08', dorsal: 608 },
              { position: 9, name: 'C. Rosas', time: '01:14:52', dorsal: 652 },
              { position: 10, name: 'D. Ruelas', time: '01:15:35', dorsal: 696 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 480,
            results: [
              { position: 1, name: 'U. Ortiz', time: '01:17:15', dorsal: 740 },
              { position: 2, name: 'V. Osorio', time: '01:18:05', dorsal: 784 },
              { position: 3, name: 'W. Pacheco', time: '01:18:55', dorsal: 828 },
              { position: 4, name: 'X. Palacios', time: '01:19:45', dorsal: 872 },
              { position: 5, name: 'Y. Palma', time: '01:20:35', dorsal: 916 },
              { position: 6, name: 'Z. Pampas', time: '01:21:25', dorsal: 960 },
              { position: 7, name: 'A. Panda', time: '01:22:15', dorsal: 1004 },
              { position: 8, name: 'B. Pandal', time: '01:23:05', dorsal: 1048 },
              { position: 9, name: 'C. Pando', time: '01:23:55', dorsal: 1092 },
              { position: 10, name: 'D. Panel', time: '01:24:45', dorsal: 1136 },
            ]
          }
        ]
      },
      {
        id: '42k-1',
        name: 'MaratÃ³n Completa 42K',
        distanceKm: 42,
        totalParticipants: 850,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 510,
            results: [
              { position: 1, name: 'X. Veloz', time: '02:16:45', dorsal: 600 },
              { position: 2, name: 'Z. Vergara', time: '02:18:02', dorsal: 644 },
              { position: 3, name: 'A. VergÃ©s', time: '02:19:18', dorsal: 688 },
              { position: 4, name: 'B. Verner', time: '02:20:35', dorsal: 732 },
              { position: 5, name: 'C. Vicente', time: '02:21:52', dorsal: 776 },
              { position: 6, name: 'D. VicuÃ±a', time: '02:23:08', dorsal: 820 },
              { position: 7, name: 'E. Vickers', time: '02:25:42', dorsal: 864 },
              { position: 8, name: 'F. Videla', time: '02:27:05', dorsal: 908 },
              { position: 9, name: 'G. Vidal', time: '02:28:22', dorsal: 952 },
              { position: 10, name: 'H. Vilches', time: '02:29:38', dorsal: 996 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 340,
            results: [
              { position: 1, name: 'Y. Vera', time: '02:30:12', dorsal: 1040 },
              { position: 2, name: 'Z. Verano', time: '02:31:35', dorsal: 1084 },
              { position: 3, name: 'A. Verdejo', time: '02:32:58', dorsal: 1128 },
              { position: 4, name: 'B. Vereda', time: '02:34:20', dorsal: 1172 },
              { position: 5, name: 'C. Verell', time: '02:35:42', dorsal: 1216 },
              { position: 6, name: 'D. Verga', time: '02:37:05', dorsal: 1260 },
              { position: 7, name: 'E. Vergas', time: '02:38:28', dorsal: 1304 },
              { position: 8, name: 'F. VergiÃ©s', time: '02:39:50', dorsal: 1348 },
              { position: 9, name: 'G. Vergle', time: '02:41:12', dorsal: 1392 },
              { position: 10, name: 'H. Vergo', time: '02:42:35', dorsal: 1436 },
            ]
          }
        ]
      },
      {
        id: 'ultra-50k',
        name: 'Ultra MaratÃ³n 50K DesafÃ­o',
        distanceKm: 50,
        totalParticipants: 320,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 192,
            results: [
              { position: 1, name: 'H. Vilches', time: '03:43:58', dorsal: 700 },
              { position: 2, name: 'J. Villagomez', time: '03:46:12', dorsal: 744 },
              { position: 3, name: 'K. Villalba', time: '03:48:35', dorsal: 788 },
              { position: 4, name: 'L. Villalobos', time: '03:51:05', dorsal: 832 },
              { position: 5, name: 'M. Villaneda', time: '03:53:38', dorsal: 876 },
              { position: 6, name: 'N. Villapol', time: '03:56:12', dorsal: 920 },
              { position: 7, name: 'O. Vilchez', time: '03:59:48', dorsal: 964 },
              { position: 8, name: 'P. Villareal', time: '04:02:22', dorsal: 1008 },
              { position: 9, name: 'Q. Villarre', time: '04:04:55', dorsal: 1052 },
              { position: 10, name: 'R. Villegas', time: '04:07:28', dorsal: 1096 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 128,
            results: [
              { position: 1, name: 'I. Vilela', time: '04:07:15', dorsal: 1140 },
              { position: 2, name: 'J. Vilena', time: '04:10:08', dorsal: 1184 },
              { position: 3, name: 'K. Vileta', time: '04:13:05', dorsal: 1228 },
              { position: 4, name: 'L. Vilette', time: '04:15:58', dorsal: 1272 },
              { position: 5, name: 'M. Villain', time: '04:18:52', dorsal: 1316 },
              { position: 6, name: 'N. VillaÃ±o', time: '04:21:45', dorsal: 1360 },
              { position: 7, name: 'O. Villada', time: '04:24:38', dorsal: 1404 },
              { position: 8, name: 'P. Villeyes', time: '04:27:32', dorsal: 1448 },
              { position: 9, name: 'Q. Villeroy', time: '04:30:25', dorsal: 1492 },
              { position: 10, name: 'R. Villesur', time: '04:33:18', dorsal: 1536 },
            ]
          }
        ]
      }
    ],
    location: 'Costanera de Formosa',
    startTime: '06:00 AM',
    weather: 'Parcial nublado â€¢ 20Â°C',
    gallery: [],
    date: 'Domingo, 25 de Agosto 2024',
    info: 'EdiciÃ³n con salida escalonada por oleadas y animaciÃ³n en puntos clave del recorrido.',
  },
  {
    id: 'gesport-2023',
    year: 'GeSPORT 2023',
    image: require('../assets/images/edition3.jpeg'),
    description: 'La lluvia no detuvo a miles de corredores que vivieron una jornada Ã©pica.',
    races: [
      {
        id: '5k-1',
        name: '5K Costanera Sur',
        distanceKm: 5,
        totalParticipants: 2200,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1320,
            results: [
              { position: 1, name: 'B. Zamora', time: '00:17:12', dorsal: 115 },
              { position: 2, name: 'D. Zeballos', time: '00:17:35', dorsal: 159 },
              { position: 3, name: 'E. Zenteno', time: '00:17:58', dorsal: 203 },
              { position: 4, name: 'F. Zianya', time: '00:18:22', dorsal: 247 },
              { position: 5, name: 'G. Ziga', time: '00:18:45', dorsal: 291 },
              { position: 6, name: 'H. Ziraldo', time: '00:19:08', dorsal: 335 },
              { position: 7, name: 'I. Zoila', time: '00:19:32', dorsal: 379 },
              { position: 8, name: 'J. Zoraida', time: '00:19:55', dorsal: 423 },
              { position: 9, name: 'K. Zoraldo', time: '00:20:18', dorsal: 467 },
              { position: 10, name: 'L. Zorrilla', time: '00:20:42', dorsal: 501 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 880,
            results: [
              { position: 1, name: 'C. Zapata', time: '00:19:45', dorsal: 545 },
              { position: 2, name: 'D. Zara', time: '00:20:15', dorsal: 589 },
              { position: 3, name: 'E. Zarco', time: '00:20:45', dorsal: 633 },
              { position: 4, name: 'F. Zarela', time: '00:21:15', dorsal: 677 },
              { position: 5, name: 'G. Zarema', time: '00:21:45', dorsal: 721 },
              { position: 6, name: 'H. Zarita', time: '00:22:15', dorsal: 765 },
              { position: 7, name: 'I. Zarpa', time: '00:22:45', dorsal: 809 },
              { position: 8, name: 'J. Zarria', time: '00:23:15', dorsal: 853 },
              { position: 9, name: 'K. Zarrida', time: '00:23:45', dorsal: 897 },
              { position: 10, name: 'L. Zarrita', time: '00:24:15', dorsal: 941 },
            ]
          }
        ]
      },
      {
        id: '10k-1',
        name: '10K Competitiva Centro',
        distanceKm: 10,
        totalParticipants: 1700,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 1020,
            results: [
              { position: 1, name: 'A. LÃ³pez', time: '00:32:05', dorsal: 201 },
              { position: 2, name: 'D. ArÃ©valo', time: '00:32:20', dorsal: 245 },
              { position: 3, name: 'O. PÃ¡ez', time: '00:32:40', dorsal: 289 },
              { position: 4, name: 'K. Galeano', time: '00:33:02', dorsal: 333 },
              { position: 5, name: 'J. Bonilla', time: '00:33:20', dorsal: 377 },
              { position: 6, name: 'Y. Rojas', time: '00:33:42', dorsal: 421 },
              { position: 7, name: 'R. DÃ­az', time: '00:33:55', dorsal: 465 },
              { position: 8, name: 'G. Caro', time: '00:34:10', dorsal: 509 },
              { position: 9, name: 'N. Sierra', time: '00:34:25', dorsal: 553 },
              { position: 10, name: 'L. Pacheco', time: '00:34:40', dorsal: 597 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 680,
            results: [
              { position: 1, name: 'B. RincÃ³n', time: '00:37:40', dorsal: 641 },
              { position: 2, name: 'C. RÃ­os', time: '00:38:15', dorsal: 685 },
              { position: 3, name: 'D. Risetti', time: '00:38:50', dorsal: 729 },
              { position: 4, name: 'E. Rivera', time: '00:39:25', dorsal: 773 },
              { position: 5, name: 'F. Rivero', time: '00:40:00', dorsal: 817 },
              { position: 6, name: 'G. Riviera', time: '00:40:35', dorsal: 861 },
              { position: 7, name: 'H. Rivilla', time: '00:41:10', dorsal: 905 },
              { position: 8, name: 'I. Rivino', time: '00:41:45', dorsal: 949 },
              { position: 9, name: 'J. Rivira', time: '00:42:20', dorsal: 993 },
              { position: 10, name: 'K. Rivita', time: '00:42:55', dorsal: 1037 },
            ]
          }
        ]
      },
      {
        id: '21k-1',
        name: 'Media MaratÃ³n 21K Elite',
        distanceKm: 21,
        totalParticipants: 1200,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 720,
            results: [
              { position: 1, name: 'E. Salas', time: '01:09:12', dorsal: 401 },
              { position: 2, name: 'M. RincÃ³n', time: '01:09:45', dorsal: 445 },
              { position: 3, name: 'S. Guerrero', time: '01:10:12', dorsal: 489 },
              { position: 4, name: 'C. Vargas', time: '01:10:44', dorsal: 533 },
              { position: 5, name: 'J. Tovar', time: '01:11:10', dorsal: 577 },
              { position: 6, name: 'P. Galeano', time: '01:11:36', dorsal: 621 },
              { position: 7, name: 'H. RiaÃ±o', time: '01:12:00', dorsal: 665 },
              { position: 8, name: 'E. Rojas', time: '01:12:24', dorsal: 709 },
              { position: 9, name: 'V. Becerra', time: '01:12:50', dorsal: 753 },
              { position: 10, name: 'T. Quintero', time: '01:13:20', dorsal: 797 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 480,
            results: [
              { position: 1, name: 'V. Rojas', time: '01:17:18', dorsal: 841 },
              { position: 2, name: 'W. Rojas', time: '01:18:05', dorsal: 885 },
              { position: 3, name: 'X. Rojizo', time: '01:18:52', dorsal: 929 },
              { position: 4, name: 'Y. Rojizo', time: '01:19:38', dorsal: 973 },
              { position: 5, name: 'Z. Rojoso', time: '01:20:25', dorsal: 1017 },
              { position: 6, name: 'A. Rojudo', time: '01:21:12', dorsal: 1061 },
              { position: 7, name: 'B. Rojuela', time: '01:21:58', dorsal: 1105 },
              { position: 8, name: 'C. Rojuela', time: '01:22:45', dorsal: 1149 },
              { position: 9, name: 'D. Rojuelo', time: '01:23:32', dorsal: 1193 },
              { position: 10, name: 'E. Rojueta', time: '01:24:18', dorsal: 1237 },
            ]
          }
        ]
      },
      {
        id: '42k-1',
        name: 'MaratÃ³n Completa 42K',
        distanceKm: 42,
        totalParticipants: 750,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 450,
            results: [
              { position: 1, name: 'P. Parral', time: '02:17:28', dorsal: 701 },
              { position: 2, name: 'R. Parramillo', time: '02:18:45', dorsal: 745 },
              { position: 3, name: 'S. ParramÃ³n', time: '02:20:02', dorsal: 789 },
              { position: 4, name: 'T. Parramort', time: '02:21:18', dorsal: 833 },
              { position: 5, name: 'U. Parramoso', time: '02:22:35', dorsal: 877 },
              { position: 6, name: 'V. Parramot', time: '02:23:52', dorsal: 921 },
              { position: 7, name: 'W. Parramou', time: '02:25:08', dorsal: 965 },
              { position: 8, name: 'X. Parramov', time: '02:26:25', dorsal: 1009 },
              { position: 9, name: 'Y. Parramow', time: '02:27:42', dorsal: 1053 },
              { position: 10, name: 'Z. Parramox', time: '02:28:58', dorsal: 1097 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 300,
            results: [
              { position: 1, name: 'Q. Parralejo', time: '02:31:05', dorsal: 1141 },
              { position: 2, name: 'R. Parrampa', time: '02:32:32', dorsal: 1185 },
              { position: 3, name: 'S. Parrampe', time: '02:33:58', dorsal: 1229 },
              { position: 4, name: 'T. Parrampi', time: '02:35:25', dorsal: 1273 },
              { position: 5, name: 'U. Parrampo', time: '02:36:52', dorsal: 1317 },
              { position: 6, name: 'V. Parrampu', time: '02:38:18', dorsal: 1361 },
              { position: 7, name: 'W. Parrampy', time: '02:39:45', dorsal: 1405 },
              { position: 8, name: 'X. Parramqa', time: '02:41:12', dorsal: 1449 },
              { position: 9, name: 'Y. Parramqe', time: '02:42:38', dorsal: 1493 },
              { position: 10, name: 'Z. Parramqi', time: '02:44:05', dorsal: 1537 },
            ]
          }
        ]
      },
      {
        id: 'ultra-50k',
        name: 'Ultra MaratÃ³n 50K DesafÃ­o',
        distanceKm: 50,
        totalParticipants: 280,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 168,
            results: [
              { position: 1, name: 'Z. Parramox', time: '03:45:12', dorsal: 801 },
              { position: 2, name: 'B. Parramoz', time: '03:47:28', dorsal: 845 },
              { position: 3, name: 'C. Parrampa', time: '03:49:45', dorsal: 889 },
              { position: 4, name: 'D. Parrampe', time: '03:52:12', dorsal: 933 },
              { position: 5, name: 'E. Parrampi', time: '03:54:38', dorsal: 977 },
              { position: 6, name: 'F. Parrampo', time: '03:57:05', dorsal: 1021 },
              { position: 7, name: 'G. Parrampu', time: '03:59:32', dorsal: 1065 },
              { position: 8, name: 'H. Parrampy', time: '04:02:05', dorsal: 1109 },
              { position: 9, name: 'I. Parramqa', time: '04:04:38', dorsal: 1153 },
              { position: 10, name: 'J. Parramqe', time: '04:07:12', dorsal: 1197 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 112,
            results: [
              { position: 1, name: 'A. Parramoy', time: '04:08:35', dorsal: 1241 },
              { position: 2, name: 'B. Parramoz', time: '04:11:12', dorsal: 1285 },
              { position: 3, name: 'C. Parrampa', time: '04:13:48', dorsal: 1329 },
              { position: 4, name: 'D. Parrampe', time: '04:16:25', dorsal: 1373 },
              { position: 5, name: 'E. Parrampi', time: '04:19:02', dorsal: 1417 },
              { position: 6, name: 'F. Parrampo', time: '04:21:38', dorsal: 1461 },
              { position: 7, name: 'G. Parrampu', time: '04:24:15', dorsal: 1505 },
              { position: 8, name: 'H. Parrampy', time: '04:26:52', dorsal: 1549 },
              { position: 9, name: 'I. Parramqa', time: '04:29:28', dorsal: 1593 },
              { position: 10, name: 'J. Parramqe', time: '04:32:05', dorsal: 1637 },
            ]
          }
        ]
      },
      {
        id: 'marcha-20k',
        name: 'Marcha Deportiva 20K TÃ©cnica',
        distanceKm: 20,
        totalParticipants: 450,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 270,
            results: [
              { position: 1, name: 'J. Parramqe', time: '01:36:15', dorsal: 1681 },
              { position: 2, name: 'K. Parramqi', time: '01:38:42', dorsal: 1725 },
              { position: 3, name: 'L. Parramqo', time: '01:41:08', dorsal: 1769 },
              { position: 4, name: 'M. Parramqu', time: '01:43:35', dorsal: 1813 },
              { position: 5, name: 'N. Parramra', time: '01:46:02', dorsal: 1857 },
              { position: 6, name: 'O. Parramre', time: '01:48:28', dorsal: 1901 },
              { position: 7, name: 'P. Parramri', time: '01:50:55', dorsal: 1945 },
              { position: 8, name: 'Q. Parramro', time: '01:53:22', dorsal: 1989 },
              { position: 9, name: 'R. Parramru', time: '01:55:48', dorsal: 2033 },
              { position: 10, name: 'S. Parramry', time: '01:58:15', dorsal: 2077 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 180,
            results: [
              { position: 1, name: 'K. Parramqi', time: '01:44:52', dorsal: 2121 },
              { position: 2, name: 'L. Parramqo', time: '01:47:18', dorsal: 2165 },
              { position: 3, name: 'M. Parramqu', time: '01:49:45', dorsal: 2209 },
              { position: 4, name: 'N. Parramra', time: '01:52:12', dorsal: 2253 },
              { position: 5, name: 'O. Parramre', time: '01:54:38', dorsal: 2297 },
              { position: 6, name: 'P. Parramri', time: '01:57:05', dorsal: 2341 },
              { position: 7, name: 'Q. Parramro', time: '01:59:32', dorsal: 2385 },
              { position: 8, name: 'R. Parramru', time: '02:01:58', dorsal: 2429 },
              { position: 9, name: 'S. Parramry', time: '02:04:25', dorsal: 2473 },
              { position: 10, name: 'T. Parramsa', time: '02:06:52', dorsal: 2517 },
            ]
          }
        ]
      },
      {
        id: 'caminata-5k',
        name: 'Caminata Solidaria 5K Familiar',
        distanceKm: 5,
        totalParticipants: 380,
        categories: [
          {
            id: 'masculino',
            name: 'CategorÃ­a Masculina',
            participants: 228,
            results: [
              { position: 1, name: 'U. Parramsa', time: '00:30:25', dorsal: 2561 },
              { position: 2, name: 'V. Parramse', time: '00:30:52', dorsal: 2605 },
              { position: 3, name: 'W. Parramsi', time: '00:31:18', dorsal: 2649 },
              { position: 4, name: 'X. Parramso', time: '00:31:45', dorsal: 2693 },
              { position: 5, name: 'Y. Parramsu', time: '00:32:12', dorsal: 2737 },
              { position: 6, name: 'Z. Parramsy', time: '00:32:38', dorsal: 2781 },
              { position: 7, name: 'A. Parramta', time: '00:33:05', dorsal: 2825 },
              { position: 8, name: 'B. Parramte', time: '00:33:32', dorsal: 2869 },
              { position: 9, name: 'C. Parramti', time: '00:33:58', dorsal: 2913 },
              { position: 10, name: 'D. Parramto', time: '00:34:25', dorsal: 2957 },
            ]
          },
          {
            id: 'femenino',
            name: 'CategorÃ­a Femenina',
            participants: 152,
            results: [
              { position: 1, name: 'E. Parramtu', time: '00:32:15', dorsal: 3001 },
              { position: 2, name: 'F. Parramty', time: '00:32:48', dorsal: 3045 },
              { position: 3, name: 'G. Parramua', time: '00:33:22', dorsal: 3089 },
              { position: 4, name: 'H. Parramue', time: '00:33:55', dorsal: 3133 },
              { position: 5, name: 'I. Parramui', time: '00:34:28', dorsal: 3177 },
              { position: 6, name: 'J. Parramuo', time: '00:35:02', dorsal: 3221 },
              { position: 7, name: 'K. Parramuu', time: '00:35:35', dorsal: 3265 },
              { position: 8, name: 'L. Parramuy', time: '00:36:08', dorsal: 3309 },
              { position: 9, name: 'M. Parramva', time: '00:36:42', dorsal: 3353 },
              { position: 10, name: 'N. Parramve', time: '00:37:15', dorsal: 3397 },
            ]
          }
        ]
      }
    ],
    location: 'Costanera de Formosa',
    startTime: '05:45 AM',
    weather: 'Lluvioso â€¢ 16Â°C',
    gallery: [],
    date: 'Domingo, 27 de Agosto 2023',
    info: 'Se implementaron rutas alternativas por clima, manteniendo la seguridad y experiencia del corredor.',
  }
];

export function getEditionById(id: string): EditionItem | undefined {
  return PAST_EDITIONS.find(e => e.id === id);
}

// Nota: el contenido corrupto serÃ¡ eliminado en el siguiente paso

// El contenido corrupto empieza aquÃ­
        { position: 3, name: 'R. GÃ³mez', time: '00:17:15', dorsal: 189 },
        { position: 4, name: 'A. Silva', time: '00:17:32', dorsal: 223 },
        { position: 5, name: 'M. GonzÃ¡lez', time: '00:17:49', dorsal: 267 },
        { position: 6, name: 'S. MartÃ­nez', time: '00:18:05', dorsal: 301 },
        { position: 7, name: 'C. RodrÃ­guez', time: '00:18:22', dorsal: 345 },
        { position: 8, name: 'T. VelÃ¡squez', time: '00:18:40', dorsal: 389 },
        { position: 9, name: 'D. HernÃ¡ndez', time: '00:18:57', dorsal: 433 },
        { position: 10, name: 'L. GarcÃ­a', time: '00:19:05', dorsal: 467 },
      ] },
      { id: '10k-1', name: '10K Competitiva Centro', distanceKm: 10, participants: 2100, winnerMale: { name: 'M. Ruiz', time: '00:31:10' }, winnerFemale: { name: 'A. Torres', time: '00:36:48' }, results: [
        { position: 1, name: 'M. Ruiz', time: '00:31:10', dorsal: 201 },
        { position: 2, name: 'D. Vargas', time: '00:31:35', dorsal: 245 },
        { position: 3, name: 'S. Molina', time: '00:32:02', dorsal: 289 },
        { position: 4, name: 'H. CÃ¡rdenas', time: '00:32:18', dorsal: 333 },
        { position: 5, name: 'L. Prieto', time: '00:32:41', dorsal: 377 },
        { position: 6, name: 'R. Acosta', time: '00:33:05', dorsal: 421 },
        { position: 7, name: 'E. MÃ©ndez', time: '00:33:22', dorsal: 465 },
        { position: 8, name: 'P. GÃ³mez', time: '00:33:40', dorsal: 509 },
        { position: 9, name: 'K. Silva', time: '00:34:02', dorsal: 553 },
        { position: 10, name: 'A. Torres', time: '00:34:20', dorsal: 597 },
      ] },
      { id: '15k-1', name: '15K Matutina EcolÃ³gica', distanceKm: 15, participants: 1800, winnerMale: { name: 'V. Castillo', time: '00:48:30' }, winnerFemale: { name: 'N. RÃ­os', time: '00:54:15' }, results: [
        { position: 1, name: 'V. Castillo', time: '00:48:30', dorsal: 301 },
        { position: 2, name: 'J. RamÃ­rez', time: '00:49:12', dorsal: 345 },
        { position: 3, name: 'C. LÃ³pez', time: '00:49:58', dorsal: 389 },
        { position: 4, name: 'F. Burgos', time: '00:50:42', dorsal: 433 },
        { position: 5, name: 'M. Cisneros', time: '00:51:25', dorsal: 477 },
        { position: 6, name: 'B. Vargas', time: '00:52:08', dorsal: 521 },
        { position: 7, name: 'T. Iglesias', time: '00:52:50', dorsal: 565 },
        { position: 8, name: 'S. CortÃ©s', time: '00:53:35', dorsal: 609 },
        { position: 9, name: 'G. Pena', time: '00:54:20', dorsal: 653 },
        { position: 10, name: 'N. RÃ­os', time: '00:54:15', dorsal: 697 },
      ] },
      { id: '21k-1', name: 'Media MaratÃ³n 21K Elite', distanceKm: 21, participants: 1400, winnerMale: { name: 'C. GÃ³mez', time: '01:07:55' }, winnerFemale: { name: 'P. Silva', time: '01:16:23' }, results: [
        { position: 1, name: 'C. GÃ³mez', time: '01:07:55', dorsal: 401 },
        { position: 2, name: 'A. RoldÃ¡n', time: '01:08:30', dorsal: 445 },
        { position: 3, name: 'J. HernÃ¡ndez', time: '01:09:10', dorsal: 489 },
        { position: 4, name: 'N. Ortega', time: '01:09:45', dorsal: 533 },
        { position: 5, name: 'T. PÃ©rez', time: '01:10:15', dorsal: 577 },
        { position: 6, name: 'F. Rivas', time: '01:10:58', dorsal: 621 },
        { position: 7, name: 'S. Caballero', time: '01:11:22', dorsal: 665 },
        { position: 8, name: 'R. Lozano', time: '01:11:59', dorsal: 709 },
        { position: 9, name: 'P. Silva', time: '01:12:24', dorsal: 753 },
        { position: 10, name: 'E. Contreras', time: '01:12:40', dorsal: 797 },
      ] },
      { id: '5k-2', name: '5K Nocturna Costanera', distanceKm: 5, participants: 2500, winnerMale: { name: 'W. Santos', time: '00:16:15' }, winnerFemale: { name: 'Y. Morales', time: '00:18:45' }, results: [
        { position: 1, name: 'W. Santos', time: '00:16:15', dorsal: 501 },
        { position: 2, name: 'O. Vega', time: '00:16:38', dorsal: 545 },
        { position: 3, name: 'K. Fuentes', time: '00:16:58', dorsal: 589 },
        { position: 4, name: 'U. Medina', time: '00:17:22', dorsal: 633 },
        { position: 5, name: 'X. Reyes', time: '00:17:45', dorsal: 677 },
        { position: 6, name: 'Z. Mendoza', time: '00:18:08', dorsal: 721 },
        { position: 7, name: 'Y. Morales', time: '00:18:45', dorsal: 765 },
        { position: 8, name: 'I. Flores', time: '00:19:12', dorsal: 809 },
        { position: 9, name: 'H. Campos', time: '00:19:38', dorsal: 853 },
        { position: 10, name: 'G. Navarro', time: '00:20:05', dorsal: 897 },
      ] },
      { id: '10k-2', name: '10K Tarde Familiar', distanceKm: 10, participants: 1950, winnerMale: { name: 'Q. Rivera', time: '00:30:55' }, winnerFemale: { name: 'W. GuzmÃ¡n', time: '00:36:20' }, results: [
        { position: 1, name: 'Q. Rivera', time: '00:30:55', dorsal: 601 },
        { position: 2, name: 'P. Salazar', time: '00:31:28', dorsal: 645 },
        { position: 3, name: 'O. ChÃ¡vez', time: '00:31:52', dorsal: 689 },
        { position: 4, name: 'N. JimÃ©nez', time: '00:32:18', dorsal: 733 },
        { position: 5, name: 'M. Quintero', time: '00:32:44', dorsal: 777 },
        { position: 6, name: 'L. Espinoza', time: '00:33:12', dorsal: 821 },
        { position: 7, name: 'K. DomÃ­nguez', time: '00:33:38', dorsal: 865 },
        { position: 8, name: 'W. GuzmÃ¡n', time: '00:36:20', dorsal: 909 },
        { position: 9, name: 'J. Andrade', time: '00:34:35', dorsal: 953 },
        { position: 10, name: 'I. Soto', time: '00:35:02', dorsal: 997 },
      ] },
      { id: 'maraton-42k', name: 'MaratÃ³n Completa 42K', distanceKm: 42, participants: 950, winnerMale: { name: 'X. Aguirre', time: '02:15:30' }, winnerFemale: { name: 'V. Franco', time: '02:28:45' }, results: [
        { position: 1, name: 'X. Aguirre', time: '02:15:30', dorsal: 701 },
        { position: 2, name: 'W. Bravo', time: '02:16:42', dorsal: 745 },
        { position: 3, name: 'V. Castro', time: '02:17:58', dorsal: 789 },
        { position: 4, name: 'U. Delgado', time: '02:19:15', dorsal: 833 },
        { position: 5, name: 'T. Estrada', time: '02:20:32', dorsal: 877 },
        { position: 6, name: 'S. Franco', time: '02:21:48', dorsal: 921 },
        { position: 7, name: 'V. Franco', time: '02:28:45', dorsal: 965 },
        { position: 8, name: 'R. GonzÃ¡lez', time: '02:30:18', dorsal: 1009 },
        { position: 9, name: 'Q. Herrera', time: '02:31:52', dorsal: 1053 },
        { position: 10, name: 'P. IbÃ¡Ã±ez', time: '02:33:25', dorsal: 1097 },
      ] },
      { id: 'maraton-ultra', name: 'Ultra MaratÃ³n 50K DesafÃ­o', distanceKm: 50, participants: 380, winnerMale: { name: 'O. JimÃ©nez', time: '03:42:15' }, winnerFemale: { name: 'U. LÃ³pez', time: '04:05:30' }, results: [
        { position: 1, name: 'O. JimÃ©nez', time: '03:42:15', dorsal: 801 },
        { position: 2, name: 'N. Keller', time: '03:44:28', dorsal: 845 },
        { position: 3, name: 'M. Llanos', time: '03:46:42', dorsal: 889 },
        { position: 4, name: 'L. Montoya', time: '03:49:05', dorsal: 933 },
        { position: 5, name: 'K. NarvÃ¡ez', time: '03:51:32', dorsal: 977 },
        { position: 6, name: 'J. Oliva', time: '03:53:58', dorsal: 1021 },
        { position: 7, name: 'U. LÃ³pez', time: '04:05:30', dorsal: 1065 },
        { position: 8, name: 'H. Parra', time: '04:08:12', dorsal: 1109 },
        { position: 9, name: 'G. Quintana', time: '04:10:45', dorsal: 1153 },
        { position: 10, name: 'F. Robles', time: '04:13:18', dorsal: 1197 },
      ] },
      { id: 'maraton-marcha', name: 'Marcha Deportiva 20K TÃ©cnica', distanceKm: 20, participants: 650, winnerMale: { name: 'E. Sanz', time: '01:34:20' }, winnerFemale: { name: 'D. Toro', time: '01:42:15' }, results: [
        { position: 1, name: 'E. Sanz', time: '01:34:20', dorsal: 901 },
        { position: 2, name: 'D. Toro', time: '01:42:15', dorsal: 945 },
        { position: 3, name: 'C. Uribe', time: '01:44:35', dorsal: 989 },
        { position: 4, name: 'B. Varela', time: '01:46:58', dorsal: 1033 },
        { position: 5, name: 'A. Veloz', time: '01:49:22', dorsal: 1077 },
        { position: 6, name: 'Z. Venegas', time: '01:51:45', dorsal: 1121 },
        { position: 7, name: 'Y. Vera', time: '01:54:12', dorsal: 1165 },
        { position: 8, name: 'X. Villalobos', time: '01:56:38', dorsal: 1209 },
        { position: 9, name: 'W. Villarreal', time: '01:59:05', dorsal: 1253 },
        { position: 10, name: 'V. Villena', time: '02:01:32', dorsal: 1297 },
      ] },
    ],
    location: 'Costanera de Formosa',
    startTime: '05:30 AM',
    weather: 'Soleado â€¢ 18Â°C',
    gallery: [],
    date: 'Domingo, 31 de Agosto 2025',
    info: 'Circuito certificado con puntos de hidrataciÃ³n cada 3 km y servicios mÃ©dicos en meta y ruta.',
  },
  {
    id: 'gesport-2024',
    year: 'GeSPORT 2024',
    image: require('../assets/images/edition2.jpeg'),
    description: 'Gran participaciÃ³n de clubes y una llegada espectacular en el Estadio OlÃ­mpico.',
    races: [
      { id: '5k-1', name: '5K Costanera Sur', distanceKm: 5, participants: 2800, winnerMale: { name: 'R. DÃ­az', time: '00:16:58' }, winnerFemale: { name: 'S. Arias', time: '00:19:22' }, results: [
        { position: 1, name: 'R. DÃ­az', time: '00:16:58', dorsal: 110 },
        { position: 2, name: 'E. Salgado', time: '00:17:15', dorsal: 154 },
        { position: 3, name: 'C. MuÃ±oz', time: '00:17:33', dorsal: 198 },
        { position: 4, name: 'I. Pineda', time: '00:17:50', dorsal: 242 },
        { position: 5, name: 'G. Camacho', time: '00:18:04', dorsal: 286 },
        { position: 6, name: 'B. Ãlvarez', time: '00:18:22', dorsal: 330 },
        { position: 7, name: 'T. Bravo', time: '00:18:35', dorsal: 374 },
        { position: 8, name: 'S. CastaÃ±o', time: '00:18:49', dorsal: 418 },
        { position: 9, name: 'J. Moya', time: '00:19:05', dorsal: 462 },
        { position: 10, name: 'S. Arias', time: '00:19:22', dorsal: 506 },
      ] },
      { id: '10k-1', name: '10K Competitiva Centro', distanceKm: 10, participants: 1950, winnerMale: { name: 'L. Castro', time: '00:31:44' }, winnerFemale: { name: 'D. Medina', time: '00:37:12' }, results: [
        { position: 1, name: 'L. Castro', time: '00:31:44', dorsal: 112 },
        { position: 2, name: 'J. Barrios', time: '00:32:01', dorsal: 156 },
        { position: 3, name: 'H. BeltrÃ¡n', time: '00:32:17', dorsal: 200 },
        { position: 4, name: 'M. Fajardo', time: '00:32:39', dorsal: 244 },
        { position: 5, name: 'S. Lugo', time: '00:32:55', dorsal: 288 },
        { position: 6, name: 'C. Rangel', time: '00:33:10', dorsal: 332 },
        { position: 7, name: 'E. Parra', time: '00:33:26', dorsal: 376 },
        { position: 8, name: 'D. Torres', time: '00:33:44', dorsal: 420 },
        { position: 9, name: 'D. Medina', time: '00:37:12', dorsal: 464 },
        { position: 10, name: 'A. NiÃ±o', time: '00:34:18', dorsal: 508 },
      ] },
      { id: '15k-1', name: '15K Matutina EcolÃ³gica', distanceKm: 15, participants: 1600, winnerMale: { name: 'F. GarcÃ­a', time: '00:48:15' }, winnerFemale: { name: 'H. LÃ³pez', time: '00:55:30' }, results: [
        { position: 1, name: 'F. GarcÃ­a', time: '00:48:15', dorsal: 200 },
        { position: 2, name: 'K. HernÃ¡ndez', time: '00:48:58', dorsal: 244 },
        { position: 3, name: 'L. Iglesias', time: '00:49:42', dorsal: 288 },
        { position: 4, name: 'M. JimÃ©nez', time: '00:50:25', dorsal: 332 },
        { position: 5, name: 'N. Kato', time: '00:51:08', dorsal: 376 },
        { position: 6, name: 'O. Lara', time: '00:51:52', dorsal: 420 },
        { position: 7, name: 'P. LÃ³pez', time: '00:52:35', dorsal: 464 },
        { position: 8, name: 'H. LÃ³pez', time: '00:55:30', dorsal: 508 },
        { position: 9, name: 'R. Mendoza', time: '00:54:05', dorsal: 552 },
        { position: 10, name: 'S. Morales', time: '00:54:48', dorsal: 596 },
      ] },
      { id: '21k-1', name: 'Media MaratÃ³n 21K Elite', distanceKm: 21, participants: 1200, winnerMale: { name: 'T. Navarro', time: '01:08:22' }, winnerFemale: { name: 'U. Ortiz', time: '01:17:15' }, results: [
        { position: 1, name: 'T. Navarro', time: '01:08:22', dorsal: 300 },
        { position: 2, name: 'V. Parra', time: '01:09:05', dorsal: 344 },
        { position: 3, name: 'W. Quiroz', time: '01:09:48', dorsal: 388 },
        { position: 4, name: 'X. RamÃ­rez', time: '01:10:32', dorsal: 432 },
        { position: 5, name: 'Y. Riquelme', time: '01:11:15', dorsal: 476 },
        { position: 6, name: 'Z. Rivera', time: '01:11:58', dorsal: 520 },
        { position: 7, name: 'A. Robles', time: '01:12:42', dorsal: 564 },
        { position: 8, name: 'U. Ortiz', time: '01:17:15', dorsal: 608 },
        { position: 9, name: 'B. Romero', time: '01:14:08', dorsal: 652 },
        { position: 10, name: 'C. Rosas', time: '01:14:52', dorsal: 696 },
      ] },
      { id: '5k-2', name: '5K Nocturna Costanera', distanceKm: 5, participants: 2200, winnerMale: { name: 'D. Salas', time: '00:16:32' }, winnerFemale: { name: 'E. SÃ¡nchez', time: '00:18:58' }, results: [
        { position: 1, name: 'D. Salas', time: '00:16:32', dorsal: 400 },
        { position: 2, name: 'F. Santana', time: '00:16:55', dorsal: 444 },
        { position: 3, name: 'G. Santiago', time: '00:17:18', dorsal: 488 },
        { position: 4, name: 'H. Silva', time: '00:17:42', dorsal: 532 },
        { position: 5, name: 'I. Soto', time: '00:18:05', dorsal: 576 },
        { position: 6, name: 'J. SuÃ¡rez', time: '00:18:28', dorsal: 620 },
        { position: 7, name: 'K. Tapia', time: '00:18:52', dorsal: 664 },
        { position: 8, name: 'L. Tello', time: '00:19:15', dorsal: 708 },
        { position: 9, name: 'E. SÃ¡nchez', time: '00:18:58', dorsal: 752 },
        { position: 10, name: 'M. Torres', time: '00:19:38', dorsal: 796 },
      ] },
      { id: '10k-2', name: '10K Tarde Familiar', distanceKm: 10, participants: 1750, winnerMale: { name: 'N. Trejo', time: '00:31:18' }, winnerFemale: { name: 'O. Uribe', time: '00:36:45' }, results: [
        { position: 1, name: 'N. Trejo', time: '00:31:18', dorsal: 500 },
        { position: 2, name: 'P. Urquiza', time: '00:31:52', dorsal: 544 },
        { position: 3, name: 'Q. ValdÃ©s', time: '00:32:25', dorsal: 588 },
        { position: 4, name: 'R. Valenzuela', time: '00:32:58', dorsal: 632 },
        { position: 5, name: 'S. Valverde', time: '00:33:32', dorsal: 676 },
        { position: 6, name: 'T. Vanegas', time: '00:34:05', dorsal: 720 },
        { position: 7, name: 'U. Vasconez', time: '00:34:38', dorsal: 764 },
        { position: 8, name: 'O. Uribe', time: '00:36:45', dorsal: 808 },
        { position: 9, name: 'V. VÃ¡zquez', time: '00:35:12', dorsal: 852 },
        { position: 10, name: 'W. Velasco', time: '00:35:45', dorsal: 896 },
      ] },
      { id: 'maraton-42k', name: 'MaratÃ³n Completa 42K', distanceKm: 42, participants: 850, winnerMale: { name: 'X. Veloz', time: '02:16:45' }, winnerFemale: { name: 'Y. Vera', time: '02:30:12' }, results: [
        { position: 1, name: 'X. Veloz', time: '02:16:45', dorsal: 600 },
        { position: 2, name: 'Z. Vergara', time: '02:18:02', dorsal: 644 },
        { position: 3, name: 'A. VergÃ©s', time: '02:19:18', dorsal: 688 },
        { position: 4, name: 'B. Verner', time: '02:20:35', dorsal: 732 },
        { position: 5, name: 'C. Vicente', time: '02:21:52', dorsal: 776 },
        { position: 6, name: 'D. VicuÃ±a', time: '02:23:08', dorsal: 820 },
        { position: 7, name: 'Y. Vera', time: '02:30:12', dorsal: 864 },
        { position: 8, name: 'E. Vickers', time: '02:25:42', dorsal: 908 },
        { position: 9, name: 'F. Videla', time: '02:27:05', dorsal: 952 },
        { position: 10, name: 'G. Vidal', time: '02:28:22', dorsal: 996 },
      ] },
      { id: 'maraton-ultra', name: 'Ultra MaratÃ³n 50K DesafÃ­o', distanceKm: 50, participants: 320, winnerMale: { name: 'H. Vilches', time: '03:43:58' }, winnerFemale: { name: 'I. Vilela', time: '04:07:15' }, results: [
        { position: 1, name: 'H. Vilches', time: '03:43:58', dorsal: 700 },
        { position: 2, name: 'J. Villagomez', time: '03:46:12', dorsal: 744 },
        { position: 3, name: 'K. Villalba', time: '03:48:35', dorsal: 788 },
        { position: 4, name: 'L. Villalobos', time: '03:51:05', dorsal: 832 },
        { position: 5, name: 'M. Villaneda', time: '03:53:38', dorsal: 876 },
        { position: 6, name: 'N. Villapol', time: '03:56:12', dorsal: 920 },
        { position: 7, name: 'I. Vilela', time: '04:07:15', dorsal: 964 },
        { position: 8, name: 'O. Vilchez', time: '03:59:48', dorsal: 1008 },
        { position: 9, name: 'P. Villareal', time: '04:02:22', dorsal: 1052 },
        { position: 10, name: 'Q. Villarre', time: '04:04:55', dorsal: 1096 },
      ] },
      { id: 'maraton-marcha', name: 'Marcha Deportiva 20K TÃ©cnica', distanceKm: 20, participants: 550, winnerMale: { name: 'R. Villegas', time: '01:35:05' }, winnerFemale: { name: 'S. Villena', time: '01:43:42' }, results: [
        { position: 1, name: 'R. Villegas', time: '01:35:05', dorsal: 800 },
        { position: 2, name: 'T. Villeroy', time: '01:37:28', dorsal: 844 },
        { position: 3, name: 'U. Villeta', time: '01:39:52', dorsal: 888 },
        { position: 4, name: 'V. Villetta', time: '01:42:15', dorsal: 932 },
        { position: 5, name: 'W. Villette', time: '01:44:38', dorsal: 976 },
        { position: 6, name: 'S. Villena', time: '01:43:42', dorsal: 1020 },
        { position: 7, name: 'X. Villain', time: '01:47:05', dorsal: 1064 },
        { position: 8, name: 'Y. VillaÃ±o', time: '01:49:28', dorsal: 1108 },
        { position: 9, name: 'Z. Villada', time: '01:51:52', dorsal: 1152 },
        { position: 10, name: 'A. Villeyes', time: '01:54:15', dorsal: 1196 },
      ] },
    ],
    location: 'Costanera de Formosa',
    startTime: '06:00 AM',
    weather: 'Parcial nublado â€¢ 20Â°C',
    gallery: [],
    date: 'Domingo, 25 de Agosto 2024',
    info: 'EdiciÃ³n con salida escalonada por oleadas y animaciÃ³n en puntos clave del recorrido.',
  },
  {
    id: 'gesport-2023',
    year: 'GeSPORT 2023',
    image: require('../assets/images/edition3.jpeg'),
    description: 'La lluvia no detuvo a miles de corredores que vivieron una jornada Ã©pica.',
    races: [
      { id: '5k-1', name: '5K Costanera Sur', distanceKm: 5, participants: 2200, winnerMale: { name: 'B. Zamora', time: '00:17:12' }, winnerFemale: { name: 'C. Zapata', time: '00:19:45' }, results: [
        { position: 1, name: 'B. Zamora', time: '00:17:12', dorsal: 115 },
        { position: 2, name: 'D. Zeballos', time: '00:17:35', dorsal: 159 },
        { position: 3, name: 'E. Zenteno', time: '00:17:58', dorsal: 203 },
        { position: 4, name: 'F. Zianya', time: '00:18:22', dorsal: 247 },
        { position: 5, name: 'G. Ziga', time: '00:18:45', dorsal: 291 },
        { position: 6, name: 'H. Ziraldo', time: '00:19:08', dorsal: 335 },
        { position: 7, name: 'I. Zoila', time: '00:19:32', dorsal: 379 },
        { position: 8, name: 'J. Zoraida', time: '00:19:55', dorsal: 423 },
        { position: 9, name: 'C. Zapata', time: '00:19:45', dorsal: 467 },
        { position: 10, name: 'K. Zorrilla', time: '00:20:18', dorsal: 501 },
      ] },
      { id: '10k-1', name: '10K Competitiva Centro', distanceKm: 10, participants: 1700, winnerMale: { name: 'A. LÃ³pez', time: '00:32:05' }, winnerFemale: { name: 'B. RincÃ³n', time: '00:37:40' }, results: [
        { position: 1, name: 'A. LÃ³pez', time: '00:32:05', dorsal: 201 },
        { position: 2, name: 'D. ArÃ©valo', time: '00:32:20', dorsal: 245 },
        { position: 3, name: 'O. PÃ¡ez', time: '00:32:40', dorsal: 289 },
        { position: 4, name: 'K. Galeano', time: '00:33:02', dorsal: 333 },
        { position: 5, name: 'J. Bonilla', time: '00:33:20', dorsal: 377 },
        { position: 6, name: 'Y. Rojas', time: '00:33:42', dorsal: 421 },
        { position: 7, name: 'R. DÃ­az', time: '00:33:55', dorsal: 465 },
        { position: 8, name: 'G. Caro', time: '00:34:10', dorsal: 509 },
        { position: 9, name: 'N. Sierra', time: '00:34:25', dorsal: 553 },
        { position: 10, name: 'B. RincÃ³n', time: '00:37:40', dorsal: 597 },
      ] },
      { id: '15k-1', name: '15K Matutina EcolÃ³gica', distanceKm: 15, participants: 1400, winnerMale: { name: 'L. Pacheco', time: '00:49:15' }, winnerFemale: { name: 'M. Padilla', time: '00:56:20' }, results: [
        { position: 1, name: 'L. Pacheco', time: '00:49:15', dorsal: 301 },
        { position: 2, name: 'N. Palacios', time: '00:50:02', dorsal: 345 },
        { position: 3, name: 'O. Palma', time: '00:50:48', dorsal: 389 },
        { position: 4, name: 'P. Palmada', time: '00:51:35', dorsal: 433 },
        { position: 5, name: 'Q. Pampas', time: '00:52:22', dorsal: 477 },
        { position: 6, name: 'R. Pandal', time: '00:53:08', dorsal: 521 },
        { position: 7, name: 'S. Pando', time: '00:53:55', dorsal: 565 },
        { position: 8, name: 'M. Padilla', time: '00:56:20', dorsal: 609 },
        { position: 9, name: 'T. Panel', time: '00:55:28', dorsal: 653 },
        { position: 10, name: 'U. Paniagua', time: '00:56:15', dorsal: 697 },
      ] },
      { id: '21k-1', name: 'Media MaratÃ³n 21K Elite', distanceKm: 21, participants: 1200, winnerMale: { name: 'E. Salas', time: '01:09:12' }, winnerFemale: { name: 'V. Rojas', time: '01:17:18' }, results: [
        { position: 1, name: 'E. Salas', time: '01:09:12', dorsal: 401 },
        { position: 2, name: 'M. RincÃ³n', time: '01:09:45', dorsal: 445 },
        { position: 3, name: 'S. Guerrero', time: '01:10:12', dorsal: 489 },
        { position: 4, name: 'C. Vargas', time: '01:10:44', dorsal: 533 },
        { position: 5, name: 'J. Tovar', time: '01:11:10', dorsal: 577 },
        { position: 6, name: 'P. Galeano', time: '01:11:36', dorsal: 621 },
        { position: 7, name: 'H. RiaÃ±o', time: '01:12:00', dorsal: 665 },
        { position: 8, name: 'E. Rojas', time: '01:12:24', dorsal: 709 },
        { position: 9, name: 'V. Becerra', time: '01:12:50', dorsal: 753 },
        { position: 10, name: 'V. Rojas', time: '01:17:18', dorsal: 797 },
      ] },
      { id: '5k-2', name: '5K Nocturna Costanera', distanceKm: 5, participants: 1800, winnerMale: { name: 'V. Pantoja', time: '00:16:48' }, winnerFemale: { name: 'W. Parada', time: '00:19:15' }, results: [
        { position: 1, name: 'V. Pantoja', time: '00:16:48', dorsal: 501 },
        { position: 2, name: 'X. Paranda', time: '00:17:12', dorsal: 545 },
        { position: 3, name: 'Y. Parejo', time: '00:17:35', dorsal: 589 },
        { position: 4, name: 'Z. Parente', time: '00:17:58', dorsal: 633 },
        { position: 5, name: 'A. Pareu', time: '00:18:22', dorsal: 677 },
        { position: 6, name: 'B. Pargua', time: '00:18:45', dorsal: 721 },
        { position: 7, name: 'C. Paridad', time: '00:19:08', dorsal: 765 },
        { position: 8, name: 'W. Parada', time: '00:19:15', dorsal: 809 },
        { position: 9, name: 'D. ParipÃ©', time: '00:19:32', dorsal: 853 },
        { position: 10, name: 'E. ParÃ­s', time: '00:19:55', dorsal: 897 },
      ] },
      { id: '10k-2', name: '10K Tarde Familiar', distanceKm: 10, participants: 1550, winnerMale: { name: 'F. Parodi', time: '00:31:52' }, winnerFemale: { name: 'G. Parraga', time: '00:37:05' }, results: [
        { position: 1, name: 'F. Parodi', time: '00:31:52', dorsal: 601 },
        { position: 2, name: 'H. PÃ¡rraga', time: '00:32:28', dorsal: 645 },
        { position: 3, name: 'I. PÃ¡ramo', time: '00:32:52', dorsal: 689 },
        { position: 4, name: 'J. Parque', time: '00:33:18', dorsal: 733 },
        { position: 5, name: 'K. Parrales', time: '00:33:44', dorsal: 777 },
        { position: 6, name: 'L. ParramÃ³n', time: '00:34:12', dorsal: 821 },
        { position: 7, name: 'M. Parral', time: '00:34:38', dorsal: 865 },
        { position: 8, name: 'G. Parraga', time: '00:37:05', dorsal: 909 },
        { position: 9, name: 'N. Parra', time: '00:35:02', dorsal: 953 },
        { position: 10, name: 'O. ParramÃ³n', time: '00:35:30', dorsal: 997 },
      ] },
      { id: 'maraton-42k', name: 'MaratÃ³n Completa 42K', distanceKm: 42, participants: 750, winnerMale: { name: 'P. Parral', time: '02:17:28' }, winnerFemale: { name: 'Q. Parralejo', time: '02:31:05' }, results: [
        { position: 1, name: 'P. Parral', time: '02:17:28', dorsal: 701 },
        { position: 2, name: 'R. Parramillo', time: '02:18:45', dorsal: 745 },
        { position: 3, name: 'S. ParramÃ³n', time: '02:20:02', dorsal: 789 },
        { position: 4, name: 'T. Parramort', time: '02:21:18', dorsal: 833 },
        { position: 5, name: 'U. Parramoso', time: '02:22:35', dorsal: 877 },
        { position: 6, name: 'V. Parramot', time: '02:23:52', dorsal: 921 },
        { position: 7, name: 'Q. Parralejo', time: '02:31:05', dorsal: 965 },
        { position: 8, name: 'W. Parramou', time: '02:25:08', dorsal: 1009 },
        { position: 9, name: 'X. Parramov', time: '02:26:25', dorsal: 1053 },
        { position: 10, name: 'Y. Parramow', time: '02:27:42', dorsal: 1097 },
      ] },
      { id: 'maraton-ultra', name: 'Ultra MaratÃ³n 50K DesafÃ­o', distanceKm: 50, participants: 280, winnerMale: { name: 'Z. Parramox', time: '03:45:12' }, winnerFemale: { name: 'A. Parramoy', time: '04:08:35' }, results: [
        { position: 1, name: 'Z. Parramox', time: '03:45:12', dorsal: 801 },
        { position: 2, name: 'B. Parramoz', time: '03:47:28', dorsal: 845 },
        { position: 3, name: 'C. Parrampa', time: '03:49:45', dorsal: 889 },
        { position: 4, name: 'D. Parrampe', time: '03:52:12', dorsal: 933 },
        { position: 5, name: 'E. Parrampi', time: '03:54:38', dorsal: 977 },
        { position: 6, name: 'F. Parrampo', time: '03:57:05', dorsal: 1021 },
        { position: 7, name: 'A. Parramoy', time: '04:08:35', dorsal: 1065 },
        { position: 8, name: 'G. Parrampu', time: '03:59:32', dorsal: 1109 },
        { position: 9, name: 'H. Parrampy', time: '04:02:05', dorsal: 1153 },
        { position: 10, name: 'I. Parramqa', time: '04:04:38', dorsal: 1197 },
      ] },
      { id: 'maraton-marcha', name: 'Marcha Deportiva 20K TÃ©cnica', distanceKm: 20, participants: 450, winnerMale: { name: 'J. Parramqe', time: '01:36:15' }, winnerFemale: { name: 'K. Parramqi', time: '01:44:52' }, results: [
        { position: 1, name: 'J. Parramqe', time: '01:36:15', dorsal: 901 },
        { position: 2, name: 'L. Parramqo', time: '01:38:42', dorsal: 945 },
        { position: 3, name: 'M. Parramqu', time: '01:41:08', dorsal: 989 },
        { position: 4, name: 'N. Parramra', time: '01:43:35', dorsal: 1033 },
        { position: 5, name: 'O. Parramre', time: '01:46:02', dorsal: 1077 },
        { position: 6, name: 'K. Parramqi', time: '01:44:52', dorsal: 1121 },
        { position: 7, name: 'P. Parramri', time: '01:48:28', dorsal: 1165 },
        { position: 8, name: 'Q. Parramro', time: '01:50:55', dorsal: 1209 },
        { position: 9, name: 'R. Parramru', time: '01:53:22', dorsal: 1253 },
        { position: 10, name: 'S. Parramry', time: '01:55:48', dorsal: 1297 },
      ] },
    ],
    location: 'Costanera de Formosa',
    startTime: '05:45 AM',
    weather: 'Lluvioso â€¢ 16Â°C',
    gallery: [],
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

  const mapRace = (r: any): RaceItem => {
    // Soporte para ambas estructuras: con categorÃ­as o con resultados planos
    let categories: RaceCategory[] | undefined;

    // Si tiene categorÃ­as en el backend, mapearlas
    if (Array.isArray(r?.categories)) {
      categories = r.categories.map((cat: any) => ({
        id: String(cat?.id ?? cat?.categoryId ?? 'category'),
        name: String(cat?.name ?? cat?.nombre ?? 'CategorÃ­a'),
        participants: cat?.participants ?? cat?.participantes,
        results: Array.isArray(cat?.results)
          ? cat.results.map((x: any, i: number) => ({
              position: Number(x?.position ?? x?.puesto ?? i + 1),
              name: String(x?.name ?? x?.nombre ?? 'N/D'),
              time: String(x?.time ?? x?.tiempo ?? 'â€”'),
              dorsal: x?.dorsal ?? x?.numeroDE ?? undefined,
            }))
          : undefined,
      }));
    }
    // Fallback: si tiene resultados planos, crearlos como una categorÃ­a genÃ©rica
    else if (Array.isArray(r?.results)) {
      categories = [
        {
          id: 'general',
          name: 'CategorÃ­a General',
          results: r.results.map((x: any, i: number) => ({
            position: Number(x?.position ?? x?.puesto ?? i + 1),
            name: String(x?.name ?? x?.nombre ?? 'N/D'),
            time: String(x?.time ?? x?.tiempo ?? 'â€”'),
            dorsal: x?.dorsal ?? x?.numeroDE ?? undefined,
          })),
        },
      ];
    }

    return {
      id: String(r?.id ?? r?._id ?? r?.slug ?? r?.name ?? 'race'),
      name: String(r?.name ?? r?.nombre ?? 'Carrera'),
      distanceKm: Number(r?.distanceKm ?? r?.distanciaKm ?? r?.distancia ?? 0),
      totalParticipants: r?.totalParticipants ?? r?.participants ?? r?.participantes,
      categories,
      winnerMale: r?.winnerMale ?? r?.ganadorHombre,
      winnerFemale: r?.winnerFemale ?? r?.ganadoraMujer,
      image: r?.image ?? r?.portada ?? null,
    };
  };

  return {
    id: String(api?.id ?? api?._id ?? api?.slug ?? 'edition'),
    year: String(api?.year ?? api?.title ?? api?.nombre ?? 'EdiciÃ³n'),
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

