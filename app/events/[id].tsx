import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { enroll, getEvent, myEnrollments } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuth, user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledEventIds, setEnrolledEventIds] = useState<Set<string>>(new Set());

  const isEnrolled = useMemo(() => (id ? enrolledEventIds.has(String(id)) : false), [enrolledEventIds, id]);
  const isFull = useMemo(() => {
    if (!event) return false;
    return typeof event.maxParticipantes === 'number' && typeof event.participantes === 'number' && event.maxParticipantes > 0 && event.participantes >= event.maxParticipantes;
  }, [event]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setErrorText(null);
      const data = await getEvent(String(id));
      setEvent(data);
    } catch (e: any) {
      setEvent(null);
      setErrorText(e?.response?.data?.error || e?.message || 'No se pudo cargar el evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!isAuth) {
        setEnrolledEventIds(new Set());
        return;
      }
      try {
        const list: any[] = await myEnrollments();
        const ids = new Set<string>();
        (list || []).forEach((it: any) => {
          const ev = it?.event;
          const eid = typeof ev === 'string' ? ev : ev?._id;
          if (eid) ids.add(eid);
        });
        setEnrolledEventIds(ids);
      } catch {
        setEnrolledEventIds(new Set());
      }
    })();
  }, [isAuth]);

  const handleEnroll = async () => {
    if (!isAuth) {
      router.push('/auth/LoginScreen');
      return;
    }
    if (!id) return;
    try {
      setEnrolling(true);
      await enroll(String(id));
      Alert.alert('Inscripción completada', 'Quedaste inscripto en el evento.');
      setEnrolledEventIds((prev) => new Set<string>([...prev, String(id)]));
      // Opcional actualizar contador local
      setEvent((prev: any) => (prev ? { ...prev, participantes: (prev.participantes ?? 0) + 1 } : prev));
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.error === 'Cupo completo') {
        Alert.alert('Cupo completo', 'Este evento alcanzó el límite de inscripciones.');
      } else if (err?.response?.status === 409) {
        Alert.alert('Ya estás inscripto', 'Tu inscripción ya existe para este evento.');
        setEnrolledEventIds((prev) => new Set<string>([...prev, String(id)]));
      } else {
        Alert.alert('Error', 'No se pudo completar la inscripción. Intenta nuevamente.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <AppShell showBack title={event?.titulo || event?.nombre || 'Evento'}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-3">Cargando…</Text>
        </View>
      ) : errorText ? (
        <View className="p-4">
          <Text className="text-red-600">{errorText}</Text>
        </View>
      ) : !event ? (
        <View className="p-4">
          <Text>No se encontró la información del evento.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {event.afiche ? (
            <Image source={{ uri: event.afiche }} style={{ width: '100%', height: 220 }} />
          ) : null}
          <View className="p-4">
            <Text className="text-2xl font-extrabold text-gray-900 mb-2">{event.titulo || event.nombre}</Text>

            <View className="flex-row items-center mb-1">
              <Calendar color="#6b7280" size={16} />
              <Text className="text-gray-600 ml-2">{event.fecha ? new Date(event.fecha).toLocaleDateString() : 'Fecha a confirmar'}</Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Calendar color="#6b7280" size={16} />
              <Text className="text-gray-600 ml-2">{event.fecha ? new Date(event.fecha).toLocaleTimeString().slice(0,5) : '--:--'}</Text>
            </View>
            <View className="flex-row items-center mb-1">
              <MapPin color="#6b7280" size={16} />
              <Text className="text-gray-600 ml-2">{event.lugar || event.ubicacion || 'Ubicación a confirmar'}</Text>
            </View>

            {isPrivileged && (
              <View className="flex-row items-center mb-3">
                <Users color="#6b7280" size={16} />
                <Text className="text-gray-600 ml-2">{typeof event.participantes === 'number' && event.maxParticipantes != null ? `${event.participantes} / ${event.maxParticipantes}` : 'Cupos variables'}</Text>
              </View>
            )}

            {event.descripcion ? (
              <Text className="text-gray-700 mb-4">{event.descripcion}</Text>
            ) : null}

            <View className="flex-row justify-end">
              <Button
                title={isEnrolled ? 'Inscripto' : isFull ? 'Cupos llenos' : 'Inscribirme'}
                onPress={handleEnroll}
                disabled={isEnrolled || isFull}
                loading={enrolling}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </AppShell>
  );
}
