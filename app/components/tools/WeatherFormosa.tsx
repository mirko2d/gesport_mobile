import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';

type WttrResponse = {
  current_condition?: Array<{
    temp_C?: string;
    FeelsLikeC?: string;
    humidity?: string;
    windspeedKmph?: string;
    winddir16Point?: string;
    weatherDesc?: Array<{ value: string }>;
  }>;
};

function pickIcon(desc: string) {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('lluvia')) return '🌧️';
  if (d.includes('storm') || d.includes('tormenta')) return '⛈️';
  if (d.includes('snow') || d.includes('nieve')) return '❄️';
  if (d.includes('cloud') || d.includes('nublado') || d.includes('nuboso')) return '☁️';
  if (d.includes('sun') || d.includes('soleado')) return '☀️';
  return '🌤️';
}

function toSentence(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function translateDesc(raw: string) {
  if (!raw) return '';
  const d = raw.toLowerCase();
  // Mapeos comunes EN -> ES (fallback por si la API devuelve en inglés)
  const dict: Array<[RegExp, string]> = [
    [/^sunny$/, 'soleado'],
    [/^clear$/, 'despejado'],
    [/^partly cloudy$/, 'parcialmente nublado'],
    [/^cloudy$/, 'nublado'],
    [/^overcast$/, 'cubierto'],
    [/^light rain$/, 'llovizna'],
    [/^patchy light rain$/, 'llovizna intermitente'],
    [/^moderate rain$/, 'lluvia moderada'],
    [/^heavy rain$/, 'lluvia intensa'],
    [/^thunderstorm$/, 'tormenta eléctrica'],
    [/^snow$/, 'nieve'],
    [/^light snow$/, 'nevadas leves'],
    [/^fog$/, 'niebla'],
    [/^mist$/, 'neblina'],
  ];
  for (const [re, es] of dict) {
    if (re.test(d)) return toSentence(es);
  }
  return toSentence(raw);
}

export default function WeatherFormosa() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WttrResponse | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      // Intentar obtener respuesta en español
      const res = await fetch('https://wttr.in/Formosa?format=j1&lang=es');
      if (!res.ok) throw new Error('No se pudo obtener el clima');
      const json = (await res.json()) as WttrResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar el clima');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const cc = data?.current_condition?.[0];
  const rawDesc = cc?.weatherDesc?.[0]?.value || '';
  const desc = useMemo(() => translateDesc(rawDesc), [rawDesc]);
  const icon = pickIcon(desc || rawDesc);
  const temp = cc?.temp_C ? `${cc.temp_C}°C` : '—';
  const feels = cc?.FeelsLikeC ? `${cc.FeelsLikeC}°C` : '—';
  const hum = cc?.humidity ? `${cc.humidity}%` : '—';
  const wind = cc?.windspeedKmph ? `${cc.windspeedKmph} km/h ${cc?.winddir16Point ?? ''}`.trim() : '—';

  return (
    <View className="rounded-2xl overflow-hidden mb-6 bg-white border border-gray-200">
      {/* Header con color */}
      <View className="px-4 py-3 bg-primary flex-row items-center justify-between">
        <Text className="text-lg font-bold text-white">Clima en Formosa</Text>
        <TouchableOpacity onPress={fetchWeather} disabled={loading}>
          <Text className="text-white/90 font-medium">Actualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-gray-600 mt-2">Cargando…</Text>
        </View>
      ) : error ? (
        <View className="p-4">
          <Text className="text-red-700">{error}</Text>
        </View>
      ) : (
        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-5xl mr-4">{icon}</Text>
            <View>
              <Text className="text-3xl font-extrabold text-gray-900">{temp}</Text>
              <Text className="text-gray-700 text-base">{desc || '—'}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100"><Text className="text-blue-900">Sensación: {feels}</Text></View>
            <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"><Text className="text-emerald-900">Humedad: {hum}</Text></View>
            <View className="bg-amber-50 px-3 py-1 rounded-full border border-amber-100"><Text className="text-amber-900">Viento: {wind}</Text></View>
          </View>

          <View className="items-end mt-4">
            <TouchableOpacity onPress={() => Linking.openURL('https://wttr.in/Formosa?lang=es')}>
              <Text className="text-primary underline">Ver pronóstico detallado</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
