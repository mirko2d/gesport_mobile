// app/lib/api.ts
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Base URL:
 * - Android (AVD/BlueStacks): usa 10.0.2.2 para alcanzar el host
 * - iOS/Web/desktop: localhost
 */
// Try to auto-detect your LAN IP when running in Expo Go so physical devices can reach the backend.
// Fallbacks:
// - EXPO_PUBLIC_API_BASE if provided
// - LAN host from Expo dev server (e.g., 192.168.x.x)
// - Android emulator loopback (10.0.2.2)
// - localhost (web/desktop)
function deriveBaseURL(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE as string | undefined;
  if (envUrl) return envUrl;

  // In Expo Go (dev), try to read the host from the packager
  // debuggerHost looks like "192.168.0.10:19000" or "localhost:19000"
  // hostUri looks like "192.168.0.10:8081"
  const hostCandidate =
    // @ts-ignore - different SDKs expose either expoGoConfig or expoConfig
    Constants.expoGoConfig?.debuggerHost || Constants.expoConfig?.hostUri || "";

  if (hostCandidate) {
    const host = hostCandidate.split(":")[0];
    // Prefer LAN IPs over localhost so both emulator and physical devices work
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return `http://${host}:4000`;
    }
  }

  if (Platform.OS === "android") return "http://10.0.2.2:4000"; // Android emulator
  return "http://localhost:4000";
}

export const baseURL = deriveBaseURL();

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// ===== Auth header en memoria =====
export let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Interceptor (por si cambian headers entre screens)
api.interceptors.request.use((cfg) => {
  if (authToken && !cfg.headers?.Authorization) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${authToken}`;
  }
  return cfg;
});

// ====== Auth ======
export const signup = async (payload: {
  nombre: string;
  apellido: string;
  email: string;
  contrasenia: string;
}) => {
  const { data } = await api.post("/auth/signup", payload);
  return data; // string "El usuario ha sido creado con exito."
};

// ⚠️ El backend espera { email, contrasenia } (no "password")
export const signin = async (email: string, password: string) => {
  const { data } = await api.post("/auth/signin", {
    email,
    contrasenia: password,
  });
  // data = { token, user }
  setToken(data?.token ?? null);
  return data;
};

export const me = async () => (await api.get("/users/me")).data;
export const updateMe = async (payload: { pesoKg?: number; alturaCm?: number; nombre?: string; apellido?: string; avatarUrl?: string }) => (await api.patch('/users/me', payload)).data;
export const listUsersAdmin = async () => (await api.get("/users/")).data;

// Cambiar rol (solo superadmin)
export const setUserRole = async (
  user_id: string,
  role: "admin" | "user"
) => (await api.post("/roles/set", { user_id, role })).data;

// ====== Eventos ======
export const listEvents = async () => (await api.get("/events/")).data;
export const createEvent = async (payload: any) =>
  (await api.post("/events/", payload)).data;
export const deleteEvent = async (id: string) =>
  (await api.delete(`/events/delete/${id}`)).data;

// ====== Inscripciones ======
// El back maneja campos estilo DB: usuario_id / evento_id
export const enroll = async (event_id: string) =>
  (await api.post("/enrollments/", { evento_id: event_id })).data;

export const unenroll = async (event_id: string) =>
  (
    await api.delete("/enrollments/", {
      data: { evento_id: event_id },
    })
  ).data;

export const myEnrollments = async () =>
  (await api.get("/enrollments/mine")).data;

// ====== Resultados ======
export const myResults = async () => (await api.get("/results/mine")).data;

// ====== Ediciones (opcional, si tu backend las expone) ======
// Ajusta las rutas si tu API usa otros paths (por ejemplo: /past-editions)
export const listEditions = async () => (await api.get("/editions")).data;
export const getEdition = async (id: string) => (await api.get(`/editions/${id}`)).data;

// ====== Uploads ======
export const uploadAvatar = async (uri: string) => {
  const form = new FormData();
  // Infer file name and mime type
  const name = uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
  const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
  // @ts-ignore - React Native FormData file object
  form.append('avatar', { uri, name, type });

  // Do NOT force Content-Type header, let Axios/React Native set the correct multipart boundary
  const { data } = await api.post('/upload/avatar', form);
  return data as { url: string };
};
