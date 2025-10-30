import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { baseURL, createEvent, deleteEvent, listMyEvents, updateEvent } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function EventsAdmin() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuper = user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  // form
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(''); // ISO string yyyy-mm-ddThh:mm
  const [lugar, setLugar] = useState('');
  const [categoria, setCategoria] = useState('CARRERA');
  const [cupos, setCupos] = useState('');
  const [precio, setPrecio] = useState('');
  const [afiche, setAfiche] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuper) {
      router.replace('/profile/profile');
      return;
    }
    (async () => {
      try {
        setLoading(true);
  const data = await listMyEvents();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cargar eventos');
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuper, router]);

  const pickPoster = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para subir afiche.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      // subir al backend
      const form = new FormData();
      const name = asset.uri.split('/').pop() || `poster-${Date.now()}.jpg`;
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      // @ts-ignore React Native file type
      form.append('poster', { uri: asset.uri, name, type });
      const resp = await fetch(`${baseURL}/upload/event`, { method: 'POST', body: form as any });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const json = await resp.json();
      setAfiche(json.url);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir la imagen.');
    }
  };

  const handleCreate = async () => {
    try {
      setBusy(true);
      const payload: any = {
        titulo,
        descripcion,
        fecha: fecha ? new Date(fecha) : undefined,
        lugar,
        categoria,
        cupos: cupos ? Number(cupos) : undefined,
        precio: precio ? Number(precio) : undefined,
        afiche,
        activo: true,
      };
      const ev = await createEvent(payload);
      setEvents((prev) => [ev, ...prev]);
      setTitulo(''); setDescripcion(''); setFecha(''); setLugar(''); setCategoria('CARRERA'); setCupos(''); setPrecio(''); setAfiche(null);
      Alert.alert('Listo', 'Evento creado.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo crear el evento');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!isSuper) return;
      setBusy(true);
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo eliminar');
    } finally {
      setBusy(false);
    }
  };

  // editing state
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>({});

  const startEdit = (ev: any) => {
    setEditId(ev._id);
    setEdit({
      titulo: ev.titulo || '',
      descripcion: ev.descripcion || '',
      fecha: ev.fecha ? new Date(ev.fecha).toISOString().slice(0, 19) : '',
      lugar: ev.lugar || '',
      categoria: ev.categoria || 'CARRERA',
      cupos: ev.cupos != null ? String(ev.cupos) : '',
      precio: ev.precio != null ? String(ev.precio) : '',
      afiche: ev.afiche || null,
      activo: ev.activo !== false,
    });
  };

  const updatePoster = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para subir afiche.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      const form = new FormData();
      const name = asset.uri.split('/').pop() || `poster-${Date.now()}.jpg`;
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      // @ts-ignore
      form.append('poster', { uri: asset.uri, name, type });
      const resp = await fetch(`${baseURL}/upload/event`, { method: 'POST', body: form as any });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const json = await resp.json();
      setEdit((p: any) => ({ ...p, afiche: json.url }));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir la imagen.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    try {
      setBusy(true);
      const payload: any = {
        titulo: edit.titulo,
        descripcion: edit.descripcion,
        fecha: edit.fecha ? new Date(edit.fecha) : undefined,
        lugar: edit.lugar,
        categoria: edit.categoria,
        cupos: edit.cupos ? Number(edit.cupos) : undefined,
        precio: edit.precio ? Number(edit.precio) : undefined,
        afiche: edit.afiche,
        activo: !!edit.activo,
      };
      const updated = await updateEvent(editId, payload);
      setEvents((prev) => prev.map((e) => (e._id === editId ? updated : e)));
      setEditId(null);
      setEdit({});
      Alert.alert('Listo', 'Evento actualizado.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Administrar eventos" showBack>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-3">Cargando...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {/* Formulario crear evento */}
          <Card className="mb-4 rounded-lg">
            <Text className="text-black text-lg font-extrabold">Crear evento</Text>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Título</Text>
              <TextInput value={titulo} onChangeText={setTitulo} placeholder="Media Maratón" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Descripción</Text>
              <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Circuito urbano" className="bg-white border border-gray-200 rounded-lg px-3 py-2" multiline />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Fecha y hora (ISO)</Text>
              <TextInput value={fecha} onChangeText={setFecha} placeholder="2026-08-30T05:30:00" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Lugar</Text>
              <TextInput value={lugar} onChangeText={setLugar} placeholder="Estadio Olímpico" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Categoría</Text>
              <TextInput value={categoria} onChangeText={setCategoria} placeholder="CARRERA / ENTRENAMIENTO" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
            </View>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-gray-700 mb-1">Cupos</Text>
                <TextInput value={cupos} onChangeText={setCupos} keyboardType="numeric" placeholder="500" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-1">Precio</Text>
                <TextInput value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="20" className="bg-white border border-gray-200 rounded-lg px-3 py-2" />
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-gray-700 mb-1">Afiche (opcional)</Text>
              {afiche ? (
                <View className="items-start">
                  <Image source={{ uri: afiche }} style={{ width: 180, height: 100, borderRadius: 8 }} />
                  <TouchableOpacity className="mt-2" onPress={() => setAfiche(null)}>
                    <Text className="text-red-500">Quitar imagen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button title="Subir imagen" onPress={pickPoster} />
              )}
            </View>
            <View className="mt-4">
              <Button title={busy ? 'Creando…' : 'Crear evento'} onPress={handleCreate} disabled={busy} />
            </View>
          </Card>

          {/* Lista de eventos */}
          <Text className="text-black text-lg font-extrabold mb-2">Eventos</Text>
          {events.map((ev) => (
            <Card key={ev._id} className="mb-3 rounded-lg">
              {editId === ev._id ? (
                <>
                  <Text className="text-black text-lg font-extrabold">Editar evento</Text>
                  {edit.afiche ? (
                    <Image source={{ uri: edit.afiche }} style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }} />
                  ) : null}
                  <View className="mt-2">
                    <Button title="Cambiar afiche" variant="secondary" onPress={updatePoster} />
                  </View>
                  <View className="mt-3"><Text className="text-gray-700 mb-1">Título</Text><TextInput value={edit.titulo} onChangeText={(t)=>setEdit((p:any)=>({...p,titulo:t}))} className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                  <View className="mt-3"><Text className="text-gray-700 mb-1">Descripción</Text><TextInput value={edit.descripcion} onChangeText={(t)=>setEdit((p:any)=>({...p,descripcion:t}))} className="bg-white border border-gray-200 rounded-lg px-3 py-2" multiline /></View>
                  <View className="mt-3"><Text className="text-gray-700 mb-1">Fecha y hora (ISO)</Text><TextInput value={edit.fecha} onChangeText={(t)=>setEdit((p:any)=>({...p,fecha:t}))} className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                  <View className="mt-3"><Text className="text-gray-700 mb-1">Lugar</Text><TextInput value={edit.lugar} onChangeText={(t)=>setEdit((p:any)=>({...p,lugar:t}))} className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                  <View className="mt-3"><Text className="text-gray-700 mb-1">Categoría</Text><TextInput value={edit.categoria} onChangeText={(t)=>setEdit((p:any)=>({...p,categoria:t}))} className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                  <View className="mt-3 flex-row gap-3">
                    <View className="flex-1"><Text className="text-gray-700 mb-1">Cupos</Text><TextInput value={edit.cupos} onChangeText={(t)=>setEdit((p:any)=>({...p,cupos:t}))} keyboardType="numeric" className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                    <View className="flex-1"><Text className="text-gray-700 mb-1">Precio</Text><TextInput value={edit.precio} onChangeText={(t)=>setEdit((p:any)=>({...p,precio:t}))} keyboardType="numeric" className="bg-white border border-gray-200 rounded-lg px-3 py-2" /></View>
                  </View>
                  <View className="mt-4 flex-row gap-2">
                    <Button title={busy ? 'Guardando…' : 'Guardar'} onPress={handleSaveEdit} />
                    <Button title="Cancelar" variant="outline" onPress={()=>{setEditId(null); setEdit({});}} />
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-gray-900 font-semibold">{ev.titulo}</Text>
                  {ev.afiche ? <Image source={{ uri: ev.afiche }} style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }} /> : null}
                  <Text className="text-gray-700 mt-1">Fecha: {ev.fecha ? new Date(ev.fecha).toLocaleString() : '-'}</Text>
                  <Text className="text-gray-700">Lugar: {ev.lugar ?? '-'}</Text>
                  <Text className="text-gray-700">Categoría: {ev.categoria ?? '-'}</Text>
                  <View className="mt-3 flex-row gap-2">
                    <Button title="Editar" variant="secondary" onPress={() => startEdit(ev)} />
                    {isSuper ? (
                      <Button title={busy ? 'Eliminando…' : 'Eliminar'} variant="outline" onPress={() => handleDelete(ev._id)} />
                    ) : null}
                  </View>
                </>
              )}
            </Card>
          ))}
        </ScrollView>
      )}
    </AppShell>
  );
}
