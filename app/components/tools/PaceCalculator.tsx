import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Card from '../../components/ui/Card';

export default function PaceCalculator() {
  const [distanceKm, setDistanceKm] = useState<string>('10');
  const [h, setH] = useState<string>('0');
  const [m, setM] = useState<string>('50');
  const [s, setS] = useState<string>('0');
  const [age, setAge] = useState<string>('30');
  const [level, setLevel] = useState<'principiante' | 'intermedio' | 'profesional'>('intermedio');

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const toNumber = (v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  };

  const dist = toNumber(distanceKm);
  const totalSec = toNumber(h) * 3600 + toNumber(m) * 60 + toNumber(s);
  const paceSecPerKm = dist > 0 ? totalSec / dist : 0;

  // Calcular ritmo recomendado basado en edad y nivel
  const toAge = () => {
    const n = Number(age.replace(/[^0-9]/g, ''));
    return isFinite(n) ? n : 0;
  };

  const recommendedSecPerKm = (() => {
    const a = toAge();
    // Tabla base para corredor intermedio (10K) en segundos por km
    const baseTable = [
      { min: 0, max: 29, pace: 330 }, // 5:30
      { min: 30, max: 39, pace: 345 }, // 5:45
      { min: 40, max: 49, pace: 360 }, // 6:00
      { min: 50, max: 59, pace: 380 }, // 6:20
      { min: 60, max: 200, pace: 400 }, // 6:40
    ];
    const base = baseTable.find(r => a >= r.min && a <= r.max)?.pace ?? 360;
    let adj = base;
    if (level === 'principiante') adj += 40; // más conservador
    if (level === 'profesional') adj -= 40; // más exigente
    // Ajuste leve por distancia objetivo (si el usuario ingresa una distinta)
    if (dist >= 21) adj += 15; // medio maratón
    if (dist >= 42) adj += 15; // maratón (total +30)
    return adj;
  })();

  const diffSec = paceSecPerKm > 0 ? paceSecPerKm - recommendedSecPerKm : 0;

  const fmtPaceSimple = (secPerKm: number) => {
    if (!isFinite(secPerKm) || secPerKm <= 0) return '-';
    const mm = Math.floor(secPerKm / 60);
    const ss = Math.round(secPerKm % 60);
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const fmtTime = (sec: number) => {
    const t = Math.max(0, Math.round(sec));
    const hh = Math.floor(t / 3600);
    const mm = Math.floor((t % 3600) / 60);
    const ss = t % 60;
    const parts = [hh, mm, ss].map((x) => String(x).padStart(2, '0'));
    return parts.join(':');
  };

  const fmtPace = (secPerKm: number) => {
    if (!isFinite(secPerKm) || secPerKm <= 0) return '-';
    const mm = Math.floor(secPerKm / 60);
    const ss = Math.round(secPerKm % 60);
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} /km`;
  };

  const predict = (targetKm: number) => (paceSecPerKm > 0 ? fmtTime(paceSecPerKm * targetKm) : '-');

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  useEffect(() => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [paceSecPerKm, distanceKm, h, m, s, resultAnim]);

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
      },
    ],
  } as const;

  const resultStyle = {
    opacity: resultAnim,
    transform: [
      {
        scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }),
      },
    ],
  } as const;

  return (
    <Card className="mt-3">
      <Animated.View style={headerStyle}>
        <Text className="text-[#2C1810] text-xl font-extrabold tracking-tight">Calculadora de Ritmo</Text>
        <LinearGradient
          colors={["#000000", "#222222"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3, borderRadius: 9999, marginTop: 6, width: 160 }}
        />
      </Animated.View>
      {/* Inputs en dos filas: distancia full-width y luego H/M/S que envuelven en pantallas chicas */}
      <View>
        <View style={{ marginTop: 8 }}>
          <Text className="text-coffee font-medium text-base mb-1">Distancia (km)</Text>
          <View className="bg-white rounded-lg px-3 py-2">
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              placeholder="e.g. 10"
              placeholderTextColor="#8E6E62"
              className="text-coffee text-base"
            />
          </View>
        </View>
        <View className="mt-4">
          <Text className="text-coffee font-medium text-base mb-1">Edad</Text>
          <View className="bg-white rounded-lg px-3 py-2 mb-4">
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor="#8E6E62"
              className="text-coffee text-base"
            />
          </View>
          <Text className="text-coffee font-medium text-base mb-2">Nivel</Text>
          <View className="flex-row justify-between gap-2">
            {(['Principiante','Intermedio','Profesional'] as const).map(l => (
              <TouchableOpacity
                key={l}
                onPress={() => setLevel(l.toLowerCase() as 'principiante' | 'intermedio' | 'profesional')}
                className={`flex-1 px-3 py-2.5 rounded-lg border font-semibold ${level===l.toLowerCase()?'bg-black border-black':'bg-white border-gray-300'}`}
              >
                <Text className={`text-center font-semibold text-xs ${level===l.toLowerCase()?'text-white':'text-coffee'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-3 mt-3">
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="text-coffee font-medium text-base mb-1">Hora</Text>
            <View className="bg-white rounded-lg px-3 py-2">
              <TextInput
                value={h}
                onChangeText={setH}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#8E6E62"
                className="text-coffee text-base"
              />
            </View>
          </View>
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="text-coffee font-medium text-base mb-1">Minuto</Text>
            <View className="bg-white rounded-lg px-3 py-2">
              <TextInput
                value={m}
                onChangeText={setM}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#8E6E62"
                className="text-coffee text-base"
              />
            </View>
          </View>
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="text-coffee font-medium text-base mb-1">Segundo</Text>
            <View className="bg-white rounded-lg px-3 py-2">
              <TextInput
                value={s}
                onChangeText={setS}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#8E6E62"
                className="text-coffee text-base"
              />
            </View>
          </View>
        </View>
      </View>

        <View className="mt-4">
          <Text className="text-gray-900 text-base font-semibold">Ritmo promedio</Text>
          <View className="mt-2">
            <Text className="font-extrabold text-3xl text-black bg-gray-200 px-3 py-1.5 rounded-full">
              {fmtPace(paceSecPerKm)}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <Text className="text-gray-900 text-base font-semibold">Ritmo recomendado (edad & nivel)</Text>
          <Text className="font-extrabold text-2xl text-black bg-gray-100 px-3 py-1.5 rounded-full mt-2">
            {fmtPace(recommendedSecPerKm)}
          </Text>
          {paceSecPerKm > 0 && recommendedSecPerKm > 0 && (
            <Text className="mt-2 text-coffee">
              {diffSec < 0
                ? `Vas ${Math.abs(Math.round(diffSec))}s más rápido por km que el recomendado.`
                : diffSec > 0
                  ? `Vas ${Math.round(diffSec)}s más lento por km que el recomendado.`
                  : 'Exactamente en el ritmo recomendado.'}
            </Text>
          )}
        </View>
        <View className="mt-4">
          <Text className="text-coffee font-semibold text-lg">Estimado por tu ritmo actual:</Text>
          <Text className="text-coffee mt-1 text-lg">5K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(5)}</Text></Text>
          <Text className="text-coffee text-lg">10K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(10)}</Text></Text>
          <Text className="text-coffee text-lg">21K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(21.097)}</Text></Text>
          <Text className="text-coffee text-lg">42K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(42.195)}</Text></Text>
        </View>
        <View className="mt-4 pt-4 border-t border-gray-300">
          <Text className="text-coffee font-semibold text-lg">Estimado por tu nivel ({level}):</Text>
          <Text className="text-coffee mt-1 text-lg">5K: <Text className="font-extrabold text-xl text-[#2C1810]">{fmtTime(recommendedSecPerKm * 5)}</Text></Text>
          <Text className="text-coffee text-lg">10K: <Text className="font-extrabold text-xl text-[#2C1810]">{fmtTime(recommendedSecPerKm * 10)}</Text></Text>
          <Text className="text-coffee text-lg">21K: <Text className="font-extrabold text-xl text-[#2C1810]">{fmtTime(recommendedSecPerKm * 21.097)}</Text></Text>
          <Text className="text-coffee text-lg">42K: <Text className="font-extrabold text-xl text-[#2C1810]">{fmtTime(recommendedSecPerKm * 42.195)}</Text></Text>
        </View>
    </Card>
  );
}