# GESport Mobile (Expo React Native)

## Requisitos
- Node.js 18+
- Expo CLI (`npm i -g expo`)

## Configuración
Edita `app/lib/api.ts` si necesitas cambiar la `baseURL` del backend (por defecto `http://localhost:4000`).

## Ejecutar
```bash
npm install
npm start
```
Escanea el QR con Expo Go o ejecuta en Android/iOS simulador.

## Flujo
1. **Login**: `/auth/signin` → guarda token Bearer.
2. **Perfil**: `/users/me`.
3. **Eventos**: `/events/` (listar). Inscripción con `/enrollments/`.
4. **Roles**: si tu usuario tiene `role: "admin" | "superadmin"`, podrás usar los endpoints de creación/eliminación (la UI básica está preparada para extenderse).

## Backend (Node + MongoDB)

El proyecto incluye una API sencilla en `backend/` compatible con la app.

### Requisitos
- MongoDB local o un cluster remoto (Atlas)
- Node.js 18+

### Pasos
1. Abrí una terminal en `backend/` y ejecutá:
	```bash
	npm install
	```
2. Configurá variables de entorno:
	- Copiá `.env.example` a `.env` y ajustá `MONGO_URI`, `JWT_SECRET` y `PORT`.
3. Semillas (opcional):
	```bash
	npm run seed
	```
	Crea usuarios de prueba:
	- super@gesport.test / super123 (superadmin)
	- admin@gesport.test / admin123 (admin)
	- user@gesport.test / user123 (user)
	Además crea 2 eventos y 2 ediciones de ejemplo.
4. Levantar el servidor:
	```bash
	npm run dev
	```
	Endpoint de salud: `GET http://localhost:4000/health` → `{ ok: true }`

### Endpoints principales
- Auth: `POST /auth/signup`, `POST /auth/signin`
- Usuarios: `GET /users/me`, `GET /users/`
- Roles: `POST /roles/set` (solo superadmin)
- Eventos: `GET /events/`, `POST /events/` (admin), `DELETE /events/delete/:id` (admin)
- Inscripciones: `POST /enrollments/` (body `{ evento_id }`), `DELETE /enrollments/` (body `{ evento_id }`), `GET /enrollments/mine`
- Ediciones: `GET /editions`, `GET /editions/:id`
- Resultados: `GET /results/mine` (por ahora devuelve `[]`)

### Conexión desde la app
Definí `EXPO_PUBLIC_API_BASE` en tu entorno de Expo para apuntar al backend:
- Android emulador: `http://10.0.2.2:4000`
- iOS/Web/PC: `http://localhost:4000`

En la pantalla de Login verás el URL actual del backend para diagnosticar.
