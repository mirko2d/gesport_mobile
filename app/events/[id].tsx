import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    dni: '',
    fechaNacimiento: '', // YYYY-MM-DD
    genero: 'X', // 'F' | 'M' | 'X' | 'Otro'
    tallaRemera: 'M',
    emergencia: { nombre: '', telefono: '', relacion: '' },
    salud: { alergias: '' },
    aceptoTerminos: false,
    aceptoDescargo: false,
  });

  const isEnrolled = useMemo(() => (id ? enrolledEventIds.has(String(id)) : false), [enrolledEventIds, id]);
  const isFull = useMemo(() => {
    if (!event) return false;
    return typeof event.maxParticipantes === 'number' && typeof event.participantes === 'number' && event.maxParticipantes > 0 && event.participantes >= event.maxParticipantes;
  }, [event]);
  const isPast = useMemo(() => {
    if (!event?.fecha) return false;
    const when = new Date(event.fecha as string).getTime();
    return !isNaN(when) && when < Date.now();
  }, [event?.fecha]);

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
    // En vez de inscribir directo, mostramos el formulario
    setShowForm(true);
  };

  const submitEnrollment = async () => {
    // Validaciones mínimas en cliente
    if (!form.aceptoTerminos || !form.aceptoDescargo) {
      Alert.alert('Falta confirmación', 'Debes aceptar Términos y el Descargo para continuar.');
      return;
    }
    try {
      setEnrolling(true);
      await enroll(String(id), form);
      setShowForm(false);
      Alert.alert('Inscripción completada', 'Quedaste inscripto en el evento.');
      setEnrolledEventIds((prev) => new Set<string>([...prev, String(id)]));
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
                title={isPast ? 'Finalizado' : isEnrolled ? 'Inscripto' : isFull ? 'Cupos llenos' : 'Inscribirme'}
                onPress={handleEnroll}
                disabled={isPast || isEnrolled || isFull}
                loading={enrolling}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal Formulario de Inscripción */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <AppShell showBack title="Completar inscripción">
          <ScrollView className="flex-1 p-4">
            <Text className="text-lg font-bold mb-2">Datos personales</Text>
            <Text className="text-gray-700 mb-1">DNI</Text>
            <TextInput
              value={form.dni}
              onChangeText={(t) => setForm((f: any) => ({ ...f, dni: t }))}
              placeholder="Documento"
              keyboardType="number-pad"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            />
            <Text className="text-gray-700 mb-1">Fecha de nacimiento (YYYY-MM-DD)</Text>
            <TextInput
              value={form.fechaNacimiento}
              onChangeText={(t) => setForm((f: any) => ({ ...f, fechaNacimiento: t }))}
              placeholder="1990-05-21"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            />

            <Text className="text-gray-700 mb-1">Género</Text>
            <View className="flex-row gap-2 mb-3">
              {(['F','M','X','Otro'] as const).map((g) => (
                <TouchableOpacity key={g} onPress={() => setForm((f: any) => ({ ...f, genero: g }))} className={`px-3 py-2 rounded-full border ${form.genero === g ? 'bg-black border-black' : 'bg-white border-gray-300'}`}>
                  <Text className={`${form.genero === g ? 'text-white' : 'text-gray-800'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-lg font-bold mb-2">Talle de remera</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {(['XS','S','M','L','XL','XXL'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setForm((f: any) => ({ ...f, tallaRemera: t }))} className={`px-3 py-2 rounded-full border ${form.tallaRemera === t ? 'bg-black border-black' : 'bg-white border-gray-300'}`}>
                  <Text className={`${form.tallaRemera === t ? 'text-white' : 'text-gray-800'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-lg font-bold mb-2">Contacto de emergencia</Text>
            <Text className="text-gray-700 mb-1">Nombre</Text>
            <TextInput value={form.emergencia.nombre} onChangeText={(t) => setForm((f: any) => ({ ...f, emergencia: { ...f.emergencia, nombre: t } }))} placeholder="Nombre y apellido" className="border border-gray-300 rounded-lg px-3 py-2 mb-3" />
            <Text className="text-gray-700 mb-1">Teléfono</Text>
            <TextInput value={form.emergencia.telefono} onChangeText={(t) => setForm((f: any) => ({ ...f, emergencia: { ...f.emergencia, telefono: t } }))} placeholder="Ej: +595..." keyboardType="phone-pad" className="border border-gray-300 rounded-lg px-3 py-2 mb-3" />
            <Text className="text-gray-700 mb-1">Relación</Text>
            <TextInput value={form.emergencia.relacion} onChangeText={(t) => setForm((f: any) => ({ ...f, emergencia: { ...f.emergencia, relacion: t } }))} placeholder="Familiar, amigo, etc." className="border border-gray-300 rounded-lg px-3 py-2 mb-3" />

            <Text className="text-lg font-bold mb-2">Salud</Text>
            <Text className="text-gray-700 mb-1">Alergias (opcional)</Text>
            <TextInput value={form.salud.alergias} onChangeText={(t) => setForm((f: any) => ({ ...f, salud: { ...f.salud, alergias: t } }))} placeholder="Ej: penicilina, frutos secos" className="border border-gray-300 rounded-lg px-3 py-2 mb-3" />

            <View className="mt-2">
              <TouchableOpacity onPress={() => setForm((f: any) => ({ ...f, aceptoTerminos: !f.aceptoTerminos }))} className="flex-row items-center mb-2">
                <Text className="text-2xl mr-2">{form.aceptoTerminos ? '☑' : '☐'}</Text>
                <Text className="text-gray-800">Acepto Términos y Condiciones</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setForm((f: any) => ({ ...f, aceptoDescargo: !f.aceptoDescargo }))} className="flex-row items-center">
                <Text className="text-2xl mr-2">{form.aceptoDescargo ? '☑' : '☐'}</Text>
                <Text className="text-gray-800">Acepto el Descargo de responsabilidad</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mt-6">
              <Button title="Cancelar" variant="secondary" onPress={() => setShowForm(false)} />
              <Button title="Confirmar inscripción" onPress={submitEnrollment} loading={enrolling} />
            </View>
          </ScrollView>
        </AppShell>
      </Modal>
    </AppShell>
  );
}
