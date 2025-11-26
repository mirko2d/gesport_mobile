import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Award, Calendar, Clock, Cloud, MapPin, Trophy, Zap } from 'lucide-react-native';
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

  // Fallback simple por si no se encuentra
  const title = edition?.year ?? 'Edición';
  const image = edition?.image ?? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&auto=format&fit=crop&q=60';
  const description = edition?.description ?? 'Edición finalizada.';
  
  // Calcular estadísticas generales
  const totalParticipants = (edition?.races || []).reduce((sum, r) => sum + (r.participants || 0), 0);
  const totalRaces = edition?.races?.length || 0;

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

          {/* Estadísticas generales */}
          <View className="flex-row gap-3 mb-4">
            <Card className="flex-1">
              <View className="items-center">
                <Trophy color="#D4A574" size={28} />
                <Text className="text-[#2C1810] font-bold text-lg mt-2">{totalRaces}</Text>
                <Text className="text-[#5D4037] text-xs">Maratones</Text>
              </View>
            </Card>
            <Card className="flex-1">
              <View className="items-center">
                <Award color="#D4A574" size={28} />
                <Text className="text-[#2C1810] font-bold text-lg mt-2">{totalParticipants.toLocaleString()}</Text>
                <Text className="text-[#5D4037] text-xs">Participantes</Text>
              </View>
            </Card>
          </View>

          {/* Resultados por cada maratón - Visual */}
          {edition?.races?.length ? (
            <View className="w-full mb-6">
              <Text className="text-[#2C1810] font-bold text-lg mb-3">🏆 Resultados</Text>
              {edition.races.map((race) => (
                <Card key={race.id} className="mb-4">
                  {/* Header maratón */}
                  <View className="mb-3 pb-3 border-b border-gray-200">
                    <Text className="text-[#2C1810] font-bold text-base">{race.name}</Text>
                    <Text className="text-[#5D4037] text-sm mt-1">
                      {race.participants?.toLocaleString()} participantes
                    </Text>
                    {race.recordTime && (
                      <View className="flex-row items-center mt-2 bg-yellow-50 px-2 py-1 rounded">
                        <Zap color="#D4A574" size={14} />
                        <Text className="text-[#2C1810] font-bold text-sm ml-1">{race.recordTime}</Text>
                        <Text className="text-[#5D4037] text-xs ml-1">Récord</Text>
                      </View>
                    )}
                  </View>

                  {/* Top 10 */}
                  {race.results && race.results.length > 0 ? (
                    <View>
                      {race.results.slice(0, 10).map((res, idx) => {
                        let medal = '';
                        if (idx === 0) medal = '🥇';
                        else if (idx === 1) medal = '🥈';
                        else if (idx === 2) medal = '🥉';

                        return (
                          <View 
                            key={idx}
                            className={`flex-row items-center py-2.5 px-2 rounded ${idx < 3 ? 'bg-yellow-50' : 'bg-gray-50'} ${idx < 9 ? 'border-b border-gray-100' : ''}`}
                          >
                            <Text className="text-lg font-bold mr-2 w-8">{medal || `${idx + 1}.`}</Text>
                            <View className="flex-1">
                              <Text className="text-[#2C1810] font-semibold text-sm">{res.name}</Text>
                              {res.dorsal && <Text className="text-[#8D6E63] text-xs mt-0.5">#{res.dorsal}</Text>}
                            </View>
                            <View className="items-end">
                              <Text className="text-[#2C1810] font-bold text-sm">{res.time}</Text>
                              {idx === 0 && <Text className="text-[#D4A574] text-xs font-semibold">Ganador</Text>}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text className="text-[#5D4037]">Sin resultados</Text>
                  )}
                </Card>
              ))}
            </View>
          ) : null}

          {/* Información (fecha, lugar, clima, horario) */}
          <View className="w-full mb-6">
            <Card>
              <Text className="text-[#2C1810] font-semibold mb-4 text-base">Información del Evento</Text>
              <View className="space-y-3">
                {edition?.date && (
                  <View className="flex-row items-center">
                    <Calendar color="#4B5563" size={20} />
                    <Text className="text-[#5D4037] ml-3 font-medium">{edition.date}</Text>
                  </View>
                )}
                {edition?.location && (
                  <View className="flex-row items-center">
                    <MapPin color="#4B5563" size={20} />
                    <Text className="text-[#5D4037] ml-3 font-medium">{edition.location}</Text>
                  </View>
                )}
                {edition?.weather && (
                  <View className="flex-row items-center">
                    <Cloud color="#4B5563" size={20} />
                    <Text className="text-[#5D4037] ml-3 font-medium">{edition.weather}</Text>
                  </View>
                )}
                {edition?.startTime && (
                  <View className="flex-row items-center">
                    <Clock color="#4B5563" size={20} />
                    <Text className="text-[#5D4037] ml-3 font-medium">Inicio: {edition.startTime}</Text>
                  </View>
                )}
              </View>
              {edition?.info && (
                <Text className="text-[#5D4037] mt-4 leading-5">{edition.info}</Text>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
