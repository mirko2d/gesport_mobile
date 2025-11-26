import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { listEditions } from '../../lib/api';
import { PAST_EDITIONS, mapApiEditionToItem, type EditionItem } from '../../lib/editions';
import AppShell from '../components/AppShell';
import Card from '../components/ui/Card';

cssInterop(LinearGradient, { className: 'style' });

// removed unused screenWidth

export default function EdicionesAnterioresScreen() {
  const [items, setItems] = useState<EditionItem[]>(PAST_EDITIONS);
  // const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await listEditions();
        if (Array.isArray(data) && data.length) {
          const mapped = data.map(mapApiEditionToItem);
          setItems(mapped);
        }
      } catch {
        // Fallback a PAST_EDITIONS si falla
        setItems(PAST_EDITIONS);
      } finally {
        // no-op
      }
    })();
  }, []);

  return (
    <AppShell showBack title="Ediciones Anteriores">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-[#2C1810] text-lg mb-4">
            Aquí puedes ver un resumen de nuestras ediciones pasadas. Las inscripciones no están disponibles porque estos eventos ya finalizaron.
          </Text>

          {/* Lista vertical de ediciones (una debajo de la otra) */}
          <View>
            {items.map((e, idx) => {
              // Limitar a máximo 4 maratones por edición
              const racesToShow = (e.races || []).slice(0, 4);
              return (
                <View key={idx} className="mb-6">
                  {/* Imagen de la edición */}
                  <View className="rounded-2xl overflow-hidden bg-white shadow mb-3">
                    <View className="relative">
                      <Image
                        source={typeof e.image === 'string' ? { uri: e.image } : e.image}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)"]}
                        className="absolute bottom-0 left-0 right-0 p-3"
                      >
                        <Text className="text-white font-bold text-lg">{e.year}</Text>
                        <Text className="text-white/80 text-xs mt-1">{e.date || 'Edición anterior'}</Text>
                      </LinearGradient>
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs">Finalizada</Text>
                      </View>
                    </View>
                  </View>

                  {/* Descripción */}
                  <Text className="text-[#2C1810] text-sm leading-5 mb-3">{e.description}</Text>

                  {/* Maratones de la edición (máximo 4) */}
                  {racesToShow.length > 0 && (
                    <Card className="mb-3">
                      <Text className="text-[#2C1810] font-semibold mb-3">Maratones ({racesToShow.length})</Text>
                      <View>
                        {racesToShow.map((race, rIdx) => {
                          // Récord de tiempo: del primer resultado de la primera categoría
                          const recordTime = race.recordTime || (race.results?.[0]?.time ?? 'N/A');
                          return (
                            <View key={rIdx} className={`py-2 ${rIdx < racesToShow.length - 1 ? 'border-b border-gray-200' : ''}`}>
                              <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                  <Text className="text-[#2C1810] font-semibold">{race.name}</Text>
                                  <Text className="text-[#5D4037] text-xs mt-0.5">
                                    {race.participants ? `${race.participants} participantes` : 'Participantes: N/A'}
                                  </Text>
                                </View>
                                <View className="items-end">
                                  <Text className="text-[#2C1810] font-bold text-base">{recordTime}</Text>
                                  <Text className="text-[#5D4037] text-xs">Récord</Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </Card>
                  )}

                  {/* Top 10 - mostrar resultados de la primera carrera */}
                  {racesToShow.length > 0 && racesToShow[0]?.results && racesToShow[0].results.length > 0 && (
                    <Card>
                      <Text className="text-[#2C1810] font-semibold mb-2">Top 10 - {racesToShow[0].name}</Text>
                      <View>
                        {racesToShow[0].results.slice(0, 10).map((result, rIdx) => (
                          <View key={rIdx} className={`py-1.5 flex-row items-center ${rIdx < 9 ? 'border-b border-gray-100' : ''}`}>
                            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-2">
                              <Text className="text-white text-xs font-bold">{result.position}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-[#2C1810] text-sm font-medium">{result.name}</Text>
                              {result.dorsal && (
                                <Text className="text-[#5D4037] text-xs">Dorsal: {result.dorsal}</Text>
                              )}
                            </View>
                            <Text className="text-[#2C1810] font-semibold">{result.time}</Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  )}

                  {/* Ver detalles link */}
                  <Link href={{ pathname: '/ediciones/[id]', params: { id: e.id } }} asChild>
                    <TouchableOpacity className="mt-3 py-2 px-4 bg-black rounded-lg items-center">
                      <Text className="text-white font-semibold">Ver detalles completos</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
