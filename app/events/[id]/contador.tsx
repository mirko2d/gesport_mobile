import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { incrementFinishCounter } from '../../../lib/api';
import AppShell from '../../components/AppShell';
import Button from '../../components/ui/Button';

export default function FinishCounterScreen() {
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [dorsal, setDorsal] = useState<string>('');

  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert('Acceso restringido', 'Esta pantalla es solo para Super Admin.');
    }
  }, [isSuperAdmin]);

  const onTapFinish = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const resp = await incrementFinishCounter(eventId, dorsal.trim() ? { dorsal: dorsal.trim() } : undefined);
      if (resp?.ok) {
        setCount(resp.count ?? (count + 1));
        setDorsal('');
      } else {
        Alert.alert('No registrado', 'No se pudo registrar el paso por la meta.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showBack title="Contador de meta">
      <View className="px-5 py-4">
        <Text className="text-gray-800 mb-2">Evento: {eventId || '—'}</Text>
        <Text className="text-gray-800 text-lg font-bold mb-3">Total: {count}</Text>

        <View className="mb-3">
          <Text className="text-gray-700 mb-1">Dorsal (opcional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Número de dorsal"
            value={dorsal}
            onChangeText={setDorsal}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          onPress={onTapFinish}
          disabled={loading || !isSuperAdmin}
          activeOpacity={0.9}
        >
          <View className={`h-28 rounded-2xl items-center justify-center ${loading ? 'bg-gray-300' : 'bg-primary'}`}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-2xl font-extrabold">¡Pasó la meta!</Text>
            )}
          </View>
        </TouchableOpacity>

        {!isSuperAdmin ? (
          <Text className="text-red-600 mt-3">Solo Super Admin puede usar el contador.</Text>
        ) : null}

        <View className="mt-6">
          <Button title="Ver resultados" variant="outline" onPress={() => router.push({ pathname: '/events/[id]/results', params: { id: eventId } })} />
        </View>
      </View>
    </AppShell>
  );
}
