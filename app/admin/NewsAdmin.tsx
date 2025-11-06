import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { baseURL, createNews, deleteNews, listMyNews } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function NewsAdmin() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuper = user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuper) {
      router.replace('/profile/profile');
      return;
    }
    (async () => {
      try {
        setLoading(true);
  const data = await listMyNews();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cargar noticias');
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuper, router]);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para subir imagen.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      const form = new FormData();
      const name = asset.uri.split('/').pop() || `news-${Date.now()}.jpg`;
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      // @ts-ignore React Native file type
      form.append('image', { uri: asset.uri, name, type });
      const resp = await fetch(`${baseURL}/upload/news`, { method: 'POST', body: form as any });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const json = await resp.json();
      setImageUrl(json.url);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir la imagen.');
    }
  };

  const handleCreate = async () => {
    try {
      setBusy(true);
      const payload: any = { title, content, imageUrl: imageUrl ?? undefined, published: true };
      const item = await createNews(payload);
      setItems((prev) => [item, ...prev]);
      setTitle(''); setContent(''); setImageUrl(null);
      Alert.alert('Listo', 'Noticia creada.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo crear la noticia');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setBusy(true);
      await deleteNews(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo eliminar la noticia');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Administrar noticias" showBack>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-3">Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <Card className="mb-4">
            <Text className="text-black text-lg font-extrabold">Crear noticia</Text>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Título</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Anuncio importante" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Contenido</Text>
              <TextInput value={content} onChangeText={setContent} placeholder="Detalle de la novedad" className="bg-white border border-gray-200 rounded-lg px-3 py-2" multiline />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Imagen (opcional)</Text>
              {imageUrl ? (
                <View className="items-start">
                  <Image source={{ uri: imageUrl }} style={{ width: 180, height: 100, borderRadius: 8 }} />
                  <TouchableOpacity className="mt-2" onPress={() => setImageUrl(null)}>
                    <Text className="text-red-500">Quitar imagen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button title="Subir imagen" onPress={pickImage} />
              )}
            </View>
            <View className="mt-4">
              <Button title={busy ? 'Creando…' : 'Crear noticia'} onPress={handleCreate} disabled={busy} />
            </View>
          </Card>

          <Text className="text-black text-lg font-extrabold mb-2">Noticias</Text>
          {items.map((it) => (
            <Card key={it._id} className="mb-3">
              <Text className="text-gray-900 font-semibold">{it.title}</Text>
              {it.imageUrl ? <Image source={{ uri: it.imageUrl }} style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }} /> : null}
              <Text className="text-gray-700 mt-1">{it.content}</Text>
              <View className="mt-3 flex-row gap-2">
                <Button title={busy ? 'Eliminando…' : 'Eliminar'} variant="outline" onPress={() => handleDelete(it._id)} />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </AppShell>
  );
}
