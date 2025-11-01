import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../components/AppShell';

function formatTime(ms: number) {
  // Mostrar horas:minutos:segundos (HH:MM:SS)
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ActivityScreen() {
  const { user: authUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<'running' | 'walk' | 'cycling'>('running');
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [path, setPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const locWatchRef = useRef<Location.LocationSubscription | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'unknown' | 'ok' | 'denied' | 'error'>('unknown');
  const [region, setRegion] = useState<Region>({
    latitude: -26.1849,
    longitude: -58.1731,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [saving, setSaving] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);

  // Helpers de claves por usuario
  const suffix = authUser?._id ? `:${authUser._id}` : ':anon';
  const keyActivities = `@gesport:activities${suffix}`;
  const keyMode = `@gesport:activity:type${suffix}`;

  // Cargar y persistir el modo de actividad preferido
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(keyMode);
        if (saved === 'running' || saved === 'walk' || saved === 'cycling') setMode(saved);
      } catch {}
    })();
  }, [keyMode]);

  const selectMode = async (m: 'running' | 'walk' | 'cycling') => {
    setMode(m);
    try { await AsyncStorage.setItem(keyMode, m); } catch {}
  };

  const tick = () => {
    if (startRef.current != null) {
      const now = Date.now();
      setElapsed(now - startRef.current);
    }
  };

  // haversine distance (meters)
  const haversine = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const R = 6371000; // meters
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Activa los permisos de ubicación para registrar tu ruta.');
      setGpsStatus('denied');
      return false;
    }
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) {
      setRegion((r) => ({ ...r, latitude: last.coords.latitude, longitude: last.coords.longitude }));
      setGpsStatus('ok');
    } else {
      const current = await Location.getCurrentPositionAsync({});
      setRegion((r) => ({ ...r, latitude: current.coords.latitude, longitude: current.coords.longitude }));
      setGpsStatus('ok');
    }
    return true;
  };

  const start = async () => {
    if (controlsLocked) return;
    if (running) return;
    if (Platform.OS === 'web') {
      Alert.alert('Usa un dispositivo', 'El seguimiento con GPS funciona en un teléfono (Expo Go) o emulador con ubicación simulada.');
    }
    // Iniciar SIEMPRE el cronómetro, aunque no se otorguen permisos de ubicación
    const now = Date.now();
    startRef.current = now - elapsed; // soporte reanudar
    setRunning(true);
  // actualizar cada segundo (no mostramos milisegundos)
  timerRef.current = setInterval(tick, 1000) as unknown as number;

    // Intentar permisos y seguimiento de ubicación, pero no bloquear el cronómetro si falla
    try {
      const ok = await requestLocation();
      if (!ok) return; // sin permisos: seguimos solo con cronómetro
      locWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1500,
          distanceInterval: 5,
        },
        (pos) => {
          const pt = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setRegion((r) => ({ ...r, latitude: pt.latitude, longitude: pt.longitude }));
          setPath((prev) => {
            const next = prev.length ? [...prev, pt] : [pt];
            if (prev.length) {
              const inc = haversine(prev[prev.length - 1], pt);
              setDistanceM((d) => d + inc);
            }
            return next;
          });
        }
      );
    } catch {
      // Ignorar errores de GPS; el cronómetro ya está corriendo
      setGpsStatus('error');
    }
  };

  const pause = () => {
    if (running) {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (locWatchRef.current) {
        locWatchRef.current.remove();
        locWatchRef.current = null;
      }
    }
  };

  const reset = () => {
    if (controlsLocked) return;
    // Asegurar que todo está detenido antes de limpiar estados
    try {
      pause();
    } catch {}
    startRef.current = null;
    setElapsed(0);
    setPath([]);
    setDistanceM(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (locWatchRef.current) locWatchRef.current.remove();
    };
  }, []);

  const km = distanceM / 1000;
  const pace = useMemo(() => {
    if (km <= 0) return '00:00';
    const min = (elapsed / 1000) / 60 / km;
    const whole = Math.floor(min);
    const sec = Math.round((min - whole) * 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(whole)}:${pad(sec)}`;
  }, [elapsed, km]);

  type LocalRun = {
    id: string;
    date: string; // ISO
    elapsedMs: number;
    distanceM: number;
    path: { latitude: number; longitude: number }[];
    mode: 'running' | 'walk' | 'cycling';
  };

  const saveRun = async () => {
    if (controlsLocked) {
      Alert.alert('Bloqueo activado', 'Desbloquea los controles para poder guardar.');
      return;
    }
    try {
      setSaving(true);
      // Obtener una foto final del tiempo transcurrido en el momento del guardado
      const now = Date.now();
      const finalElapsed = startRef.current != null ? now - startRef.current : elapsed;
      // Si está corriendo, pausar automáticamente
      if (running) {
        pause();
      }
      const run: LocalRun = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        elapsedMs: finalElapsed,
        distanceM,
        path,
        mode,
      };
      const raw = await AsyncStorage.getItem(keyActivities);
      const arr: LocalRun[] = raw ? JSON.parse(raw) : [];
      arr.unshift(run);
      await AsyncStorage.setItem(keyActivities, JSON.stringify(arr));
      Alert.alert('Actividad guardada', 'La encontrarás en tu Perfil.');
      reset();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Actividad">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Timer */}
        <View className="px-6 py-6 items-center">
          <Text className="text-5xl font-extrabold tracking-wider">{formatTime(elapsed)}</Text>
          <Text className="text-gray-500 mt-2">Cronómetro</Text>
          <TouchableOpacity
            onPress={() => setControlsLocked((v) => !v)}
            className={`mt-3 px-4 py-2 rounded-full border ${controlsLocked ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
          >
            <Text className={`${controlsLocked ? 'text-red-700' : 'text-gray-800'}`}>
              {controlsLocked ? '🔒 Bloqueo activado' : '🔓 Bloquear controles'}
            </Text>
          </TouchableOpacity>
          {gpsStatus !== 'ok' && (
            <View className="mt-3 bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2">
              <Text className="text-yellow-800 text-sm">
                {Platform.OS === 'web'
                  ? 'El GPS no está disponible en web. Se medirá solo el tiempo.'
                  : gpsStatus === 'denied'
                  ? 'Permite la ubicación para medir distancia y ruta. Por ahora solo medimos el tiempo.'
                  : 'Sin señal de GPS. Continuamos contando el tiempo.'}
              </Text>
            </View>
          )}
          <View className="flex-row gap-x-6 mt-3">
            <View className="items-center">
              <Text className="text-2xl font-bold">{km.toFixed(2)}</Text>
              <Text className="text-gray-500 text-xs">km</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold">{pace}</Text>
              <Text className="text-gray-500 text-xs">min/km</Text>
            </View>
          </View>
          <View className="flex-row gap-x-3 mt-5">
            <TouchableOpacity onPress={start} disabled={controlsLocked} className={`px-5 py-3 rounded-full ${controlsLocked ? 'bg-gray-300' : 'bg-black'}`}>
              <Text className="text-white font-semibold">Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (running) return pause();
                // trying to resume
                if (controlsLocked) {
                  Alert.alert('Bloqueo activado', 'Desbloquea los controles para reanudar.');
                  return;
                }
                start();
              }}
              className="bg-gray-800 px-5 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">{running ? 'Pausar' : 'Reanudar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} disabled={controlsLocked} className={`px-5 py-3 rounded-full ${controlsLocked ? 'bg-gray-300' : 'bg-gray-200'}`}>
              <Text className="text-gray-800 font-semibold">Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveRun}
              disabled={saving || controlsLocked}
              className={`px-5 py-3 rounded-full ${saving || controlsLocked ? 'bg-gray-300' : 'bg-green-600'}`}
            >
              <Text className="text-white font-semibold">Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Map */}
        <View className="px-6">
          <View style={{ height: 320, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={region}
              region={region}
              showsUserLocation={gpsStatus === 'ok'}
              followsUserLocation={gpsStatus === 'ok'}
              showsMyLocationButton={false}
            >
              {path.length > 1 && (
                <Polyline
                  coordinates={path}
                  strokeColor="#111"
                  strokeWidth={4}
                />
              )}
              {path.length > 0 && (
                <Marker coordinate={path[0]} title="Inicio" />
              )}
            </MapView>
          </View>
        </View>

        {/* Quick modes */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => selectMode('running')}
              className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'running' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}
            >
              <Text className={`${mode === 'running' ? 'text-white' : 'text-gray-900'}`}>🏃 Running</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectMode('walk')}
              className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'walk' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}
            >
              <Text className={`${mode === 'walk' ? 'text-white' : 'text-gray-900'}`}>🚶 Caminata</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectMode('cycling')}
              className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'cycling' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}
            >
              <Text className={`${mode === 'cycling' ? 'text-white' : 'text-gray-900'}`}>🚴 Ciclismo</Text>
            </TouchableOpacity>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"><Text>…</Text></View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
