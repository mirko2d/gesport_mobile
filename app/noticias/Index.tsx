import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { listNews } from '../../lib/api';
import AppShell from '../components/AppShell';
import Card from '../components/ui/Card';

export default function NoticiasIndex() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listNews();
        setItems(Array.isArray(data) ? data.filter((x: any) => x.published !== false) : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell title="Noticias">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-3">Cargando...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {items.length === 0 ? (
            <Text className="text-gray-600">No hay noticias por el momento.</Text>
          ) : null}
          {items.map((it) => (
            <Card key={it._id} className="mb-3">
              <Text className="text-black text-lg font-extrabold">{it.title}</Text>
              {it.imageUrl ? (
                <Image source={{ uri: it.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 10, marginTop: 8 }} />
              ) : null}
              <Text className="text-gray-800 mt-2">{it.content}</Text>
            </Card>
          ))}
        </ScrollView>
      )}
    </AppShell>
  );
}
