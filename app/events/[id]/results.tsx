import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { getEventResults } from '../../../lib/api';
import AppShell from '../../components/AppShell';
import Button from '../../components/ui/Button';

export default function EventResultsScreen() {
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<{ position: number; nombre?: string; apellido?: string; dorsal?: string | number; finishedAt?: string; timeMs?: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResults = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const list = await getEventResults(eventId);
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError('No se pudieron cargar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // Polling cada 5s para "casi tiempo real"
    timerRef.current = setInterval(fetchResults, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <AppShell showBack title="Resultados">
      <View className="px-4 py-3">
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
            <Text className="text-red-800 mb-1">{error}</Text>
            <View className="flex-row">
              <Button title="Reintentar" onPress={fetchResults} />
            </View>
          </View>
        ) : null}

        <ScrollView
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchResults} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {loading && items.length === 0 ? (
            <View className="items-center py-10">
              <ActivityIndicator />
              <Text className="text-gray-600 mt-2">Cargando resultados…</Text>
            </View>
          ) : items.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-gray-600">Aún no hay resultados publicados.</Text>
            </View>
          ) : (
            items.map((r) => (
              <View key={r.position} className="flex-row items-center p-3 border-b border-gray-100">
                <View className="w-12 items-center">
                  <Text className="text-gray-800 font-bold">#{r.position}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">{[r.nombre, r.apellido].filter(Boolean).join(' ') || 'Participante'}</Text>
                  <Text className="text-gray-500 text-xs">{r.dorsal ? `Dorsal ${r.dorsal}` : ''} {r.finishedAt ? `• ${new Date(r.finishedAt).toLocaleTimeString()}` : ''}</Text>
                </View>
                {typeof r.timeMs === 'number' ? (
                  <Text className="text-gray-800 font-semibold">{formatTime(r.timeMs)}</Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>

        <View className="mt-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary underline">Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppShell>
  );
}

function formatTime(ms?: number) {
  if (!ms || ms <= 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [h, m, s].map((n) => String(n).padStart(2, '0'));
  return parts.join(':');
}
