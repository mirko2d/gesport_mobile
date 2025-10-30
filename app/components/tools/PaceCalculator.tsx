import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextInput, View } from 'react-native';
import Card from '../../components/ui/Card';

export default function PaceCalculator() {
  const [distanceKm, setDistanceKm] = useState<string>('10');
  const [h, setH] = useState<string>('0');
  const [m, setM] = useState<string>('50');
  const [s, setS] = useState<string>('0');

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
  }, []);

  useEffect(() => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [paceSecPerKm, distanceKm, h, m, s]);

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
      <View className="flex-row gap-3">
        <View className="flex-1">
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
        <View className="flex-1">
          <Text className="text-coffee font-medium text-base mb-1">Horas</Text>
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
        <View className="flex-1">
          <Text className="text-coffee font-medium text-base mb-1">Min</Text>
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
        <View className="flex-1">
          <Text className="text-coffee font-medium text-base mb-1">Seg</Text>
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

      <Animated.View className="mt-4" style={resultStyle}>
        <Text className="text-coffee text-lg leading-6">
          Ritmo promedio:
          <Text> </Text>
          <Text className="font-extrabold text-3xl text-black bg-gray-200 px-3 py-1.5 rounded-full">
            {fmtPace(paceSecPerKm)}
          </Text>
        </Text>
        <View className="mt-4">
          <Text className="text-coffee font-semibold text-lg">Estimados:</Text>
          <Text className="text-coffee mt-1 text-lg">5K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(5)}</Text></Text>
          <Text className="text-coffee text-lg">10K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(10)}</Text></Text>
          <Text className="text-coffee text-lg">21K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(21.097)}</Text></Text>
          <Text className="text-coffee text-lg">42K: <Text className="font-extrabold text-xl text-[#2C1810]">{predict(42.195)}</Text></Text>
        </View>
      </Animated.View>
    </Card>
  );
}