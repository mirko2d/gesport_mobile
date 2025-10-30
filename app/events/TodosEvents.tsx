import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, Search, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { baseURL, enroll, listEvents } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
const { width } = Dimensions.get('window');

/** ===== Tipos ===== */
type ApiEvent = {
  _id: string;
  nombre: string;
  fecha?: string;                 // ISO o fecha en texto
  ubicacion?: string;
  categoria?: string;
  image?: string;                 // opcional en backend
  hora?: string;                  // si tu backend la maneja aparte
  participantes?: number;         // si lo agregas luego
  maxParticipantes?: number;      // si lo agregas luego
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
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=1200&auto=format&fit=crop&q=60';

/** Mapear evento del backend a evento de UI */
function mapToUi(ev: ApiEvent): UiEvent {
  const dt = ev.fecha ? new Date(ev.fecha) : null;
  const dateStr = dt ? dt.toLocaleDateString() : 'Fecha a confirmar';
  const timeStr = ev.hora ?? (dt ? dt.toLocaleTimeString().slice(0, 5) : '—');
  const participantsText =
    ev.participantes != null && ev.maxParticipantes != null
      ? `${ev.participantes} / ${ev.maxParticipantes}`
      : 'Cupos variables';

  return {
    id: ev._id,
    title: ev.nombre ?? 'Evento',
    date: dateStr,
    time: timeStr,
    location: ev.ubicacion ?? 'Ubicación a confirmar',
    category: ev.categoria ?? 'General',
    image: ev.image ?? PLACEHOLDER_IMG,
    participantsText,
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
  const { isAuth, user } = useAuth();

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
    } catch (e) {
      console.log('Error al inscribirse:', e);
      Alert.alert('Error', 'No se pudo completar la inscripción. Intenta nuevamente.');
    } finally {
      setEnrolling(false);
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
          filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="rounded-2xl mb-4 overflow-hidden"
            >
              <Image
                source={{ uri: event.image }}
                style={{ width: width - 32, height: 160 }}
                className="rounded-t-2xl"
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
                    <Button title="Inscribirme" onPress={() => openEnrollForm(event)} />
                    <Button title="Ver detalles" variant="outline" onPress={() => {}} />
                  </View>
                </View>
              </View>
            </Card>
          ))
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
    </>
  );
}
