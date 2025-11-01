// Shared domain types used across the mobile app

export type Role = 'user' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  nombre?: string;
  apellido?: string;
  email: string;
  avatarUrl?: string;
  role?: Role;
  alturaCm?: number;
  pesoKg?: number;
}

export interface EventDTO {
  _id: string;
  titulo?: string;
  nombre?: string; // legacy
  fecha?: string; // ISO
  hora?: string;
  lugar?: string;
  ubicacion?: string;
  categoria?: string;
  image?: string;
  afiche?: string;
  participantes?: number;
  maxParticipantes?: number | null;
  cupos?: number;
}

export interface EnrollmentDTO {
  _id: string;
  event: string | EventDTO;
  user: string | User;
  createdAt?: string;
}

export type ActivityType = 'run' | 'walk' | 'bike';

export interface LocalActivity {
  id: string;
  userId: string;
  type: ActivityType;
  dateISO: string;
  durationSec: number;
  distanceKm: number;
  avgPace?: string;
}
