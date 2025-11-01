# Modularización (Guía rápida)

Este repo se dividió en módulos para facilitar escalabilidad y mantenimiento.

## Frontend (Expo/React Native)

- app/ … Rutas controladas por Expo Router (no mover archivos de ruta sin revisar enlaces).
- features/ … Lógica y utilidades por feature (sin rutas). Ej.: `features/events` con helpers reutilizables.
- types/ … Tipos compartidos de dominio (`types/domain.ts`).
- lib/ … API client y helpers de red.
- context/ … Contextos globales (Auth, etc.).
- app/components/ … UI reusable: ui/ (botones, tarjetas), tools/ (calculadoras), etc.

### Alias de importación

Se agregaron alias en `tsconfig.json`:

- `@app/*` → app/*
- `@components/*` → app/components/*
- `@context/*` → context/*
- `@lib/*` → lib/*
- `@features/*` → features/*
- `@types/*` → types/*

Uso:

```ts
import { isPastEvent } from '@features/events';
import type { User } from '@types/domain';
```

## Backend (Node/Express)

- routes/ … Solo define endpoints y delega a controllers.
- controllers/ … Orquesta validación simple y llamadas a services.
- services/ … Lógica de negocio y acceso a modelos.
- models/ … Esquemas Mongoose.

Ejemplo aplicado: `GET /events` ahora usa `controllers/eventsController -> services/eventsService`.

## Próximos pasos sugeridos

- Migrar más endpoints a controllers/services (enrollments, users, results).
- Extraer hooks y componentes por feature (events, profile, actividad) en `features/*`.
- Centralizar tipos de API en `types/` y usarlos en `lib/api.ts` y screens.
- Añadir tests ligeros para utilidades de features.
