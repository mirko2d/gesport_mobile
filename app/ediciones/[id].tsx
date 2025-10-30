import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, Cloud, MapPin } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, Text, View } from 'react-native';
import { getEdition } from '../../lib/api';
import { getEditionById, mapApiEditionToItem, type EditionItem } from '../../lib/editions';
import AppShell from '../components/AppShell';
import Card from '../components/ui/Card';

cssInterop(LinearGradient, { className: 'style' });

const screenWidth = Dimensions.get('window').width;

export default function EditionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [edition, setEdition] = useState<EditionItem | undefined>(undefined);
  const [marathons, setMarathons] = useState<{ title: string; distance: string; time?: string; location?: string; date?: string }[]>([]);

  useEffect(() => {
    (async () => {
      const id = params.id ? String(params.id) : undefined;
      if (!id) return;
      try {
        const data = await getEdition(id);
        if (data) {
          setEdition(mapApiEditionToItem(data));
          return;
        }
      } catch {
        // fallback local
      }
      setEdition(getEditionById(id));
    })();
  }, [params.id]);

  // Generate list of maratones for the year (4, 6 o 8 según edición)
  useEffect(() => {
    const id = params.id ? String(params.id) : undefined;
    if (!id) return;
    // Map fijo según pedido: 2023 -> 4, 2024 -> 6, 2025 -> 8
    const countMap: Record<string, number> = {
      'gesport-2023': 4,
      'gesport-2024': 6,
      'gesport-2025': 8,
    };
    const n = countMap[id] ?? 4;
    const distances = ['5K', '10K', '15K', '21K', '42K'];
    const times = ['05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM'];
    const location = 'Costanera de Formosa';
    const list = Array.from({ length: n }).map((_, i) => ({
      title: `Maratón Ciudad ${i + 1}`,
      distance: distances[i % distances.length],
      time: times[i % times.length],
      location,
      date: undefined,
    }));
    setMarathons(list);
  }, [params.id]);

  // Fallback simple por si no se encuentra
  const title = edition?.year ?? 'Edición';
  const image = edition?.image ?? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&auto=format&fit=crop&q=60';
  const description = edition?.description ?? 'Edición finalizada.';

  return (
    <AppShell showBack title={title}>
      <ScrollView className="flex-1">
        {/* Hero */}
        <View className="relative">
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={{ width: screenWidth, height: 260 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.0)"]}
            className="absolute top-0 left-0 right-0 h-40"
          />
          <View className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full">
            <Text className="text-white font-semibold text-xs">Finalizada</Text>
          </View>
          <View className="absolute bottom-4 left-4">
            <Text className="text-white text-2xl font-bold">{title}</Text>
            <Text className="text-white/80 mt-1">Edición anterior • Inscripciones no disponibles</Text>
          </View>
        </View>

        {/* Body */}
        <View className="p-4">
          <Text className="text-[#2C1810] text-lg font-bold mb-2">Resumen</Text>
          <Text className="text-[#5D4037] leading-6 mb-6">{description}</Text>

          {/* Carta: Maratones de ese año */}
          <View className="w-full mb-4">
            <Card>
              <Text className="text-[#2C1810] font-semibold mb-3">Maratones de {edition?.year || 'la edición'}</Text>
              {marathons.length ? (
                <View>
                  {marathons.map((m, idx) => (
                    <View key={idx} className="py-2 border-b border-gray-100">
                      <View className="flex-row items-center">
                        <View className="w-7 h-7 rounded-full bg-black items-center justify-center mr-3">
                          <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                        </View>
                        <Text className="text-[#2C1810] font-medium flex-1">{m.title}</Text>
                        <Text className="text-[#5D4037]">{m.distance}</Text>
                      </View>
                      <View className="flex-row items-center mt-1 ml-10">
                        <MapPin color="#4B5563" size={16} />
                        <Text className="text-[#5D4037] ml-2 flex-1">{m.location ?? 'Costanera de Formosa'}</Text>
                        <Clock color="#4B5563" size={16} />
                        <Text className="text-[#5D4037] ml-2">{m.time ?? ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-[#5D4037]">No hay maratones registradas para este año.</Text>
              )}
            </Card>
          </View>

          {/* Carta: Imágenes (galería) */}
          <View className="w-full mb-4">
            <Card>
              <Text className="text-[#2C1810] font-semibold mb-3">Imágenes</Text>
              {edition?.gallery?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {edition.gallery.map((g: any, idx: number) => (
                    <Image
                      key={idx}
                      source={typeof g === 'string' ? { uri: g } : g}
                      className="w-40 h-28 rounded-lg mr-3"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text className="text-[#5D4037]">Próximamente: fotos y momentos destacados de esta edición.</Text>
              )}
            </Card>
          </View>

          {/* Carta: Resultados (top 10 participantes) */}
          {edition?.races?.length ? (
            <View className="w-full mb-4">
              <Card>
                <Text className="text-[#2C1810] font-semibold mb-3">Resultados</Text>
                {edition.races.map((r) => (
                  <View key={r.id} className="mb-4">
                    <Text className="text-[#2C1810] font-bold mb-2">{r.name} • {r.distanceKm}K</Text>
                    {r.results?.length ? (
                      <View>
                        {r.results.slice(0, 10).map((res, idx) => (
                          <View key={idx} className="flex-row items-center py-1">
                            <View className="w-7 h-7 rounded-full bg-black items-center justify-center mr-3">
                              <Text className="text-white text-xs font-bold">{res.position}</Text>
                            </View>
                            <Text className="text-[#2C1810] flex-1">{res.name}</Text>
                            <Text className="text-[#5D4037]">{res.time}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text className="text-[#5D4037]">Resultados no disponibles.</Text>
                    )}
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          {/* Carta: Información (lugar, clima, horario) */}
          {/* Carta: Información (fecha, lugar, clima, horario) */}
          <View className="w-full mb-6">
            <Card>
              <Text className="text-[#2C1810] font-semibold mb-3">Información</Text>
              <View className="flex-row items-center mb-2">
                <Calendar color="#4B5563" size={18} />
                <Text className="text-[#5D4037] ml-2">{edition?.date ?? 'Fecha no disponible'}</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <MapPin color="#4B5563" size={18} />
                <Text className="text-[#5D4037] ml-2">{edition?.location ?? 'Ubicación no disponible'}</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Cloud color="#4B5563" size={18} />
                <Text className="text-[#5D4037] ml-2">{edition?.weather ?? 'Clima no disponible'}</Text>
              </View>
              <View className="flex-row items-center">
                <Clock color="#4B5563" size={18} />
                <Text className="text-[#5D4037] ml-2">Inicio: {edition?.startTime ?? 'Horario no disponible'}</Text>
              </View>
              {edition?.info ? (
                <Text className="text-[#5D4037] mt-3">{edition.info}</Text>
              ) : null}
            </Card>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
