import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, Search, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { baseURL, enroll, listEventParticipants, listEvents, myEnrollments } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
const { width } = Dimensions.get('window');

/** ===== Tipos ===== */
type ApiEvent = {
  _id: string;
  nombre?: string;            // compat nombres antiguos
  titulo?: string;            // backend actual
  fecha?: string;                 // ISO o fecha en texto
  ubicacion?: string;
  lugar?: string;             // backend actual
  categoria?: string;
  image?: string;                 // opcional en backend
  afiche?: string;             // backend actual
  hora?: string;                  // si tu backend la maneja aparte
  participantes?: number;         // agregado en events.get
  maxParticipantes?: number;      // agregado en events.get
  cupos?: number;                 // backend actual
};

type UiEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  participantsText: string; // “X / Y” o descriptivo
  participantsCount?: number;
  maxParticipants?: number | null;
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=1200&auto=format&fit=crop&q=60';

/** Mapear evento del backend a evento de UI */
function mapToUi(ev: ApiEvent): UiEvent {
  const dt = ev.fecha ? new Date(ev.fecha) : null;
  const dateStr = dt ? dt.toLocaleDateString() : 'Fecha a confirmar';
  const timeStr = ev.hora ?? (dt ? dt.toLocaleTimeString().slice(0, 5) : '—');
  const participantsText =
    ev.participantes != null && (ev.maxParticipantes != null || ev.cupos != null)
      ? `${ev.participantes} / ${ev.maxParticipantes ?? ev.cupos}`
      : 'Cupos variables';

  return {
    id: ev._id,
    title: ev.nombre ?? ev.titulo ?? 'Evento',
    date: dateStr,
    time: timeStr,
    location: ev.ubicacion ?? ev.lugar ?? 'Ubicación a confirmar',
    category: ev.categoria ?? 'General',
    image: ev.image ?? ev.afiche ?? PLACEHOLDER_IMG,
    participantsText,
    participantsCount: ev.participantes,
    maxParticipants: ev.maxParticipantes ?? (ev.cupos != null ? ev.cupos : null),
  };
}

