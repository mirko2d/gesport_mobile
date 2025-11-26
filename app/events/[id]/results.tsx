import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useAuth } from '../../../context/AuthContext';
import { getEventResults } from '../../../lib/api';
import AppShell from '../../components/AppShell';
import Button from '../../components/ui/Button';

export default function EventResultsScreen() {
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<{ position: number; nombre?: string; apellido?: string; dorsal?: string | number; finishedAt?: string; timeMs?: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visibleOthers, setVisibleOthers] = useState(10);

  // Región Costanera (Formosa)
  const [region, setRegion] = useState<Region>({
    latitude: -26.1849,
    longitude: -58.1731,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Ruta simulada de la Costanera (puntos aproximados)
  const costaneraRoute = [
    { latitude: -26.1820, longitude: -58.1750 },
    { latitude: -26.1835, longitude: -58.1745 },
    { latitude: -26.1850, longitude: -58.1735 },
    { latitude: -26.1865, longitude: -58.1740 },
    { latitude: -26.1875, longitude: -58.1755 },
    { latitude: -26.1870, longitude: -58.1770 },
    { latitude: -26.1855, longitude: -58.1765 },
  ];

  // Heatmap: distribuir participantes a lo largo de la Costanera según posición
  const heatPoints = useMemo(() => {
    if (!items.length) return costaneraRoute.map((pt, idx) => ({
      lat: pt.latitude,
      lng: pt.longitude,
      count: 0,
    }));
    
    // Crear zonas a lo largo de la ruta (dividir en segmentos)
    const zones = costaneraRoute.map(pt => ({
      lat: pt.latitude,
      lng: pt.longitude,
      count: 0,
    }));
    
    // Distribuir participantes por posición en zonas de la Costanera
    items.forEach((item, idx) => {
      const zoneIdx = Math.floor((idx / Math.max(items.length, 1)) * costaneraRoute.length);
      const safeIdx = Math.min(zoneIdx, zones.length - 1);
      zones[safeIdx].count += 1;
    });
    
    return zones;
  }, [items]);

  const maxHeatCount = useMemo(
    () => heatPoints.reduce((m, p) => (p.count > m ? p.count : m), 0),
    [heatPoints]
  );

  const heatColor = (count: number) => {
    if (maxHeatCount <= 1) return 'rgba(255,0,0,0.5)';
    const r = count / maxHeatCount;
    if (r < 0.25) return 'rgba(0,0,255,0.35)';
    if (r < 0.5) return 'rgba(0,255,255,0.45)';
    if (r < 0.75) return 'rgba(255,165,0,0.55)';
    return 'rgba(255,0,0,0.65)';
  };

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

  const myResult = useMemo(() => {
    if (!authUser?._id || !items.length) return null;
    // Si la API incluye userId, úsalo; sino intenta emparejar por nombre/apellido
    const byId = (items as any).find((r: any) => r.userId === authUser._id);
    if (byId) return byId;
    const fullName = `${authUser?.nombre || ''}`.trim().toLowerCase() + ' ' + `${authUser?.apellido || ''}`.trim().toLowerCase();
    const match = items.find((r) => {
      const name = `${(r.nombre || '').toLowerCase()} ${(r.apellido || '').toLowerCase()}`.trim();
      return name && name === fullName.trim();
    });
    return match || null;
  }, [items, authUser?._id, authUser?.nombre, authUser?.apellido]);

  useEffect(() => {
    setVisibleOthers(10);
  }, [eventId]);

  const otherParticipants = useMemo(() => {
    if (!items.length) return [] as typeof items;
    if (!myResult) return items;
    const mr: any = myResult;
    return items.filter((r: any) => {
      if (mr.userId && r.userId) return r.userId !== mr.userId;
      const nameA = `${(r.nombre || '').toLowerCase()} ${(r.apellido || '').toLowerCase()}`.trim();
      const nameB = `${(mr.nombre || '').toLowerCase()} ${(mr.apellido || '').toLowerCase()}`.trim();
      return nameA !== nameB;
    });
  }, [items, myResult]);

  return (
    <AppShell showBack title="Resultados">
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchResults} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Mi resultado */}
        <View className="px-4 pt-4">
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-lg font-extrabold text-gray-900 mb-2">Mi Resultado</Text>
            {myResult ? (
              <View className="flex-row flex-wrap">
                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-gray-600">Posición</Text>
                  <Text className="font-extrabold text-gray-900">#{(myResult as any).position}</Text>
                </View>
                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-gray-600">Tiempo</Text>
                  <Text className="font-extrabold text-gray-900">{formatTime((myResult as any).timeMs)}</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-600">Dorsal</Text>
                  <Text className="font-extrabold text-gray-900">{(myResult as any).dorsal ?? '-'}</Text>
                </View>
              </View>
            ) : (
              <Text className="text-gray-700">Aún no aparece tu resultado en este evento.</Text>
            )}
          </View>
        </View>
        {error ? (
          <View className="px-4 py-3">
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
              <Text className="text-red-800 mb-1">{error}</Text>
              <View className="flex-row">
                <Button title="Reintentar" onPress={fetchResults} />
              </View>
            </View>
          </View>
        ) : null}

        {/* Mapa de calor y ruta */}
        <View className="px-4 py-4">
          <View style={{ height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={region}
              region={region}
              showsMyLocationButton={false}
            >
              {!showHeatmap && costaneraRoute.length > 1 && (
                <Polyline coordinates={costaneraRoute} strokeColor="#111" strokeWidth={4} />
              )}
              {showHeatmap &&
                heatPoints.map((hp, i) => (
                  <Circle
                    key={i}
                    center={{ latitude: hp.lat, longitude: hp.lng }}
                    radius={10 + (hp.count / (maxHeatCount || 1)) * 25}
                    strokeColor="transparent"
                    fillColor={heatColor(hp.count)}
                  />
                ))}
              {costaneraRoute.length > 0 && (
                <>
                  <Marker coordinate={costaneraRoute[0]} title="Inicio" />
                  <Marker
                    coordinate={costaneraRoute[costaneraRoute.length - 1]}
                    title="Meta"
                  />
                </>
              )}
            </MapView>
          </View>
          <View className="flex-row justify-end mt-3 gap-2">
            <TouchableOpacity
              onPress={() => setShowHeatmap(false)}
              className={`px-4 py-2 rounded-full border ${
                !showHeatmap ? 'bg-black border-black' : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={
                  !showHeatmap
                    ? 'text-white font-semibold text-sm'
                    : 'text-gray-800 font-semibold text-sm'
                }
              >
                Ruta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHeatmap(true)}
              className={`px-4 py-2 rounded-full border ${
                showHeatmap ? 'bg-black border-black' : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={
                  showHeatmap
                    ? 'text-white font-semibold text-sm'
                    : 'text-gray-800 font-semibold text-sm'
                }
              >
                Mapa de calor
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        {items.length > 0 && (
          <View className="px-4 py-3">
            <View className="bg-gray-100 rounded-lg p-3">
              <Text className="text-gray-900 font-semibold">Participantes: {items.length}</Text>
              {items[0] && (
                <Text className="text-gray-700 mt-1">
                  Ganador: {[items[0].nombre, items[0].apellido]
                    .filter(Boolean)
                    .join(' ') || 'Participante'} - {formatTime(items[0].timeMs)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Otros participantes (excluye mi resultado) */}
        <View className="px-4">
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
            <Text className="text-lg font-extrabold text-gray-900 mb-2">Otros participantes</Text>
            {otherParticipants.length === 0 ? (
              <Text className="text-gray-700">Aún no hay otros participantes para mostrar.</Text>
            ) : (
              otherParticipants.slice(0, visibleOthers).map((r) => {
                const pace = r.timeMs ? (r.timeMs / 1000 / 60 / 5).toFixed(2) : '-';
                return (
                  <View
                    key={`other-${r.position}`}
                    className="flex-row items-center p-3 bg-white border-b border-gray-100 last:border-b-0"
                  >
                    <View className="w-12 items-center justify-center bg-gray-100 rounded-full">
                      <Text className="text-gray-800 font-bold">{r.position}</Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-semibold">
                        {[r.nombre, r.apellido].filter(Boolean).join(' ') || 'Participante'}
                      </Text>
                      <Text className="text-gray-600 text-xs mt-1">
                        {r.dorsal ? `Dorsal ${r.dorsal}` : ''}
                        {r.finishedAt ? ` • ${new Date(r.finishedAt).toLocaleTimeString()}` : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      {typeof r.timeMs === 'number' && (
                        <Text className="text-gray-800 font-bold">{formatTime(r.timeMs)}</Text>
                      )}
                      {pace !== '-' && (
                        <Text className="text-gray-600 text-xs mt-1">{pace} min/km</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            {visibleOthers < otherParticipants.length && (
              <View className="mt-3">
                <TouchableOpacity
                  onPress={() => setVisibleOthers((v) => v + 10)}
                  className="w-full items-center justify-center bg-black rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Cargar más</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Lista de resultados */}
        <View className="px-4">
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
            items.map((r) => {
              const pace =
                r.timeMs && items.length > 0
                  ? (r.timeMs / 1000 / 60 / 5).toFixed(2) // Asumiendo 5km aprox
                  : '-';
              return (
                <View
                  key={r.position}
                  className="flex-row items-center p-3 bg-white border-b border-gray-100 rounded-lg mb-2"
                >
                  <View className="w-12 items-center justify-center bg-gray-100 rounded-full">
                    <Text className="text-gray-800 font-bold">{r.position}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-semibold">
                      {[r.nombre, r.apellido].filter(Boolean).join(' ') ||
                        'Participante'}
                    </Text>
                    <Text className="text-gray-600 text-xs mt-1">
                      {r.dorsal ? `Dorsal ${r.dorsal}` : ''}{' '}
                      {r.finishedAt ? `• ${new Date(r.finishedAt).toLocaleTimeString()}` : ''}
                    </Text>
                  </View>
                  <View className="items-end">
                    {typeof r.timeMs === 'number' && (
                      <Text className="text-gray-800 font-bold">
                        {formatTime(r.timeMs)}
                      </Text>
                    )}
                    {pace !== '-' && (
                      <Text className="text-gray-600 text-xs mt-1">{pace} min/km</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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

