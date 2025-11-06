import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { getEventResults, incrementFinishCounter, listEventParticipants } from '../../../lib/api';
import AppShell from '../../components/AppShell';
import Button from '../../components/ui/Button';

export default function FinishCounterScreen() {
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [participantsLoading, setParticipantsLoading] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Array<{ _id: string; nombre?: string; apellido?: string; email?: string }>>([]);
  const [filter, setFilter] = useState('');
  const [finishedUserIds, setFinishedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert('Acceso restringido', 'Esta pantalla es solo para Super Admin.');
    }
  }, [isSuperAdmin]);

  const loadFromServer = async () => {
    if (!eventId) return;
    try {
      setParticipantsLoading(true);
      const [plist, results] = await Promise.all([
        listEventParticipants(eventId).catch(() => ({ participants: [] })),
        getEventResults(eventId).catch(() => []),
      ]);
      setParticipants(plist?.participants || []);
      const finished = new Set<string>();
      (results || []).forEach((r: any) => {
        if (r.userId) finished.add(String(r.userId));
      });
      setFinishedUserIds(finished);
      setCount((results || []).length);
    } finally {
      setParticipantsLoading(false);
    }
  };

  useEffect(() => {
    loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const onMarkParticipantFinish = async (userId: string) => {
    if (!eventId || !userId) return;
    try {
      setParticipantsLoading(true);
      const resp = await incrementFinishCounter(eventId, { userId });
      if (resp?.ok) {
        setFinishedUserIds((prev) => new Set<string>([...prev, userId]));
        setCount(resp.count ?? (count + 1));
      } else {
        Alert.alert('No registrado', 'No se pudo registrar el paso por la meta.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const full = [p.nombre, p.apellido, p.email].filter(Boolean).join(' ').toLowerCase();
      return full.includes(q);
    });
  }, [participants, filter]);

  return (
    <AppShell showBack title="Contador de meta">
      <View className="px-5 py-4">
        <Text className="text-gray-800 mb-2">Evento: {eventId || '—'}</Text>
        <Text className="text-gray-800 text-lg font-bold mb-3">Total: {count}</Text>

        {!isSuperAdmin ? (
          <Text className="text-red-600 mt-3">Solo Super Admin puede usar esta pantalla.</Text>
        ) : null}

        <View className="mt-6">
          <Button title="Ver resultados" variant="outline" onPress={() => router.push({ pathname: '/events/[id]/results', params: { id: eventId } })} />
        </View>

        {/* Sección: Inscriptos (para marcar llegada a partir de la lista) */}
        <View className="mt-8">
          <Text className="text-black text-lg font-extrabold mb-2">Inscriptos</Text>
          <Text className="text-gray-600 mb-3">Tocá en “Llegó” para registrar la llegada. Se asocia al usuario automáticamente.</Text>
          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Buscar por nombre o email"
              value={filter}
              onChangeText={setFilter}
            />
            <TouchableOpacity onPress={loadFromServer} className="ml-2 px-3 py-2 rounded-lg bg-gray-900">
              <Text className="text-white">Recargar</Text>
            </TouchableOpacity>
          </View>
          {participantsLoading ? (
            <View className="py-4 items-center"><ActivityIndicator /></View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }}>
              {filteredParticipants.length === 0 ? (
                <Text className="text-gray-700">No hay inscriptos o no coinciden con la búsqueda.</Text>
              ) : (
                filteredParticipants.map((p) => {
                  const name = [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Usuario';
                  const done = p._id ? finishedUserIds.has(p._id) : false;
                  return (
                    <View key={p._id} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                      <View>
                        <Text className="text-gray-900 font-medium">{name}</Text>
                        {p.email ? <Text className="text-gray-600 text-xs">{p.email}</Text> : null}
                      </View>
                      <TouchableOpacity
                        disabled={done}
                        onPress={() => onMarkParticipantFinish(p._id)}
                        className={`px-3 py-2 rounded-lg ${done ? 'bg-gray-300' : 'bg-primary'}`}
                      >
                        <Text className="text-white font-semibold">{done ? 'Registrado' : 'Llegó'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </AppShell>
  );
}
