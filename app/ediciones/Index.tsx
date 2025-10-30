import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { listEditions } from '../../lib/api';
import { PAST_EDITIONS, mapApiEditionToItem, type EditionItem } from '../../lib/editions';
import AppShell from '../components/AppShell';

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
            {items.map((e, idx) => (
              <View key={idx} className="mb-4">
                <Link href={{ pathname: '/ediciones/[id]', params: { id: e.id } }} asChild>
                  <TouchableOpacity activeOpacity={0.9} className="rounded-2xl overflow-hidden bg-white shadow">
                    <View>
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
                        <Text className="text-white/80 text-xs mt-1" numberOfLines={1}>Ver detalles</Text>
                      </LinearGradient>
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs">Finalizada</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-[#2C1810] font-bold text-base">{e.year}</Text>
                      {e.date ? (
                        <Text className="text-[#5D4037] text-xs mt-0.5">{e.date}</Text>
                      ) : null}
                      <Text className="text-[#5D4037] text-sm mt-1" numberOfLines={3}>{e.description}</Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
