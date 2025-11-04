import { isPastEvent } from '@features/events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, Search, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { baseURL, createEnrollmentPreference, enroll, getEnrollmentPaymentStatus, listEventParticipants, listEvents, myEnrollments, unenroll, updateMe } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import TermsModal from '../components/ui/TermsModal';
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
  precio?: number;                // backend actual (precio del evento)
};

type UiEvent = {
  id: string;
  title: string;
  date: string;
  dateISO?: string;
  time: string;
  location: string;
  category: string;
  image: string;
  participantsText: string; // “X / Y” o descriptivo
  participantsCount?: number;
  maxParticipants?: number | null;
  price?: number;
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=1200&auto=format&fit=crop&q=60';

function formatCurrency(amount?: number, currency: string = 'ARS') {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  try {
    // Hermes/Expo recientes soportan Intl; si no, caemos a fallback
    // @ts-ignore
    if (global.Intl && Intl.NumberFormat) {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
    }
  } catch {}
  return `$ ${amount.toFixed(2)}`;
}

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
    dateISO: ev.fecha,
    time: timeStr,
    location: ev.ubicacion ?? ev.lugar ?? 'Ubicación a confirmar',
    category: ev.categoria ?? 'General',
    image: ev.image ?? ev.afiche ?? PLACEHOLDER_IMG,
    participantsText,
    participantsCount: ev.participantes,
    maxParticipants: ev.maxParticipantes ?? (ev.cupos != null ? ev.cupos : null),
    price: typeof ev.precio === 'number' ? ev.precio : undefined,
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
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedWaiver, setAcceptedWaiver] = useState<boolean>(false);
  const [enrolledEventIds, setEnrolledEventIds] = useState<Set<string>>(new Set());
  const { isAuth, user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

  // Campos opcionales para mostrar en el formulario (no requeridos por el backend actual)
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Campos del formulario obligatorio
  const [dni, setDni] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [gender, setGender] = useState<'F'|'M'|'X'|'Otro' | ''>('');
  const [shirtSize, setShirtSize] = useState<'XS'|'S'|'M'|'L'|'XL'|'XXL' | ''>('');
  const [emgName, setEmgName] = useState('');
  const [emgPhone, setEmgPhone] = useState('');
  const [emgRelation, setEmgRelation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [meds, setMeds] = useState('');

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
    // Validaciones locales
    const missing: string[] = [];
    if (!dni.trim()) missing.push('DNI');
    if (!birthdate.trim()) missing.push('Fecha de nacimiento');
    if (!gender) missing.push('Género');
    if (!shirtSize) missing.push('Talla de remera');
    if (!emgName.trim()) missing.push('Contacto de emergencia - Nombre');
    if (!emgPhone.trim()) missing.push('Contacto de emergencia - Teléfono');
    if (!acceptedTerms) missing.push('Aceptar Términos y Condiciones');
    if (!acceptedWaiver) missing.push('Aceptar Descargo de Responsabilidad');
    if (missing.length) {
      Alert.alert('Completa el formulario', `Faltan:\n- ${missing.join('\n- ')}`);
      return;
    }
    try {
      setEnrolling(true);
      const created = await enroll(selectedEvent.id, {
        dni: dni.trim(),
        fechaNacimiento: birthdate.trim(),
        genero: gender,
        tallaRemera: shirtSize,
        emergencia: { nombre: emgName.trim(), telefono: emgPhone.trim(), relacion: emgRelation.trim() || undefined },
        salud: { alergias: allergies.trim() || undefined, condiciones: conditions.trim() || undefined, medicamentos: meds.trim() || undefined },
        aceptoTerminos: true,
        aceptoDescargo: true,
      });
      // Si el evento tiene precio, iniciar proceso de pago (Mercado Pago)
      if (selectedEvent.price && selectedEvent.price > 0 && created?._id) {
        try {
          const pref = await createEnrollmentPreference(created._id);
          if (pref?.init_point) {
            // Abrir checkout en el navegador o WebView del dispositivo
            await Linking.openURL(pref.init_point);
            Alert.alert(
              'Pago requerido',
              'Se abrió Mercado Pago para completar el pago. Una vez aprobado, tu inscripción quedará confirmada.'
            );
            // Cerrar modal y comenzar polling del estado de pago por un tiempo limitado
            setEnrollModalOpen(false);
            const maxAttempts = 24; // ~2 minutos (24 * 5s)
            const delayMs = 5000;
            const poll = async (enrollmentId: string, attempt: number) => {
              try {
                const status = await getEnrollmentPaymentStatus(enrollmentId);
                const pagoOk = status?.pago?.estado === 'APROBADO' || status?.estado === 'CONFIRMADA';
                if (pagoOk) {
                  setEnrolledEventIds((prev) => new Set<string>([...prev, selectedEvent.id]));
                  Alert.alert('Pago confirmado', `Tu inscripción a ${selectedEvent.title} está CONFIRMADA.`);
                  loadEvents();
                  return;
                }
              } catch (e) {
                // Ignorar errores intermitentes durante el polling
              }
              if (attempt < maxAttempts) {
                setTimeout(() => poll(enrollmentId, attempt + 1), delayMs);
              } else {
                Alert.alert('Sin confirmación aún', 'No pudimos confirmar el pago todavía. Puedes verificar más tarde en Mis inscripciones.');
              }
            };
            poll(created._id, 0);
          } else {
            Alert.alert('No se pudo iniciar el pago', 'Intenta nuevamente en unos minutos.');
          }
        } catch (e) {
          console.log('Error creando preferencia de pago:', (e as any)?.response?.data || (e as any)?.message || e);
          Alert.alert('Error al iniciar el pago', 'No se pudo generar el checkout.');
        }
      } else {
        // Evento gratuito: completar inscripción directamente
        setEnrollModalOpen(false);
        Alert.alert('Inscripción completada', `Te inscribiste a ${selectedEvent.title}.`);
        setEnrolledEventIds((prev) => new Set<string>([...prev, selectedEvent.id]));
      }
      // Refrescar lista de eventos/inscripciones
      loadEvents();
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

  const confirmCancel = (event: UiEvent) => {
    Alert.alert(
      'Cancelar inscripción',
      `¿Seguro que quieres cancelar tu inscripción a ${event.title}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar', style: 'destructive',
          onPress: async () => {
            try {
              await unenroll(event.id);
              setEnrolledEventIds((prev) => {
                const next = new Set(prev);
                next.delete(event.id);
                return next;
              });
              Alert.alert('Inscripción cancelada', 'Se canceló tu inscripción correctamente.');
              loadEvents();
            } catch (e) {
              Alert.alert('Error', 'No se pudo cancelar. Intenta nuevamente.');
            }
          }
        }
      ]
    );
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
            const isPast = isPastEvent(event.dateISO);
            const isFull =
              typeof event.maxParticipants === 'number' &&
              typeof event.participantsCount === 'number' &&
              event.maxParticipants > 0 &&
              event.participantsCount >= event.maxParticipants;
            const isEnrolled = enrolledEventIds.has(event.id);
            const priceLabel = event.price && event.price > 0 ? formatCurrency(event.price) : undefined;
            return (
            <Card
              variant="gradient"
              gradientColors={['#ffffff', '#eef2ff']}
              key={event.id}
              className="rounded-lg mb-4 overflow-hidden"
            >
              <Image
                source={{ uri: event.image }}
                style={{ width: '100%', height: 160 }}
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
                  <View className="flex-row gap-2">
                    <View className="bg-primary px-3 py-1 rounded-full">
                      <Text className="text-white font-medium text-sm">
                        {event.category}
                      </Text>
                    </View>
                    {isPast ? (
                      <View className="bg-gray-800 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-sm">Finalizado</Text>
                      </View>
                    ) : null}
                    {priceLabel ? (
                      <View className="bg-green-600 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-sm">{priceLabel}</Text>
                      </View>
                    ) : (
                      <View className="bg-gray-200 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 font-medium text-sm">Gratis</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    {isPrivileged ? (
                      <Button title="Inscriptos" variant="outline" onPress={() => openParticipants(event)} />
                    ) : null}
                    {/* Acceso rápido a resultados y contador */}
                    <Button
                      title="Resultados"
                      variant="outline"
                      onPress={() => router.push({ pathname: '/events/[id]/results', params: { id: event.id } })}
                    />
                    {user?.role === 'superadmin' ? (
                      <Button
                        title="Contador meta"
                        variant="outline"
                        onPress={() => router.push({ pathname: '/events/[id]/contador', params: { id: event.id } })}
                      />
                    ) : null}
                    {isEnrolled ? (
                      <>
                        <Button title="Cancelar" variant="outline" onPress={() => confirmCancel(event)} />
                        <View className="bg-gray-800 px-3 py-1 rounded-full justify-center">
                          <Text className="text-white font-semibold text-sm">Inscripto</Text>
                        </View>
                      </>
                    ) : (
                      <Button
                        title={isPast ? 'Finalizado' : isFull ? 'Cupos llenos' : 'Inscribirme'}
                        onPress={() => openEnrollForm(event)}
                        disabled={isPast || isFull}
                      />
                    )}
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

      {/* Bottom bar eliminada para evitar superposición con el footer global */}
  </AppShell>
    {/* Modal de inscripción */}
  <Modal
      visible={enrollModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setEnrollModalOpen(false)}
    >
      <View className="flex-1 bg-black/60 px-6">
        {/* Empuja el contenido cuando aparece el teclado y permite scroll */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View className="bg-white rounded-2xl w-full max-h-[85%]">
            <ScrollView
              className="w-full"
              contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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

              {/* Formulario obligatorio */}
              <Text className="text-gray-900 font-semibold mt-2 mb-2">Datos de inscripción</Text>
              <Text className="text-gray-800 mb-1">DNI</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
                placeholder="Tu DNI"
                value={dni}
                onChangeText={setDni}
              />
              <Text className="text-gray-800 mb-1">Fecha de nacimiento (YYYY-MM-DD)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
                placeholder="1990-05-20"
                value={birthdate}
                onChangeText={setBirthdate}
              />
              <Text className="text-gray-800 mb-1">Género</Text>
              <View className="flex-row gap-2 mb-3">
                {(['F','M','X','Otro'] as const).map((g) => (
                  <TouchableOpacity key={g} onPress={() => setGender(g)} className={`px-3 py-2 rounded-full ${gender===g?'bg-primary':'bg-gray-200'}`}>
                    <Text className={gender===g? 'text-white font-medium':'text-gray-800'}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-gray-800 mb-1">Talla de remera</Text>
              <View className="flex-row gap-2 mb-3 flex-wrap">
                {(['XS','S','M','L','XL','XXL'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => setShirtSize(t)} className={`px-3 py-2 rounded-full ${shirtSize===t?'bg-primary':'bg-gray-200'}`}>
                    <Text className={shirtSize===t? 'text-white font-medium':'text-gray-800'}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-gray-900 font-semibold mt-2 mb-2">Contacto de emergencia</Text>
              <Text className="text-gray-800 mb-1">Nombre</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-3" placeholder="Nombre de contacto" value={emgName} onChangeText={setEmgName} />
              <Text className="text-gray-800 mb-1">Teléfono</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-4" placeholder="Teléfono de contacto" value={emgPhone} onChangeText={setEmgPhone} keyboardType="phone-pad" />
              <Text className="text-gray-800 mb-1">Relación (opcional)</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-4" placeholder="Ej: Familiar, Amigo" value={emgRelation} onChangeText={setEmgRelation} />

              <Text className="text-gray-900 font-semibold mt-2 mb-2">Salud (opcional)</Text>
              <Text className="text-gray-800 mb-1">Alergias</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-3" placeholder="Alergias" value={allergies} onChangeText={setAllergies} />
              <Text className="text-gray-800 mb-1">Condiciones</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-3" placeholder="Condiciones" value={conditions} onChangeText={setConditions} />
              <Text className="text-gray-800 mb-1">Medicamentos</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2 mb-4" placeholder="Medicamentos" value={meds} onChangeText={setMeds} />

              <View className="flex-row justify-end gap-2">
                <TouchableOpacity
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onPress={() => setEnrollModalOpen(false)}
                  disabled={enrolling}
                >
                  <Text className="text-gray-800">Cancelar</Text>
                </TouchableOpacity>
                <View className="flex-row items-center mr-3 mt-1">
                  <TouchableOpacity
                    onPress={() => setAcceptedTerms((v) => !v)}
                    accessibilityLabel={acceptedTerms ? 'Casilla aceptada' : 'Casilla no aceptada'}
                    className={`w-5 h-5 rounded-sm border ${acceptedTerms ? 'bg-primary border-primary' : 'border-gray-300'} mr-3 items-center justify-center`}
                  >
                    {acceptedTerms ? <Text className="text-white font-bold">✓</Text> : null}
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <Text className="text-gray-800 mr-2">Acepto los</Text>
                    <TouchableOpacity onPress={() => setShowTerms(true)}>
                      <Text className="text-gray-800 underline">términos y condiciones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowTerms(true)} className="ml-3">
                      <Text className="text-sm text-gray-600 underline">Ver términos y condiciones</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-row items-center mr-3 mb-3">
                  <TouchableOpacity
                    onPress={() => setAcceptedWaiver((v) => !v)}
                    accessibilityLabel={acceptedWaiver ? 'Casilla aceptada' : 'Casilla no aceptada'}
                    className={`w-5 h-5 rounded-sm border ${acceptedWaiver ? 'bg-primary border-primary' : 'border-gray-300'} mr-3 items-center justify-center`}
                  >
                    {acceptedWaiver ? <Text className="text-white font-bold">✓</Text> : null}
                  </TouchableOpacity>
                  <Text className="text-gray-800">Acepto el descargo de responsabilidad</Text>
                </View>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ${acceptedTerms ? 'bg-primary' : 'bg-gray-300'}`}
                  onPress={submitEnroll}
                  disabled={enrolling || !acceptedTerms}
                >
                  {enrolling ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#fff" />
                      <Text className="text-white font-medium ml-2">Inscribiendo…</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-medium">
                      {selectedEvent?.price && selectedEvent.price > 0
                        ? `Pagar ${formatCurrency(selectedEvent.price)}`
                        : 'Confirmar inscripción'}
                    </Text>
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
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>

    <TermsModal
      visible={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={async () => {
        setAcceptedTerms(true);
        setShowTerms(false);
        try {
          // Persist locally per-user so modal won't reappear
          if (user && user._id) {
            const key = `@gesport:acceptedTerms:${user._id}`;
            await AsyncStorage.setItem(key, '1');
            // Try to persist on backend if available
            try {
              await updateMe({ acceptedTerms: true } as any);
            } catch (e) {
              // ignore backend failures
            }
          }
        } catch (e) {
          // ignore storage errors
        }
      }}
    />

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