export default function AllEventsScreen() {
  const params = useLocalSearchParams();
  const yearParam = typeof params.year === 'string' ? parseInt(params.year, 10) : undefined;
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<UiEvent | null>(null);
  const [participantsModalOpen, setParticipantsModalOpen] = useState<boolean>(false);
  const [participantsLoading, setParticipantsLoading] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Array<{ _id: string; nombre?: string; apellido?: string; email?: string; avatarUrl?: string }>>([]);
  const [enrolledEventIds, setEnrolledEventIds] = useState<Set<string>>(new Set());
  const { isAuth, user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

  // Campos opcionales para mostrar en el formulario (no requeridos por el backend actual)
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      setErrorText(null);
      console.log('listEvents URL:', `${baseURL}/events/`);
      const data: ApiEvent[] = await listEvents();
      const filteredByYear = Array.isArray(data)
        ? data.filter((e) => {
            if (!yearParam) return true;
            if (!e.fecha) return false;
            const dt = new Date(e.fecha);
            return dt.getFullYear() === yearParam;
          })
        : [];
      const mapped = filteredByYear.map(mapToUi);
      setEvents(mapped);
    } catch (err: any) {
      console.log('Error listEvents:', err?.message || err);
      console.log('API baseURL:', baseURL);
      setEvents([]);
      setErrorText(
        'No pudimos conectarnos al servidor. Verifica que tu API esté activa y que la URL sea accesible desde tu dispositivo.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearParam]);

  // Prefill de datos del usuario si está autenticado
  useEffect(() => {
    if (isAuth && user) {
      const name = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
      setFullName(name);
      setEmail(user?.email ?? '');
    }
  }, [isAuth, user]);

  // Cargar mis inscripciones para mostrar "Inscripto" y bloquear el botón
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
          const id = typeof ev === 'string' ? ev : ev?._id;
          if (id) ids.add(id);
        });
        setEnrolledEventIds(ids);
      } catch {
        setEnrolledEventIds(new Set());
      }
    })();
  }, [isAuth]);

  /** Categorías únicas */
  const categories = useMemo<string[]>(
    () => ['Todos', ...Array.from(new Set(events.map((e) => e.category)))],
    [events]
  );

  /** Filtro por categoría */
  const filteredEvents = useMemo<UiEvent[]>(
    () =>
      selectedCategory === 'Todos'
        ? events
        : events.filter((e) => e.category === selectedCategory),
    [events, selectedCategory]
  );

  const openEnrollForm = (event: UiEvent) => {
    if (!isAuth) {
      router.push('/auth/LoginScreen');
      return;
    }
    setSelectedEvent(event);
    setEnrollModalOpen(true);
  };

  const submitEnroll = async () => {
    if (!selectedEvent) return;
    if (!isAuth) {
      Alert.alert('Necesitas iniciar sesión', 'Inicia sesión o regístrate para inscribirte.');
      return;
    }
    try {
      setEnrolling(true);
  await enroll(selectedEvent.id);
      setEnrollModalOpen(false);
      Alert.alert('Inscripción completada', `Te inscribiste a ${selectedEvent.title}.`);
      loadEvents();
  setEnrolledEventIds((prev) => new Set<string>([...prev, selectedEvent.id]));
    } catch (err) {
      const e = err as any;
      console.log('Error al inscribirse:', e?.response?.data || e?.message || e);
      if (e?.response?.status === 409 && e?.response?.data?.error === 'Cupo completo') {
        Alert.alert('Cupo completo', 'Este evento alcanzó el límite de inscripciones.');
      } else if (e?.response?.status === 409) {
        Alert.alert('Ya estás inscripto', 'Tu inscripción ya existe para este evento.');
        if (selectedEvent) {
          setEnrolledEventIds((prev) => new Set<string>([...prev, selectedEvent.id]));
        }
      } else {
        Alert.alert('Error', 'No se pudo completar la inscripción. Intenta nuevamente.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const openParticipants = async (event: UiEvent) => {
    try {
      setParticipantsModalOpen(true);
      setParticipantsLoading(true);
      const data = await listEventParticipants(event.id);
      setParticipants(data.participants || []);
    } catch (e) {
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  return (
    <>
    <AppShell showBack title="Todos los Eventos">
      {/* Search (placeholder visual) y filtro por categoría */}
      <View className="p-4">
        {errorText ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
            <Text className="text-red-800 mb-1">{errorText}</Text>
            <Text className="text-red-600 text-xs mb-2">API actual: {baseURL}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="px-3 py-2 rounded-lg bg-red-600"
                onPress={loadEvents}
              >
                <Text className="text-white font-medium">Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-2 rounded-lg bg-gray-900"
                onPress={() => router.push('/auth/LoginScreen')}
              >
                <Text className="text-white font-medium">Ver configuración (API)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <View className="flex-row items-center bg-white rounded-full px-4 py-3 mb-4 shadow-sm">
          <Search color="#9ca3af" size={20} />
          <Text className="text-gray-400 ml-2">Buscar eventos...</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-16 mb-4"
        >
          <View className="flex-row gap-2">
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category ? 'bg-primary' : 'bg-gray-200'
                }`}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Lista de eventos */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <Calendar color="#9ca3af" size={48} />
            <Text className="text-gray-500 mt-4">Cargando eventos...</Text>
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const isFull =
              typeof event.maxParticipants === 'number' &&
              typeof event.participantsCount === 'number' &&
              event.maxParticipants > 0 &&
              event.participantsCount >= event.maxParticipants;
            const isEnrolled = enrolledEventIds.has(event.id);
            return (
            <Card
              key={event.id}
              className="rounded-lg mb-4 overflow-hidden"
            >
              <Image
                source={{ uri: event.image }}
                style={{ width: width - 32, height: 160 }}
                className="rounded-t-lg"
                resizeMode="cover"
              />
              <View className="p-4">
                <Text className="text-xl font-bold text-gray-800 mb-2">
                  {event.title}
                </Text>

                <View className="flex-row items-center mb-1">
                  <Calendar color="#6b7280" size={16} />
                  <Text className="text-gray-600 ml-2">{event.date}</Text>
                  <Text className="text-gray-600 ml-2">•</Text>
                  <Text className="text-gray-600 ml-2">{event.time}</Text>
                </View>

                <View className="flex-row items-center mb-1">
                  <MapPin color="#6b7280" size={16} />
                  <Text className="text-gray-600 ml-2">{event.location}</Text>
                </View>

                <View className="flex-row items-center mb-3">
                  <Users color="#6b7280" size={16} />
                  <Text className="text-gray-600 ml-2">
                    {event.participantsText}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="bg-primary px-3 py-1 rounded-full">
                    <Text className="text-white font-medium text-sm">
                      {event.category}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    {isPrivileged ? (
                      <Button title="Inscriptos" variant="outline" onPress={() => openParticipants(event)} />
                    ) : null}
                    <Button
                      title={isEnrolled ? 'Inscripto' : isFull ? 'Cupos llenos' : 'Inscribirme'}
                      onPress={() => openEnrollForm(event)}
                      disabled={isFull || isEnrolled}
                    />
                    <Button
                      title="Ver detalles"
                      variant="outline"
                      onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
                    />
                  </View>
                </View>
              </View>
            </Card>
            );
          })
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Calendar color="#9ca3af" size={48} />
            <Text className="text-gray-500 text-center mt-4">
              No se encontraron eventos para esta categoría
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <View className="flex-row justify-between items-center px-6 py-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="flex-row items-center mr-6"
              onPress={() => router.push('/profile/profile')}
            >
              <Text className="text-primary font-medium">Perfil</Text>
            </TouchableOpacity>
          </View>

          <Pressable
            onPress={() => router.push('/calendario/Calendar')}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            android_ripple={{ color: '#bfdbfe', borderless: false }}
            className="flex-row items-center bg-primary px-4 py-2 rounded-full"
          >
            <Calendar color="white" size={20} />
            <Text className="text-white font-semibold ml-2">Calendario</Text>
          </Pressable>
        </View>
      </View>
  </AppShell>
    {/* Modal de inscripción */}
  <Modal
      visible={enrollModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setEnrollModalOpen(false)}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full p-5">
          <Text className="text-lg font-bold text-gray-900 mb-1">Inscribirme</Text>
          <Text className="text-gray-600 mb-4">
            {selectedEvent ? `Evento: ${selectedEvent.title}` : ''}
          </Text>

          {isAuth ? (
            <>
              <Text className="text-gray-800 mb-1">Nombre completo</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
                placeholder="Tu nombre"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text className="text-gray-800 mb-1">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text className="text-gray-800 mb-1">Teléfono (opcional)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
                placeholder="Ej: +57 300 123 4567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <View className="flex-row justify-end gap-2">
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onPress={() => setEnrollModalOpen(false)}
                  disabled={enrolling}
                >
                  <Text className="text-gray-800">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-primary"
                  onPress={submitEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#fff" />
                      <Text className="text-white font-medium ml-2">Inscribiendo…</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-medium">Confirmar inscripción</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text className="text-gray-700 mb-4">
                Para inscribirte necesitas iniciar sesión o crear una cuenta.
              </Text>
              <View className="flex-row justify-end gap-2">
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onPress={() => setEnrollModalOpen(false)}
                >
                  <Text className="text-gray-800">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-black"
                  onPress={() => {
                    setEnrollModalOpen(false);
                    router.push('/auth/LoginScreen');
                  }}
                >
                  <Text className="text-white font-medium">Iniciar sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-primary"
                  onPress={() => {
                    setEnrollModalOpen(false);
                    router.push('/auth/LoginScreen?mode=register');
                  }}
                >
                  <Text className="text-white font-medium">Registrarse</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>

    {/* Modal de inscriptos */}
    <Modal
      visible={participantsModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setParticipantsModalOpen(false)}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full p-5 max-h-[70%]">
          <Text className="text-lg font-bold text-gray-900 mb-3">Personas inscriptas</Text>
          {participantsLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator />
              <Text className="text-gray-600 mt-2">Cargando…</Text>
            </View>
          ) : participants.length === 0 ? (
            <Text className="text-gray-700">No hay inscriptos por ahora.</Text>
          ) : (
            <ScrollView className="max-h-[60%]">
              {participants.map((p) => (
                <View key={p._id} className="flex-row items-center py-2 border-b border-gray-100">
                  <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center mr-3">
                    <Text className="text-gray-700 font-semibold">
                      {(p.nombre?.[0] || '').toUpperCase()}
                      {(p.apellido?.[0] || '').toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-medium">{[p.nombre, p.apellido].filter(Boolean).join(' ') || 'Usuario'}</Text>
                    {p.email ? <Text className="text-gray-600 text-xs">{p.email}</Text> : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-900" onPress={() => setParticipantsModalOpen(false)}>
              <Text className="text-white font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}
