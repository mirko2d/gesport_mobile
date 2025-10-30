import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { updateMe } from '../../../lib/api';
import Card from '../../components/ui/Card';

function toNumber(v: string) {
  // Permite coma o punto decimal: "70,5" -> "70.5"
  const normalized = v.replace(',', '.');
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  return isFinite(n) ? n : 0;
}

function classifyBMI(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return '-';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidad I';
  if (bmi < 40) return 'Obesidad II';
  return 'Obesidad III';
}

export default function BMICalculator() {
  const { user, refreshMe, isAuth } = useAuth();
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const isFirstRun = useRef(true);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const { bmi, idealMin, idealMax, category } = useMemo(() => {
    const w = toNumber(weightKg);
    const hCm = toNumber(heightCm);
    const h = hCm > 0 ? hCm / 100 : 0; // metros
    const bmiVal = h > 0 ? w / (h * h) : 0;
    // Rango saludable (OMS): 18.5 - 24.9
    const idealMinW = h > 0 ? 18.5 * h * h : 0;
    const idealMaxW = h > 0 ? 24.9 * h * h : 0;
    const cat = classifyBMI(bmiVal);
    return { bmi: bmiVal, idealMin: idealMinW, idealMax: idealMaxW, category: cat };
  }, [weightKg, heightCm]);

  const fmt1 = (n: number) => (isFinite(n) && n > 0 ? n.toFixed(1) : '-');
  const fmt2 = (n: number) => (isFinite(n) && n > 0 ? n.toFixed(2) : '-');

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Prefill from local storage or profile if available
  useEffect(() => {
    (async () => {
      try {
        const [wLocal, hLocal] = await Promise.all([
          AsyncStorage.getItem('@gesport:profile:pesoKg'),
          AsyncStorage.getItem('@gesport:profile:alturaCm'),
        ]);
        if (wLocal) setWeightKg(wLocal);
        if (hLocal) setHeightCm(hLocal);
      } catch {}
      if (user?.pesoKg) setWeightKg(String(user.pesoKg));
      if (user?.alturaCm) setHeightCm(String(user.alturaCm));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bmi, idealMin, idealMax, category, weightKg, heightCm]);

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
    ],
  } as const;

  const resultStyle = {
    opacity: resultAnim,
    transform: [
      { scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  } as const;

  // Auto-guardado con debounce cuando cambian los campos
  useEffect(() => {
    if (!isAuth) return; // requiere sesión
    if (isFirstRun.current) {
      // Evita auto-guardar en el primer render (prefill)
      isFirstRun.current = false;
      return;
    }
    // Persistir localmente siempre para continuidad entre sesiones
    AsyncStorage.setItem('@gesport:profile:pesoKg', weightKg).catch(() => {});
    AsyncStorage.setItem('@gesport:profile:alturaCm', heightCm).catch(() => {});
    const id = setTimeout(async () => {
      const w = toNumber(weightKg);
      const h = toNumber(heightCm);
      const payload: { pesoKg?: number; alturaCm?: number } = {};
      if (isFinite(w) && w > 0 && w !== (user?.pesoKg ?? 0)) payload.pesoKg = w;
      if (isFinite(h) && h > 0 && h !== (user?.alturaCm ?? 0)) payload.alturaCm = h;
      if (!payload.pesoKg && !payload.alturaCm) return;
      try {
        setSaving(true);
        await updateMe(payload);
        await refreshMe();
        setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(id);
  }, [weightKg, heightCm, isAuth, user?.pesoKg, user?.alturaCm, refreshMe]);

  // Si inicia sesión y hay datos locales, sincroniza si el servidor no los tiene
  useEffect(() => {
    if (!isAuth) return;
    (async () => {
      try {
        const [wLocal, hLocal] = await Promise.all([
          AsyncStorage.getItem('@gesport:profile:pesoKg'),
          AsyncStorage.getItem('@gesport:profile:alturaCm'),
        ]);
        const w = toNumber(wLocal || '');
        const h = toNumber(hLocal || '');
        const payload: { pesoKg?: number; alturaCm?: number } = {};
        if (isFinite(w) && w > 0 && w !== (user?.pesoKg ?? 0)) payload.pesoKg = w;
        if (isFinite(h) && h > 0 && h !== (user?.alturaCm ?? 0)) payload.alturaCm = h;
        if (payload.pesoKg || payload.alturaCm) {
          await updateMe(payload);
          await refreshMe();
          setSavedAt(Date.now());
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  return (
    <Card className="mt-3">
      <Animated.View style={headerStyle}>
        <Text className="text-[#2C1810] text-2xl font-extrabold tracking-tight">Medidor de IMC</Text>
        <LinearGradient
          colors={["#000000", "#222222"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3, borderRadius: 9999, marginTop: 6, width: 160 }}
        />
      </Animated.View>

      <View className="flex-row gap-3 mt-4">
        <View className="flex-1">
          <Text className="text-coffee font-semibold text-lg mb-2">Peso (kg)</Text>
          <View className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor="#7A7A7A"
              className="text-black text-lg"
            />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-coffee font-semibold text-lg mb-2">Altura (cm)</Text>
          <View className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor="#7A7A7A"
              className="text-black text-lg"
            />
          </View>
        </View>
      </View>

      <Animated.View className="mt-6" style={resultStyle}>
        <View className="items-center">
          <Text className="text-coffee text-sm uppercase tracking-wide">IMC</Text>
          <Text className="font-extrabold text-2xl text-black bg-gray-200 px-3 py-1.5 rounded-full mt-1">{fmt2(bmi)}</Text>
          <Text className="mt-2 text-lg font-semibold text-[#2C1810]">{category}</Text>
          <Text className="text-coffee mt-2 text-base text-center">
            Peso saludable aprox.: <Text className="font-semibold text-[#2C1810]">{fmt1(idealMin)}kg</Text> – <Text className="font-semibold text-[#2C1810]">{fmt1(idealMax)}kg</Text>
          </Text>
          <Text className="text-brown mt-1 text-xs">Referencia OMS: 18.5 – 24.9</Text>
          {/* Estado de auto-guardado */}
          {saving ? (
            <Text className="text-gray-500 text-xs mt-2">Guardando…</Text>
          ) : savedAt ? (
            <Text className="text-green-600 text-xs mt-2">Datos guardados</Text>
          ) : null}

          {/* Datos guardados del perfil */}
          {user ? (
            <View className="mt-3 bg-white rounded-xl px-4 py-3 border border-gray-200">
              <Text className="text-gray-800">Guardado en tu perfil:</Text>
              <Text className="text-gray-700 mt-1">Peso: <Text className="font-semibold">{user.pesoKg ?? '-'} kg</Text></Text>
              <Text className="text-gray-700">Altura: <Text className="font-semibold">{user.alturaCm ?? '-'} cm</Text></Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Card>
  );
}
