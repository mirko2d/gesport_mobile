import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../components/AppShell';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ActivityScreenWeb() {
  const { user: authUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<'running' | 'walk' | 'cycling'>('running');
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);

  const suffix = authUser?._id ? `:${authUser._id}` : ':anon';
  const keyActivities = `@gesport:activities${suffix}`;
  const keyMode = `@gesport:activity:type${suffix}`;

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

  const start = () => {
    if (controlsLocked || running) return;
    const now = Date.now();
    startRef.current = now - elapsed;
    setRunning(true);
    timerRef.current = setInterval(tick, 1000) as unknown as number;
  };

  const pause = () => {
    if (running) {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = () => {
    if (controlsLocked) return;
    try { pause(); } catch {}
    startRef.current = null;
    setElapsed(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const distanceM = 0; // En web no medimos distancia
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
      const now = Date.now();
      const finalElapsed = startRef.current != null ? now - startRef.current : elapsed;
      if (running) pause();
      const run: LocalRun = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        elapsedMs: finalElapsed,
        distanceM: 0,
        path: [],
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
        <View className="px-6 py-6 items-center">
          <Text className="text-5xl font-extrabold tracking-wider">{formatTime(elapsed)}</Text>
          <Text className="text-gray-500 mt-2">Cronómetro</Text>
          <View className="mt-3 bg-yellow-100 border border-yellow-300 rounded-xl px-3 py-2">
            <Text className="text-yellow-800 text-sm">En web medimos solo el tiempo. Para registrar rutas, usa un teléfono.</Text>
          </View>
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
          <View className="flex-row flex-wrap justify-center mt-5" style={{ rowGap: 10, columnGap: 10 }}>
            <TouchableOpacity
              onPress={start}
              disabled={controlsLocked}
              className={`${controlsLocked ? 'bg-gray-300' : 'bg-black'} px-5 py-3 rounded-full items-center`}
              style={{ minWidth: 140, flexGrow: 1, flexBasis: '45%' }}
            >
              <Text className="text-white font-semibold">Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (running) return pause();
                if (controlsLocked) {
                  Alert.alert('Bloqueo activado', 'Desbloquea los controles para reanudar.');
                  return;
                }
                start();
              }}
              className="bg-gray-800 px-5 py-3 rounded-full items-center"
              style={{ minWidth: 140, flexGrow: 1, flexBasis: '45%' }}
            >
              <Text className="text-white font-semibold">{running ? 'Pausar' : 'Reanudar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={reset}
              disabled={controlsLocked}
              className={`${controlsLocked ? 'bg-gray-300' : 'bg-gray-200'} px-5 py-3 rounded-full items-center`}
              style={{ minWidth: 140, flexGrow: 1, flexBasis: '45%' }}
            >
              <Text className="text-gray-800 font-semibold">Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveRun}
              disabled={saving || controlsLocked}
              className={`${saving || controlsLocked ? 'bg-gray-300' : 'bg-green-600'} px-5 py-3 rounded-full items-center`}
              style={{ minWidth: 140, flexGrow: 1, flexBasis: '45%' }}
            >
              <Text className="text-white font-semibold">Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Placeholder de mapa */}
        <View className="px-6">
          <View style={{ height: 320, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F4F6' }} className="items-center justify-center">
            <Text className="text-gray-600">Mapa no disponible en la versión web</Text>
          </View>
        </View>

        {/* Quick modes */}
        <View className="px-6 mt-6">
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            <TouchableOpacity onPress={() => selectMode('running')} className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'running' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}>
              <Text className={`${mode === 'running' ? 'text-white' : 'text-gray-900'}`}>🏃 Running</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectMode('walk')} className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'walk' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}>
              <Text className={`${mode === 'walk' ? 'text-white' : 'text-gray-900'}`}>🚶 Caminata</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectMode('cycling')} className={`rounded-xl px-4 py-3 shadow-sm border ${mode === 'cycling' ? 'bg-black border-black' : 'bg-white border-gray-100'}`}>
              <Text className={`${mode === 'cycling' ? 'text-white' : 'text-gray-900'}`}>🚴 Ciclismo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
