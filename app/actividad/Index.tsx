import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import AppShell from '../components/AppShell';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ActivityScreen() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [path, setPath] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [distanceM, setDistanceM] = useState(0);
  const locWatchRef = useRef<Location.LocationSubscription | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -26.1849,
    longitude: -58.1731,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [saving, setSaving] = useState(false);

  const tick = () => {
    if (running && startRef.current != null) {
      const now = Date.now();
      setElapsed(now - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
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
      return false;
    }
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) {
      setRegion((r) => ({ ...r, latitude: last.coords.latitude, longitude: last.coords.longitude }));
    } else {
      const current = await Location.getCurrentPositionAsync({});
      setRegion((r) => ({ ...r, latitude: current.coords.latitude, longitude: current.coords.longitude }));
    }
    return true;
  };

  const start = async () => {
    if (running) return;
    if (Platform.OS === 'web') {
      Alert.alert('Usa un dispositivo', 'El seguimiento con GPS funciona en un teléfono (Expo Go) o emulador con ubicación simulada.');
    }
    const ok = await requestLocation();
    if (!ok) return;
    const now = Date.now();
    startRef.current = now - elapsed; // resume support
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);

    // start watching location
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
  };

  const pause = () => {
    if (running) {
      setRunning(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (locWatchRef.current) {
        locWatchRef.current.remove();
        locWatchRef.current = null;
      }
    }
  };

  const reset = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setElapsed(0);
    if (locWatchRef.current) {
      locWatchRef.current.remove();
      locWatchRef.current = null;
    }
    setPath([]);
    setDistanceM(0);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
    path: Array<{ latitude: number; longitude: number }>;
  };

  const saveRun = async () => {
    if (running) {
      Alert.alert('Pausa primero', 'Pausa el cronómetro antes de guardar.');
      return;
    }
    if (distanceM < 10 || elapsed < 5000) {
      Alert.alert('Faltan datos', 'Registra al menos 10 m y 5 s antes de guardar.');
      return;
    }
    try {
      setSaving(true);
      const run: LocalRun = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        elapsedMs: elapsed,
        distanceM,
        path,
      };
      const key = '@gesport:activities';
      const raw = await AsyncStorage.getItem(key);
      const arr: LocalRun[] = raw ? JSON.parse(raw) : [];
      arr.unshift(run);
      await AsyncStorage.setItem(key, JSON.stringify(arr));
      Alert.alert('Actividad guardada', 'La encontrarás en tu Perfil.');
      reset();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Actividad">
      <View className="flex-1">
        {/* Timer */}
        <View className="px-6 py-6 items-center">
          <Text className="text-5xl font-extrabold tracking-wider">{formatTime(elapsed)}</Text>
          <Text className="text-gray-500 mt-2">Cronómetro</Text>
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
            <TouchableOpacity onPress={start} className="bg-black px-5 py-3 rounded-full">
              <Text className="text-white font-semibold">Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pause} className="bg-gray-800 px-5 py-3 rounded-full">
              <Text className="text-white font-semibold">Pausar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} className="bg-gray-200 px-5 py-3 rounded-full">
              <Text className="text-gray-800 font-semibold">Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveRun}
              disabled={running || saving || distanceM < 10 || elapsed < 5000}
              className={`px-5 py-3 rounded-full ${running || saving || distanceM < 10 || elapsed < 5000 ? 'bg-gray-300' : 'bg-green-600'}`}
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
              showsUserLocation
              followsUserLocation
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
        <View className="px-6 mt-6 mb-10">
          <View className="flex-row justify-between">
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"><Text>🏃 Running</Text></View>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"><Text>🚶 Caminata</Text></View>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"><Text>🚴 Ciclismo</Text></View>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"><Text>…</Text></View>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
