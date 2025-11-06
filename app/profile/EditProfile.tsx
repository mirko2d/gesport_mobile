import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { me, updateMe, uploadAvatar } from '../../lib/api';
import AppShell from '../components/AppShell';

export default function EditProfileScreen() {
  const { user: authUser, refreshMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const u = await me().catch(() => authUser);
        setFirstName((u?.nombre || '').toString());
        setLastName((u?.apellido || '').toString());
        // Aplica override local si existe para mostrar la última foto en este dispositivo
        const avatarKey = authUser?._id ? `@gesport:profile:avatarUrl:${authUser._id}` : '@gesport:profile:avatarUrl';
        const localAvatar = await AsyncStorage.getItem(avatarKey);
        setAvatarUrl(localAvatar || u?.avatarUrl);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser?._id]);

  const onSave = async () => {
    const nombre = (firstName || '').trim();
    const apellido = (lastName || '').trim();
    if (!nombre || !apellido) {
      Alert.alert('Faltan datos', 'Completá nombre y apellido.');
      return;
    }
    const payload: any = { nombre, apellido };
    try {
      setLoading(true);
      await updateMe(payload);
      await refreshMe();
      Alert.alert('Listo', 'Perfil actualizado.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para cambiar tu imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const { url } = await uploadAvatar(asset.uri);
      try {
        await updateMe({ avatarUrl: url });
        await refreshMe().catch(() => {});
      } catch {}
      const avatarKey = authUser?._id ? `@gesport:profile:avatarUrl:${authUser._id}` : '@gesport:profile:avatarUrl';
      await AsyncStorage.setItem(avatarKey, url);
      setAvatarUrl(url);
      Alert.alert('Listo', 'Foto de perfil actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la foto.');
    }
  };

  return (
    <AppShell showBack title="Editar perfil">
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* Foto de perfil */}
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4 items-center">
            <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 106, height: 106, borderRadius: 53 }} />
              ) : (
                <Text className="text-gray-500">Sin foto</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleChangeAvatar} className="mt-3">
              <Text className="text-black font-extrabold">CAMBIAR FOTO DE PERFIL</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
            <Text className="text-gray-800 mb-1">Nombre</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Tu nombre"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
            <Text className="text-gray-800 mb-1">Apellido</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Tu apellido"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          {/* Se quitan Peso y Altura: se gestionan desde Recursos */}

          <View className="flex-row justify-end">
            <TouchableOpacity
              disabled={loading}
              className={`px-4 py-3 rounded-full ${loading ? 'bg-gray-300' : 'bg-black'}`}
              onPress={onSave}
            >
              <Text className="text-white font-semibold">{loading ? 'Guardando…' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
