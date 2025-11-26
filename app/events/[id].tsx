import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Calendar, CheckCircle2, Eye, FileText, Heart, MapPin, User as UserIcon, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { enroll, getEvent, myEnrollments, updateMe } from '../../lib/api';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import TermsModal from '../components/ui/TermsModal';

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
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  // Campos opcionales
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Campos obligatorios
  const [dni, setDni] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'F'|'M'|'X'|'Otro' | ''>('');
  const [shirtSize, setShirtSize] = useState<'XS'|'S'|'M'|'L'|'XL'|'XXL' | ''>('');
  const [emgName, setEmgName] = useState('');
  const [emgPhone, setEmgPhone] = useState('');
  const [emgRelation, setEmgRelation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [meds, setMeds] = useState('');

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

  // Prefill datos usuario
  useEffect(() => {
    if (isAuth && user) {
      const name = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
      setFullName(name);
      setEmail(user?.email ?? '');
    }
  }, [isAuth, user]);

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
    if (!acceptedTerms || !acceptedWaiver) {
      Alert.alert('Falta confirmación', 'Debes aceptar Términos y Descargo para continuar.');
      return;
    }
    const payload = {
      dni,
      fechaNacimiento: birthdate,
      genero: gender || 'X',
      tallaRemera: shirtSize || 'M',
      emergencia: { nombre: emgName, telefono: emgPhone, relacion: emgRelation },
      salud: { alergias: allergies, condiciones: conditions, medicamentos: meds },
      aceptoTerminos: acceptedTerms,
      aceptoDescargo: acceptedWaiver,
    };
    try {
      setEnrolling(true);
      await enroll(String(id), payload);
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
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/40">
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
            <View className="flex-1 bg-white rounded-t-3xl mt-2 overflow-hidden">
              {/* Header */}
              <View className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-6 pb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-2xl font-extrabold text-white">¡Inscripción!</Text>
                    <Text className="text-white/90 text-sm mt-1">{event?.titulo || 'Evento'}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => setShowTerms(true)} className="bg-white/20 px-3 py-2 rounded-full">
                      <Text className="text-white font-semibold">Términos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowForm(false)} className="bg-white/20 p-2 rounded-full">
                      <Text className="text-white font-bold text-xl">✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 240 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator
                scrollIndicatorInsets={{ bottom: 24 }}
                contentInset={{ bottom: 24 } as any}
              >
                {/* Datos personales */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <UserIcon size={20} color="#0066cc" />
                    <Text className="text-lg font-bold text-gray-900">Datos personales</Text>
                  </View>
                  <View className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Nombre completo</Text>
                      <TextInput className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white" placeholder="Tu nombre" placeholderTextColor="#9ca3af" value={fullName} onChangeText={setFullName} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Email</Text>
                      <TextInput className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white" placeholder="tu@email.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Teléfono (opcional)</Text>
                      <TextInput className="border-2 border-gray-200 rounded-lg px-4 py-3 bg-white" placeholder="Ej: +57 300 123 4567" placeholderTextColor="#9ca3af" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                    </View>
                  </View>
                </View>

                {/* Datos inscripción */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <FileText size={20} color="#0066cc" />
                    <Text className="text-lg font-bold text-gray-900">Datos de inscripción</Text>
                  </View>
                  <View className="bg-blue-50 rounded-xl p-4 space-y-4">
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">DNI *</Text>
                      <TextInput className="border-2 border-blue-200 rounded-lg px-4 py-3 bg-white" placeholder="Tu DNI" placeholderTextColor="#9ca3af" value={dni} onChangeText={setDni} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Fecha de nacimiento (YYYY-MM-DD) *</Text>
                      <TextInput className="border-2 border-blue-200 rounded-lg px-4 py-3 bg-white" placeholder="1990-05-20" placeholderTextColor="#9ca3af" value={birthdate} onChangeText={setBirthdate} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-3">Género *</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {(['F','M','X','Otro'] as const).map((g) => (
                          <TouchableOpacity key={g} onPress={() => setGender(g)} className={`px-4 py-3 rounded-lg font-semibold ${gender === g ? 'bg-primary' : 'bg-white border-2 border-blue-200'}`}> 
                            <Text className={gender === g ? 'text-white font-semibold' : 'text-gray-700'}>{g}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-3">Talla de remera *</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {(['XS','S','M','L','XL','XXL'] as const).map((t) => (
                          <TouchableOpacity key={t} onPress={() => setShirtSize(t)} className={`px-3 py-2 rounded-lg ${shirtSize === t ? 'bg-primary' : 'bg-white border-2 border-blue-200'}`}>
                            <Text className={shirtSize === t ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Contacto emergencia */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <AlertCircle size={20} color="#0066cc" />
                    <Text className="text-lg font-bold text-gray-900">Contacto de emergencia</Text>
                  </View>
                  <View className="bg-red-50 rounded-xl p-4 space-y-4">
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Nombre *</Text>
                      <TextInput className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white" placeholder="Nombre de contacto" placeholderTextColor="#9ca3af" value={emgName} onChangeText={setEmgName} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Teléfono *</Text>
                      <TextInput className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white" placeholder="Teléfono de contacto" placeholderTextColor="#9ca3af" value={emgPhone} onChangeText={setEmgPhone} keyboardType="phone-pad" />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Relación (opcional)</Text>
                      <TextInput className="border-2 border-red-200 rounded-lg px-4 py-3 bg-white" placeholder="Ej: Familiar, Amigo" placeholderTextColor="#9ca3af" value={emgRelation} onChangeText={setEmgRelation} />
                    </View>
                  </View>
                </View>

                {/* Salud */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Heart size={20} color="#0066cc" />
                    <Text className="text-lg font-bold text-gray-900">Información de salud</Text>
                    <Text className="text-gray-500 text-xs">(opcional)</Text>
                  </View>
                  <View className="bg-green-50 rounded-xl p-4 space-y-4">
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Alergias</Text>
                      <TextInput className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white" placeholder="Ej: Penicilina, cacahuetes" placeholderTextColor="#9ca3af" value={allergies} onChangeText={setAllergies} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Condiciones de salud</Text>
                      <TextInput className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white" placeholder="Ej: Asma, diabetes" placeholderTextColor="#9ca3af" value={conditions} onChangeText={setConditions} />
                    </View>
                    <View>
                      <Text className="text-gray-700 font-semibold mb-2">Medicamentos actuales</Text>
                      <TextInput className="border-2 border-green-200 rounded-lg px-4 py-3 bg-white" placeholder="Ej: Ibuprofeno, vitaminas" placeholderTextColor="#9ca3af" value={meds} onChangeText={setMeds} />
                    </View>
                  </View>
                </View>

                {/* Términos */}
                <View className="mb-6">
                  <View className="bg-gray-100 rounded-xl p-4 space-y-4">
                    <View className="flex-row items-start gap-3">
                      <TouchableOpacity onPress={() => setAcceptedTerms((v) => !v)} className={`w-6 h-6 rounded-lg border-2 mt-1 items-center justify-center flex-shrink-0 ${acceptedTerms ? 'bg-primary border-primary' : 'border-gray-400 bg-white'}`}>
                        {acceptedTerms && <CheckCircle2 size={20} color="#fff" />}
                      </TouchableOpacity>
                      <View className="flex-1">
                        <Text className="text-gray-700 font-semibold">Acepto los términos y condiciones *</Text>
                        <TouchableOpacity onPress={() => setShowTerms(true)} className="flex-row items-center gap-1 mt-2">
                          <Eye size={16} color="#0066cc" />
                          <Text className="text-primary font-semibold underline">Ver términos y condiciones</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View className="flex-row items-start gap-3">
                      <TouchableOpacity onPress={() => setAcceptedWaiver((v) => !v)} className={`w-6 h-6 rounded-lg border-2 mt-1 items-center justify-center flex-shrink-0 ${acceptedWaiver ? 'bg-primary border-primary' : 'border-gray-400 bg-white'}`}>
                        {acceptedWaiver && <CheckCircle2 size={20} color="#fff" />}
                      </TouchableOpacity>
                      <View className="flex-1">
                        <Text className="text-gray-700 font-semibold">Acepto el descargo de responsabilidad *</Text>
                        <Text className="text-gray-600 text-xs mt-1">Reconozco los riesgos inherentes a la actividad deportiva</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Acciones */}
                <View className="flex-row gap-3">
                  <TouchableOpacity className="flex-1 bg-gray-200 rounded-lg py-4 items-center justify-center" onPress={() => setShowForm(false)} disabled={enrolling}>
                    <Text className="text-gray-800 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className={`flex-1 rounded-lg py-4 items-center justify-center ${acceptedTerms && acceptedWaiver ? 'bg-primary' : 'bg-gray-300'}`} onPress={submitEnrollment} disabled={enrolling || !acceptedTerms || !acceptedWaiver}>
                    {enrolling ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-semibold">Inscribiendo…</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-base">Confirmar inscripción</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={async () => {
          setAcceptedTerms(true);
          setShowTerms(false);
          try {
            if (user && (user as any)._id) {
              const key = `@gesport:acceptedTerms:${(user as any)._id}`;
              await AsyncStorage.setItem(key, '1');
              try { await updateMe({ acceptedTerms: true } as any); } catch {}
            }
          } catch {}
        }}
      />
    </AppShell>
  );
}
