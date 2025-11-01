import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { Activity as ActivityIcon, Calendar, LogOut, MapPin, Trophy, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { me, myEnrollments, myResults, uploadAvatar } from '../../lib/api';

type UserDoc = {
  _id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  avatarUrl?: string;
  pesoKg?: number;
  alturaCm?: number;
  role?: 'user' | 'admin' | 'superadmin' | string;
};

type EnrollmentDoc = {
  _id?: string;
  // Backend actual usa claves 'user' y 'event' y devuelve timestamps
  user?: string | { _id: string };
  event?: {
    _id: string;
    titulo?: string;
    nombre?: string; // compat
    fecha?: string; // ISO
    lugar?: string;
    categoria?: string;
    afiche?: string;
  } | string;
  createdAt?: string; // fecha de inscripción
  estado?: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
};

type ResultDoc = {
  _id?: string;
  usuario_id: string;
  evento_id: string;
  tiempo?: string;
  posicion?: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuth, user: authUser, refreshMe, signout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [results, setResults] = useState<ResultDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localRuns, setLocalRuns] = useState<{
    id: string;
    date: string;
    elapsedMs: number;
    distanceM: number;
    mode?: 'running' | 'walk' | 'cycling';
  }[]>([]);
  const [goals, setGoals] = useState<{ kmMonthly: number; actMonthly: number }>({ kmMonthly: 20, actMonthly: 8 });
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [goalsInputKm, setGoalsInputKm] = useState('');
  const [goalsInputAct, setGoalsInputAct] = useState('');

  const isSuperadmin = authUser?.role === 'superadmin';
  const isAdmin = authUser?.role === 'admin' || isSuperadmin;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [u, ins, res] = await Promise.all([
        me().catch(() => null),
        myEnrollments().catch(() => []),
        myResults().catch(() => []),
      ]);
      // Local override for avatar (if user changed it in this device)
  const avatarKey = authUser?._id ? `@gesport:profile:avatarUrl:${authUser._id}` : '@gesport:profile:avatarUrl';
  const localAvatar = await AsyncStorage.getItem(avatarKey);
  setProfile(u ? { ...u, avatarUrl: localAvatar || u.avatarUrl } : null);
      setEnrollments(Array.isArray(ins) ? ins : []);
      setResults(Array.isArray(res) ? res : []);
      // Load local activities
  const activitiesKey = authUser?._id ? `@gesport:activities:${authUser._id}` : '@gesport:activities:anon';
  const raw = await AsyncStorage.getItem(activitiesKey);
      const arr = raw ? JSON.parse(raw) : [];
      const mapped = Array.isArray(arr)
        ? arr.map((r: any) => ({
            id: r.id,
            date: r.date,
            elapsedMs: r.elapsedMs,
            distanceM: r.distanceM,
            mode: r.mode,
          }))
        : [];
      setLocalRuns(mapped);
      // Load user goals (local)
      const goalsKey = authUser?._id ? `@gesport:goals:${authUser._id}` : '@gesport:goals:anon';
      const gr = await AsyncStorage.getItem(goalsKey);
      if (gr) {
        try {
          const parsed = JSON.parse(gr);
          setGoals({
            kmMonthly: typeof parsed?.kmMonthly === 'number' ? parsed.kmMonthly : 20,
            actMonthly: typeof parsed?.actMonthly === 'number' ? parsed.actMonthly : 8,
          });
        } catch {}
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'No se pudo cargar el perfil.');
      setProfile(null);
      setEnrollments([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si no hay sesión, redirige al login
    if (!isAuth) {
      router.replace('/auth/LoginScreen');
      return;
    }
    // Si es superadmin, dirigirlo al panel minimalista
    if (authUser?.role === 'superadmin') {
      router.replace('/admin/AdminProfile');
      return;
    }
    // Refresca datos y carga perfil
    (async () => {
      try {
        await refreshMe().catch(() => {});
      } finally {
        loadData();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, authUser?._id, authUser?.role]);

  // Cuando vuelves a Perfil desde otra pestaña, recarga actividades locales
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const activitiesKey = authUser?._id ? `@gesport:activities:${authUser._id}` : '@gesport:activities:anon';
          const raw = await AsyncStorage.getItem(activitiesKey);
          const arr = raw ? JSON.parse(raw) : [];
          const mapped = Array.isArray(arr)
            ? arr.map((r: any) => ({
                id: r.id,
                date: r.date,
                elapsedMs: r.elapsedMs,
                distanceM: r.distanceM,
                mode: r.mode,
              }))
            : [];
          setLocalRuns(mapped);
          // Reaplicar avatar local si existe
          const avatarKey = authUser?._id ? `@gesport:profile:avatarUrl:${authUser._id}` : '@gesport:profile:avatarUrl';
          const localAvatar = await AsyncStorage.getItem(avatarKey);
            if (localAvatar) setProfile((prev) => (prev ? { ...prev, avatarUrl: localAvatar } : prev));
          // Reload goals on focus
          const goalsKey = authUser?._id ? `@gesport:goals:${authUser._id}` : '@gesport:goals:anon';
          const gr = await AsyncStorage.getItem(goalsKey);
          if (gr) {
            try {
              const parsed = JSON.parse(gr);
              setGoals({
                kmMonthly: typeof parsed?.kmMonthly === 'number' ? parsed.kmMonthly : 20,
                actMonthly: typeof parsed?.actMonthly === 'number' ? parsed.actMonthly : 8,
              });
            } catch {}
          }
        } catch {}
      })();
    }, [authUser?._id])
  );

  const displayName = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || profile.email || 'Usuario'
    : 'Usuario';

  const handleChangeAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para cambiar tu imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const { url } = await uploadAvatar(asset.uri);
      const avatarKey = authUser?._id ? `@gesport:profile:avatarUrl:${authUser._id}` : '@gesport:profile:avatarUrl';
      await AsyncStorage.setItem(avatarKey, url);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      Alert.alert('Listo', 'Foto de perfil actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la foto.');
    }
  };

  return (
    <>
    <AppShell
      title="Mi Perfil"
      showBack
      right={(
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cerrar',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await signout();
                  } finally {
                    router.replace('/auth/LoginScreen');
                  }
                },
              },
            ]);
          }}
          className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
          accessibilityLabel="Cerrar sesión"
        >
          <LogOut color="#FFFFFF" size={20} />
        </TouchableOpacity>
      )}
    >
      <View className="flex-1 bg-white">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-coffee mt-3">Cargando perfil...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center">{error}</Text>
          <View className="mt-4">
            <Button title="Reintentar" onPress={loadData} />
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Header estilo Adidas Running */}
          <View style={{ backgroundColor: '#E6EFF1' }}>
            <View style={{ height: 140, paddingHorizontal: 16, paddingTop: 24 }}>
              <Text className="text-black text-3xl font-extrabold">PERFIL</Text>
              {/* formas decorativas */}
              <View style={{ position: 'absolute', right: -30, top: 20, width: 160, height: 160, borderRadius: 80, backgroundColor: '#C7E3E6' }} />
              <View style={{ position: 'absolute', right: 30, top: 0, width: 90, height: 90, borderRadius: 45, backgroundColor: '#B6D7DB' }} />
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  activeOpacity={0.8}
                  style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 2, borderColor: '#F3F4F6' }}
                >
                  {profile?.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }} style={{ width: 92, height: 92, borderRadius: 46 }} />
                  ) : (
                    <UserIcon color="#9CA3AF" size={40} />
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text className="text-black text-2xl font-extrabold" numberOfLines={1}>{(displayName || '').toUpperCase()}</Text>
                  <Text className="text-gray-700 mt-1">🇦🇷 Argentina</Text>
                  <Text className="text-gray-400 mt-1">Añade una biografía a tu perfil</Text>
                </View>
              </View>
              {/* Botón de cambiar foto */}
              <TouchableOpacity onPress={handleChangeAvatar} className="mt-3">
                <Text className="text-black font-extrabold">CAMBIAR FOTO DE PERFIL</Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-4 bg-black rounded-lg px-4 py-3 items-center flex-row justify-center">
                <Text className="text-white font-extrabold tracking-wider">VER PERFIL COMPLETO</Text>
                <Text className="text-white ml-2">→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Objetivos */}
          <View className="px-6 mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-black text-xl font-extrabold">OBJETIVOS</Text>
              <TouchableOpacity
                onPress={() => {
                  setGoalsInputKm(String(goals.kmMonthly));
                  setGoalsInputAct(String(goals.actMonthly));
                  setGoalsModalOpen(true);
                }}
              >
                <Text className="text-primary font-semibold">Editar</Text>
              </TouchableOpacity>
            </View>
            {(() => {
              // Objetivos simples locales (mes actual)
              const now = new Date();
              const month = now.getMonth();
              const year = now.getFullYear();
              const runsThisMonth = localRuns.filter((r) => {
                const d = new Date(r.date);
                return d.getMonth() === month && d.getFullYear() === year;
              });
              const kmThisMonth = runsThisMonth.reduce((acc, r) => acc + (r.distanceM || 0), 0) / 1000;
              const actThisMonth = runsThisMonth.length;
              const kmGoal = goals.kmMonthly;
              const actGoal = goals.actMonthly;
              const pctKm = Math.min(1, kmThisMonth / kmGoal);
              const pctAct = Math.min(1, actThisMonth / actGoal);
              const Bar = ({ pct, color = '#111' }: { pct: number; color?: string }) => (
                <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                  <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: color }} />
                </View>
              );
              return (
                <>
                  <Card className="mt-3 border border-gray-100">
                    <Text className="text-gray-900 font-semibold">Kilómetros este mes</Text>
                    <Text className="text-gray-700 mt-1">{kmThisMonth.toFixed(1)} / {kmGoal} km</Text>
                    <Bar pct={pctKm} />
                  </Card>
                  <Card className="mt-3 border border-gray-100">
                    <Text className="text-gray-900 font-semibold">Actividades este mes</Text>
                    <Text className="text-gray-700 mt-1">{actThisMonth} / {actGoal} actividades</Text>
                    <Bar pct={pctAct} />
                  </Card>
                </>
              );
            })()}
          </View>

          {/* Acceso Admin (oculto a usuarios normales) */}
          {isAdmin ? (
            <View className="px-6 mt-6">
              <Text className="text-black text-xl font-extrabold">ADMIN</Text>
              <View className="flex-row gap-x-3 mt-3">
                <TouchableOpacity
                  onPress={() => router.push('/admin/EventsAdmin')}
                  className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
                >
                  <Text className="text-gray-800 mt-1">Administrar eventos</Text>
                </TouchableOpacity>
              </View>
              {isSuperadmin ? (
                <View className="flex-row gap-x-3 mt-3">
                  <TouchableOpacity
                    onPress={() => router.push('/admin/NewsAdmin')}
                    className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
                  >
                    <Text className="text-gray-800 mt-1">Administrar noticias</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/admin/UsersAdmin')}
                    className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
                  >
                    <Text className="text-gray-800 mt-1">Administrar usuarios</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Acciones rápidas */}
          <View className="px-6 mt-4">
            {/* Peso y altura del perfil */}
            <Card className="border border-gray-100">
              <Text className="text-gray-900 font-semibold">Mis datos físicos</Text>
              <View className="flex-row mt-2">
                <View className="flex-1">
                  <Text className="text-gray-700">Peso</Text>
                  <Text className="text-black font-extrabold text-lg">{profile?.pesoKg ?? '-'} kg</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700">Altura</Text>
                  <Text className="text-black font-extrabold text-lg">{profile?.alturaCm ?? '-'} cm</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Acciones rápidas */}
          <View className="px-6 mt-4">
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={() => router.push('/calendario/Calendar')}
                className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
              >
                <Calendar color="#111" size={20} />
                <Text className="text-gray-800 mt-2">Calendario</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/events/TodosEvents')}
                className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
              >
                <ActivityIcon color="#111" size={20} />
                <Text className="text-gray-800 mt-2">Explorar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Enlace público a Noticias */}
          <View className="px-6 mt-3">
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={() => router.push('/noticias/Index')}
                className="flex-1 bg-white rounded-xl px-4 py-3 items-center border border-gray-200"
              >
                <Text className="text-gray-800 mt-2">Noticias</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mis inscripciones */}
          <View className="px-6 mt-8">
            <Text className="text-coffee text-lg font-semibold mb-3">Mis Inscripciones</Text>
            {enrollments.length === 0 ? (
              <Text className="text-brown">Aún no te has inscrito en eventos.</Text>
            ) : (
              enrollments.map((enr, idx) => (
                <Card key={idx} className="mt-3 border border-gray-100">
                  {(() => {
                    const ev: any = typeof enr.event === 'string' ? { _id: enr.event } : enr.event;
                    const title = ev?.titulo || ev?.nombre || 'Evento';
                    const fechaEv = ev?.fecha ? new Date(ev.fecha) : null;
                    const fechaIns = enr.createdAt ? new Date(enr.createdAt) : null;
                    return (
                      <>
                        <View className="flex-row items-center">
                          <MapPin color="#2C1810" size={18} />
                          <Text className="text-gray-800 ml-2">{title}</Text>
                        </View>
                        {fechaEv ? (
                          <Text className="text-gray-700 mt-1">Fecha del evento: {fechaEv.toLocaleString()}</Text>
                        ) : null}
                        {fechaIns ? (
                          <Text className="text-gray-600 mt-1">Inscripto el: {fechaIns.toLocaleString()}</Text>
                        ) : null}
                      </>
                    );
                  })()}
                </Card>
              ))
            )}
          </View>

          {/* Mis resultados */}
          <View className="px-6 mt-8 mb-10">
            <Text className="text-coffee text-lg font-semibold mb-3">Mis Resultados</Text>
            {results.length === 0 ? (
              <Text className="text-brown">Aún no tienes resultados.</Text>
            ) : (
              results.map((r, idx) => (
                <Card key={idx} className="mt-3 border border-gray-100">
                  <View className="flex-row items-center">
                    <Trophy color="#2C1810" size={18} />
                    <Text className="text-gray-800 ml-2">Evento: {r.evento_id}</Text>
                  </View>
                  <Text className="text-gray-700 mt-1">Tiempo: {r.tiempo ?? '-'}</Text>
                  <Text className="text-gray-700 mt-1">Posición: {r.posicion ?? '-'}</Text>
                </Card>
              ))
            )}
          </View>

          {/* Mis Actividades (local) */}
          <View className="px-6 mt-2">
            <Text className="text-black text-xl font-extrabold">MIS ACTIVIDADES (LOCAL)</Text>
            {localRuns.length === 0 ? (
              <Text className="text-gray-700 mt-3">Aún no guardaste actividades.</Text>
            ) : (
              localRuns.map((r) => {
                const km = (r.distanceM / 1000).toFixed(2);
                const d = new Date(r.date);
                const pad = (n: number) => n.toString().padStart(2, '0');
                const h = Math.floor(r.elapsedMs / 3600000);
                const m = Math.floor((r.elapsedMs % 3600000) / 60000);
                const s = Math.floor((r.elapsedMs % 60000) / 1000);
                const emoji = r.mode === 'walk' ? '🚶' : r.mode === 'cycling' ? '🚴' : '🏃';
                const modeLabel = r.mode === 'walk' ? 'Caminata' : r.mode === 'cycling' ? 'Ciclismo' : 'Running';
                return (
                  <Card key={r.id} className="mt-3 border border-gray-100">
                    <Text className="text-gray-900 font-semibold">{d.toLocaleDateString()} {pad(d.getHours())}:{pad(d.getMinutes())}</Text>
                    <Text className="text-gray-700 mt-1">Tipo: {emoji} {modeLabel}</Text>
                    <Text className="text-gray-700 mt-1">Distancia: {km} km</Text>
                    <Text className="text-gray-700 mt-1">Tiempo: {pad(h)}:{pad(m)}:{pad(s)}</Text>
                  </Card>
                );
              })
            )}
          </View>

          {/* Secciones de calzado eliminadas */}

          {/* Sin herramientas: removidas según pedido */}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}
      </View>
  </AppShell>
    {/* Modal para editar objetivos */}
  <Modal
      visible={goalsModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setGoalsModalOpen(false)}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full p-5">
          <Text className="text-lg font-bold text-gray-900 mb-2">Editar objetivos</Text>
          <Text className="text-gray-700 mb-1">Kilómetros por mes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            keyboardType="numeric"
            value={goalsInputKm}
            onChangeText={setGoalsInputKm}
            placeholder="Ej: 50"
          />
          <Text className="text-gray-700 mb-1">Actividades por mes</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            keyboardType="numeric"
            value={goalsInputAct}
            onChangeText={setGoalsInputAct}
            placeholder="Ej: 8"
          />
          <View className="flex-row justify-end gap-2">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-gray-100"
              onPress={() => setGoalsModalOpen(false)}
            >
              <Text className="text-gray-800">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-primary"
              onPress={async () => {
                const km = Math.max(0, Math.round(Number(goalsInputKm || '0')));
                const act = Math.max(0, Math.round(Number(goalsInputAct || '0')));
                if (!isFinite(km) || !isFinite(act)) {
                  Alert.alert('Valores inválidos', 'Ingresá números válidos.');
                  return;
                }
                const next = { kmMonthly: km, actMonthly: act };
                setGoals(next);
                try {
                  const goalsKey = authUser?._id ? `@gesport:goals:${authUser._id}` : '@gesport:goals:anon';
                  await AsyncStorage.setItem(goalsKey, JSON.stringify(next));
                } catch {}
                setGoalsModalOpen(false);
              }}
            >
              <Text className="text-white font-medium">Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}
