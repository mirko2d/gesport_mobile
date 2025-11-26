import { isPastEvent } from '@features/events';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, Calendar, CheckCircle2, FileText, Heart, MapPin, Search, User, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, ListRenderItem, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { baseURL, createEnrollmentPreference, enroll, finalizeEvent, getEnrollmentPaymentStatus, listEventParticipants, listEvents, myEnrollments, unenroll } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
// TermsModal eliminado: se implementa carta inline overlay
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
  activo?: boolean;              // bandera de visibilidad pública
  finalizada?: boolean;          // agregado: carrera finalizada por admin
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
  finalizada?: boolean;
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
    finalizada: ev.finalizada === true,
  };
}

export default function AllEventsScreen() {
  const params = useLocalSearchParams();
  const yearParam = typeof params.year === 'string' ? parseInt(params.year, 10) : undefined;
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<UiEvent | null>(null);
  const [participantsModalOpen, setParticipantsModalOpen] = useState<boolean>(false);
  const [participantsLoading, setParticipantsLoading] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Array<{ enrollmentId?: string; _id: string; nombre?: string; apellido?: string; email?: string; avatarUrl?: string; createdAt?: string; form?: any }>>([]);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  // Términos/Descargo visibles siempre dentro del formulario (sin toggle)
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedWaiver, setAcceptedWaiver] = useState<boolean>(false);
  const [enrolledEventIds, setEnrolledEventIds] = useState<Set<string>>(new Set());
  // Cuando abrimos términos desde el formulario de inscripción, cerramos ese modal
  // y marcamos que al cerrar/aceptar términos hay que volver al formulario.
  // Ya no cerramos el modal de inscripción al abrir términos; mostramos términos encima.
  // returnToEnroll ya no se usa al eliminar el modal externo de términos
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
      // Filtro defensivo adicional (el backend ya excluye ENTRENAMIENTO y eventos inactivos, pero por si se usa otro backend antiguo)
      const defensivelyFiltered = Array.isArray(data)
        ? data.filter((e) => {
            const cat = (e.categoria || '').toUpperCase();
            if (cat === 'ENTRENAMIENTO') return false;
            if (e.activo === false) return false;
            return true;
          })
        : [];
      const filteredByYear = defensivelyFiltered.filter((e) => {
        if (!yearParam) return true;
        if (!e.fecha) return false;
        const dt = new Date(e.fecha);
        return dt.getFullYear() === yearParam;
      });
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

  // Refrescar lista cada vez que la pantalla gana foco (ej: después de eliminar en Admin)
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [yearParam])
  );

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

  const openEnrollForm = React.useCallback((event: UiEvent) => {
    if (!isAuth) {
      router.push('/auth/LoginScreen');
      return;
    }
    setSelectedEvent(event);
    setEnrollModalOpen(true);
  }, [isAuth, router]);

  const submitEnroll = async () => {
    if (!selectedEvent) return;
    if (!isAuth) {
      Alert.alert('Necesitas iniciar sesión', 'Inicia sesión o regístrate para inscribirte.');
      return;
    }
    // Validaciones locales
    const missing: string[] = [];
    if (!fullName.trim()) missing.push('Nombre completo');
    if (!email.trim()) missing.push('Email');
    if (!phone.trim()) missing.push('Teléfono');
    if (!dni.trim()) missing.push('DNI');
    if (!birthdate.trim()) missing.push('Fecha de nacimiento');
    if (!gender) missing.push('Género');
    if (!shirtSize) missing.push('Talla de remera');
    if (!emgName.trim()) missing.push('Contacto de emergencia - Nombre');
    if (!emgPhone.trim()) missing.push('Contacto de emergencia - Teléfono');
    if (!emgRelation.trim()) missing.push('Contacto de emergencia - Relación');
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

  const confirmCancel = React.useCallback((event: UiEvent) => {
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
  }, [unenroll, loadEvents]);

  const openParticipants = React.useCallback(async (event: UiEvent) => {
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
  }, []);

  // Componente memoizado para cada tarjeta de evento
  const EventCard = React.memo(({ event }: { event: UiEvent }) => {
    const isPast = isPastEvent(event.dateISO);
    const isFinalized = event.finalizada === true;
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

          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2 items-center">
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

            <View className="flex-row flex-wrap gap-2">
              {isPrivileged ? (
                <Button title="Inscriptos" variant="outline" onPress={() => openParticipants(event)} />
              ) : null}
              {isPrivileged ? (
                <Button
                  title={isFinalized ? 'Finalizada' : 'Finalizar carrera'}
                  variant="outline"
                  onPress={async () => {
                    if (isFinalized) return;
                    try {
                      Alert.alert('Confirmar', '¿Finalizar esta carrera? No se podrá cancelar inscripciones luego.', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Finalizar', style: 'destructive', onPress: async () => {
                            try {
                              await finalizeEvent(event.id);
                              Alert.alert('Listo', 'La carrera se marcó como finalizada.');
                              loadEvents();
                            } catch (e) {
                              Alert.alert('Error', 'No se pudo finalizar el evento.');
                            }
                          }
                        }
                      ]);
                    } catch {}
                  }}
                  disabled={isFinalized}
                />
              ) : null}
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
                  {isPast || isFinalized ? null : (
                    <Button title="Cancelar" variant="outline" onPress={() => confirmCancel(event)} />
                  )}
                  <View className="bg-gray-800 px-3 py-1 rounded-full justify-center">
                    <Text className="text-white font-semibold text-sm">Inscripto</Text>
                  </View>
                </>
              ) : (
                <Button
                  title={isPast || isFinalized ? 'Finalizado' : isFull ? 'Cupos llenos' : 'Inscribirme'}
                  onPress={() => openEnrollForm(event)}
                  disabled={isPast || isFinalized || isFull}
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
  });
  EventCard.displayName = 'EventCard';

  const renderEvent: ListRenderItem<UiEvent> = ({ item }) => <EventCard event={item} />;

  return (
    <>
    <AppShell showBack title="Todos los Eventos">
      {/* Search (placeholder visual) y filtro por categoría */}
      <View className="p-4">
        {/* Acciones rápidas: recargar lista */}
        <View className="flex-row items-center justify-end mb-3">
          <TouchableOpacity onPress={loadEvents} className="px-3 py-1 rounded-full bg-gray-800">
            <Text className="text-white text-xs font-semibold">Actualizar</Text>
          </TouchableOpacity>
        </View>
        {errorText ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
            <Text className="text-red-800 mb-1">{errorText}</Text>
            {/* Texto de API eliminado para producción */}
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

      {/* Lista de eventos optimizada */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-12">
          <Calendar color="#9ca3af" size={48} />
          <Text className="text-gray-500 mt-4">Cargando eventos...</Text>
        </View>
      ) : filteredEvents.length > 0 ? (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 + 16 + (insets?.bottom || 0) + 24, paddingTop: 4 }}
          removeClippedSubviews
          windowSize={7}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <View className="flex-1 items-center justify-center py-12 px-4">
          <Calendar color="#9ca3af" size={48} />
          <Text className="text-gray-500 text-center mt-4">
            No se encontraron eventos para esta categoría
          </Text>
        </View>
      )}

      {/* Bottom bar eliminada para evitar superposición con el footer global */}
  </AppShell>
    {/* Modal de inscripción */}
  <Modal
      visible={enrollModalOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setEnrollModalOpen(false)}
    >
      <View className="flex-1 bg-black/40">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
          <View className="flex-1 bg-white rounded-t-3xl mt-2 overflow-hidden">
            {/* Navbar consistente con AppShell */}
            <View style={{ backgroundColor: '#000', paddingTop: (insets?.top || 0) + 16, paddingBottom: 16, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ width: 44, alignItems: 'flex-start', justifyContent: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setEnrollModalOpen(false)}
                    className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
                  >
                    <Text className="text-white font-bold">✕</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-white text-xl font-extrabold">GESPORT</Text>
                <View style={{ width: 44 }} />
              </View>
              <View className="mt-4">
                <Text className="text-white font-semibold text-base">Inscripción</Text>
                <Text className="text-white/80 text-xs mt-1">{selectedEvent ? selectedEvent.title : 'Evento'}</Text>
              </View>
            </View>

            {isAuth ? (
              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 240 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={true}
                scrollIndicatorInsets={{ bottom: 24 }}
                contentInset={{ bottom: 24 } as any}
              >
              {/* Resumen del evento (header visual adicional) */}
              {selectedEvent && (
                <View className="mb-6">
                  <Card className="overflow-hidden border border-gray-200">
                    <Image source={{ uri: selectedEvent.image }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                    <View className="p-4">
                      <Text className="text-xl font-bold text-gray-800 mb-1">{selectedEvent.title}</Text>
                      <View className="flex-row items-center mb-1">
                        <Calendar color="#6b7280" size={16} />
                        <Text className="text-gray-600 ml-2">{selectedEvent.date}</Text>
                        <Text className="text-gray-600 ml-2">•</Text>
                        <Text className="text-gray-600 ml-2">{selectedEvent.time}</Text>
                      </View>
                      <View className="flex-row items-center mb-1">
                        <MapPin color="#6b7280" size={16} />
                        <Text className="text-gray-600 ml-2">{selectedEvent.location}</Text>
                      </View>
                    </View>
                  </Card>
                </View>
              )}

              {/* Datos personales section */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-4">
                  <User size={20} color="#0066cc" />
                  <Text className="text-lg font-bold text-gray-900">Datos personales *</Text>
                </View>
                <View className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Nombre completo *</Text>
                    <TextInput
                      className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Tu nombre"
                      placeholderTextColor="#9ca3af"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Email *</Text>
                    <TextInput
                      className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="tu@email.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Teléfono *</Text>
                    <TextInput
                      className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Ej: +57 300 123 4567"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>
              </View>

              {/* Datos de inscripción section */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-4">
                  <FileText size={20} color="#0066cc" />
                  <Text className="text-lg font-bold text-gray-900">Datos de inscripción *</Text>
                </View>
                <View className="bg-blue-50 rounded-xl p-4 space-y-4">
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">DNI *</Text>
                    <TextInput
                      className="border-2 border-blue-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Tu DNI"
                      placeholderTextColor="#9ca3af"
                      value={dni}
                      onChangeText={setDni}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Fecha de nacimiento (YYYY-MM-DD) *</Text>
                    <TextInput
                      className="border-2 border-blue-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="1990-05-20"
                      placeholderTextColor="#9ca3af"
                      value={birthdate}
                      onChangeText={setBirthdate}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-700 font-semibold mb-3">Género *</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {(['F','M','X','Otro'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGender(g)}
                          className={`px-4 py-3 rounded-lg font-semibold ${
                            gender === g
                              ? 'bg-primary'
                              : 'bg-white border-2 border-blue-200'
                          }`}
                        >
                          <Text className={gender === g ? 'text-white font-semibold' : 'text-gray-700'}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-gray-700 font-semibold mb-3">Talla de remera *</Text>
                    <View className="flex-row gap-2 flex-wrap">
                      {(['XS','S','M','L','XL','XXL'] as const).map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setShirtSize(t)}
                          className={`px-3 py-2 rounded-lg ${
                            shirtSize === t
                              ? 'bg-primary'
                              : 'bg-white border-2 border-blue-200'
                          }`}
                        >
                          <Text className={shirtSize === t ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Contacto de emergencia section */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-4">
                  <AlertCircle size={20} color="#0066cc" />
                  <Text className="text-lg font-bold text-gray-900">Contacto de emergencia *</Text>
                </View>
                <View className="bg-red-50 rounded-xl p-4 space-y-4">
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Nombre *</Text>
                    <TextInput
                      className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Nombre de contacto"
                      placeholderTextColor="#9ca3af"
                      value={emgName}
                      onChangeText={setEmgName}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Teléfono *</Text>
                    <TextInput
                      className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Teléfono de contacto"
                      placeholderTextColor="#9ca3af"
                      value={emgPhone}
                      onChangeText={setEmgPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Relación *</Text>
                    <TextInput
                      className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Ej: Familiar, Amigo"
                      placeholderTextColor="#9ca3af"
                      value={emgRelation}
                      onChangeText={setEmgRelation}
                    />
                  </View>
                </View>
              </View>

              {/* Salud section (opcional) */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-4">
                  <Heart size={20} color="#0066cc" />
                  <Text className="text-lg font-bold text-gray-900">Información de salud (opcional)</Text>
                </View>
                <View className="bg-green-50 rounded-xl p-4 space-y-4">
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Alergias</Text>
                    <TextInput
                      className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Ej: Penicilina, cacahuetes"
                      placeholderTextColor="#9ca3af"
                      value={allergies}
                      onChangeText={setAllergies}
                    />
                  </View>
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Condiciones de salud</Text>
                    <TextInput
                      className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Ej: Asma, diabetes"
                      placeholderTextColor="#9ca3af"
                      value={conditions}
                      onChangeText={setConditions}
                    />
                  </View>
                  <View>
                    <Text className="text-gray-700 font-semibold mb-2">Medicamentos actuales</Text>
                    <TextInput
                      className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white"
                      placeholder="Ej: Ibuprofeno, vitaminas"
                      placeholderTextColor="#9ca3af"
                      value={meds}
                      onChangeText={setMeds}
                    />
                  </View>
                  <Text className="text-gray-500 text-xs mt-2">Podés dejar en blanco si no corresponde.</Text>
                </View>
              </View>

              {/* Términos y condiciones section (ampliada) */}
              <View className="mb-8">
                <View className="bg-gray-100 rounded-xl p-5 space-y-6">
                  <View className="flex-row items-start gap-3">
                    <TouchableOpacity
                      onPress={() => setAcceptedTerms((v) => !v)}
                      className={`w-6 h-6 rounded-lg border-2 mt-1 items-center justify-center flex-shrink-0 ${
                        acceptedTerms ? 'bg-primary border-primary' : 'border-gray-400 bg-white'
                      }`}
                    >
                      {acceptedTerms && <CheckCircle2 size={20} color="#fff" />}
                    </TouchableOpacity>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-semibold">
                        Acepto los términos y condiciones *
                      </Text>
                        <View className="mt-3" />
                        {
                          <View className="mt-4 bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                            <View>
                              <Text className="text-gray-800 font-semibold mb-1">1. Participación y requisitos</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Al inscribirte confirmás que la información proporcionada es verídica y que estás físicamente apto para participar. Debés presentar documento válido y el número o pulsera oficial para acceder a largada y servicios.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">2. Comportamiento y seguridad</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Respetá indicaciones de staff, señalización del circuito y zonas restringidas. El organizador puede modificar recorrido, horarios o suspender la prueba por fuerza mayor o razones de seguridad sin generar obligación de reembolso adicional.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">3. Pagos y política de reembolsos</Text>
                              <Text className="text-gray-700 mb-2 text-sm leading-5">
                                Las inscripciones son personales y no transferibles. No son reembolsables salvo cancelación total del evento por la organización. En caso de reprogramación tu inscripción se mantiene activa automáticamente.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">4. Servicios incluidos</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                La inscripción puede incluir hidratación básica, control de tiempo y asistencia médica primaria. Servicios adicionales (medalla, kit, remera) se entregan sólo si fueron anunciados y mientras haya stock disponible.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">5. Datos personales y comunicaciones</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Autorizás el uso de tus datos de contacto para enviarte información relevante del evento (cambios, resultados, avisos). No se compartirán con terceros ajenos a la organización salvo obligación legal.
                              </Text>
                            </View>
                          </View>
                        }
                    </View>
                  </View>

                  <View className="flex-row items-start gap-3">
                    <TouchableOpacity
                      onPress={() => setAcceptedWaiver((v) => !v)}
                      className={`w-6 h-6 rounded-lg border-2 mt-1 items-center justify-center flex-shrink-0 ${
                        acceptedWaiver ? 'bg-primary border-primary' : 'border-gray-400 bg-white'
                      }`}
                    >
                      {acceptedWaiver && <CheckCircle2 size={20} color="#fff" />}
                    </TouchableOpacity>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-semibold">
                        Acepto el descargo de responsabilidad *
                      </Text>
                      <Text className="text-gray-600 text-xs mt-1">
                        Reconozco los riesgos inherentes a la actividad deportiva
                      </Text>
                        <View className="mt-3" />
                        {
                          <View className="mt-4 bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                            <View>
                              <Text className="text-gray-800 font-semibold mb-1">1. Riesgos asumidos</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Comprendés que participar implica esfuerzo físico, exposición climática y posibilidad de caídas, golpes, calambres, deshidratación u otras lesiones imprevistas pese a las medidas de seguridad.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">2. Evaluación médica</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Declarás haber realizado controles médicos adecuados y no presentar condiciones que te impidan participar. Ante cualquier síntoma adverso suspenderás tu esfuerzo y buscarás asistencia.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">3. Exención de la organización</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Eximís a organizadores, sponsors y staff de responsabilidad por daños derivados de la participación salvo dolo o negligencia grave demostrable ante autoridad competente.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">4. Equipamiento y autocuidado</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Te comprometés a usar calzado y vestimenta adecuados, hidratarte y respetar tu propio límite físico. No manipularás señalización ni obstaculizarás a otros participantes.
                              </Text>
                            </View>
                            <View className="border-t border-gray-200 pt-3">
                              <Text className="text-gray-800 font-semibold mb-1">5. Autorización de asistencia</Text>
                              <Text className="text-gray-700 text-sm leading-5">
                                Autorizás a recibir primeros auxilios y traslado si fuese necesario, asumiendo costos posteriores de atención médica especializada que no cubra la organización.
                              </Text>
                            </View>
                          </View>
                        }
                    </View>
                  </View>
                </View>
              </View>

              {/* Botones de acción */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg py-4 items-center justify-center"
                  onPress={() => setEnrollModalOpen(false)}
                  disabled={enrolling}
                >
                  <Text className="text-gray-800 font-semibold">Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 rounded-lg py-4 items-center justify-center ${
                    acceptedTerms && acceptedWaiver ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  onPress={submitEnroll}
                  disabled={enrolling || !acceptedTerms || !acceptedWaiver}
                >
                  {enrolling ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-semibold">Inscribiendo…</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      {selectedEvent?.price && selectedEvent.price > 0
                        ? `Pagar ${formatCurrency(selectedEvent.price)}`
                        : 'Confirmar inscripción'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <AlertCircle size={48} color="#0066cc" />
              <Text className="text-xl font-bold text-gray-900 mt-4">Iniciar sesión requerido</Text>
              <Text className="text-gray-600 text-center mt-2">
                Para inscribirte necesitas iniciar sesión o crear una cuenta.
              </Text>
              <View className="flex-row gap-3 mt-6 w-full">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                  onPress={() => setEnrollModalOpen(false)}
                >
                  <Text className="text-gray-800 font-semibold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-lg py-3 items-center"
                  onPress={() => {
                    setEnrollModalOpen(false);
                    router.push('/auth/LoginScreen');
                  }}
                >
                  <Text className="text-white font-semibold">Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>

    {/* Overlay de términos eliminado: ahora se muestra contenido expandible inline */}

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
              {participants.map((p) => {
                const fullName = [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Usuario';
                const rowId = `${p._id}-${p.enrollmentId || ''}`;
                const isExpanded = expandedParticipantId === rowId;
                return (
                  <View key={rowId} className="py-2 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center mr-3">
                          <Text className="text-gray-700 font-semibold">
                            {(p.nombre?.[0] || '').toUpperCase()}
                            {(p.apellido?.[0] || '').toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-gray-900 font-medium">{fullName}</Text>
                          {p.email ? <Text className="text-gray-600 text-xs">{p.email}</Text> : null}
                        </View>
                      </View>
                      {user?.role === 'superadmin' ? (
                        <TouchableOpacity
                          onPress={() => setExpandedParticipantId(isExpanded ? null : rowId)}
                          className="px-3 py-2 rounded-lg border border-gray-300"
                        >
                          <Text className="text-gray-800">{isExpanded ? 'Ocultar' : 'Ver ficha'}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {isExpanded ? (
                      <Card className="mt-3 border border-gray-200">
                        {p.createdAt ? (
                          <Text className="text-gray-700 mb-1">Inscripto: {new Date(p.createdAt).toLocaleString()}</Text>
                        ) : null}
                        <Text className="text-gray-900 font-semibold mt-1">Datos</Text>
                        <Text className="text-gray-700">DNI: {p.form?.dni ?? '-'}</Text>
                        <Text className="text-gray-700">Fecha de nacimiento: {p.form?.fechaNacimiento ? new Date(p.form.fechaNacimiento).toLocaleDateString() : '-'}</Text>
                        <Text className="text-gray-700">Género: {p.form?.genero ?? '-'}</Text>
                        <Text className="text-gray-700">Talla de remera: {p.form?.tallaRemera ?? '-'}</Text>
                        <Text className="text-gray-700">Club: {p.form?.club ?? '-'}</Text>
                        <Text className="text-gray-700">Ciudad: {p.form?.ciudad ?? '-'}</Text>
                        <Text className="text-gray-700">País: {p.form?.pais ?? '-'}</Text>

                        <Text className="text-gray-900 font-semibold mt-2">Emergencia</Text>
                        <Text className="text-gray-700">Nombre: {p.form?.emergencia?.nombre ?? '-'}</Text>
                        <Text className="text-gray-700">Teléfono: {p.form?.emergencia?.telefono ?? '-'}</Text>
                        <Text className="text-gray-700">Relación: {p.form?.emergencia?.relacion ?? '-'}</Text>

                        <Text className="text-gray-900 font-semibold mt-2">Salud</Text>
                        <Text className="text-gray-700">Alergias: {p.form?.salud?.alergias ?? '-'}</Text>
                        <Text className="text-gray-700">Condiciones: {p.form?.salud?.condiciones ?? '-'}</Text>
                        <Text className="text-gray-700">Medicamentos: {p.form?.salud?.medicamentos ?? '-'}</Text>
                      </Card>
                    ) : null}
                  </View>
                );
              })}
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
