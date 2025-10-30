import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Trophy, User, Users } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, Text, View } from 'react-native';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';

const screenWidth = Dimensions.get('window').width;

// Fallback/mock data
const fallbackEvent = {
  id: '1',
  title: 'Torneo de Fútbol Amateur',
  date: 'Sábado, 15 de Junio 2024',
  time: '10:00 AM - 6:00 PM',
  location: 'Estadio Municipal, Calle Deportes 123',
  description:
    'Participa en nuestro torneo de fútbol amateur donde equipos compiten por el campeonato local. ¡Abierto a todos los niveles! Incluye premios para los tres primeros lugares.',
  participants: 18,
  maxParticipants: 24,
  category: 'Fútbol',
  organizer: 'Club Deportivo Local',
  imageUrl:
    'https://images.unsplash.com/photo-1576267423048-15c0040fec78?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y29sbGFib3JhdGlvbiUyMHN1Y2Nlc3N8ZW58MHx8MHx8fDA%3D',
  prize: 'Trofeo + $500.000',
};

export default function MasInformacion() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId?: string;
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    participants?: string;
    maxParticipants?: string;
    category?: string;
    organizer?: string;
    imageUrl?: string;
    prize?: string;
  }>();

  // Simulación de auth (ajústalo a tu estado global/secure store)
  const [isLoggedIn] = useState<boolean>(false);

  // Mezcla params con el fallback
  const eventData = useMemo(() => {
    return {
      ...fallbackEvent,
      ...(params.title ? { title: String(params.title) } : {}),
      ...(params.date ? { date: String(params.date) } : {}),
      ...(params.time ? { time: String(params.time) } : {}),
      ...(params.location ? { location: String(params.location) } : {}),
      ...(params.description ? { description: String(params.description) } : {}),
      ...(params.participants ? { participants: Number(params.participants) } : {}),
      ...(params.maxParticipants ? { maxParticipants: Number(params.maxParticipants) } : {}),
      ...(params.category ? { category: String(params.category) } : {}),
      ...(params.organizer ? { organizer: String(params.organizer) } : {}),
      ...(params.imageUrl ? { imageUrl: String(params.imageUrl) } : {}),
      ...(params.prize ? { prize: String(params.prize) } : {}),
    };
  }, [params]);

  const handleParticipate = () => {
    if (isLoggedIn) {
      Alert.alert('¡Listo!', '¡Te has inscrito exitosamente al evento!');
    } else {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para participar en este evento');
    }
  };

  return (
    <AppShell showBack title={String(eventData.title)}>
      <ScrollView className="flex-1">
        {/* Event Image */}
        <View className="relative">
          <Image
            source={{ uri: eventData.imageUrl }}
            style={{ width: screenWidth, height: 240 }}
            className="rounded-b-3xl"
            resizeMode="cover"
          />
          <View className="absolute bottom-4 right-4 bg-[#d14536] px-3 py-1 rounded-full">
            <Text className="text-white font-bold">{eventData.category}</Text>
          </View>
        </View>

        {/* Event Details */}
        <View className="p-4">
          {/* Date and Time */}
          <View className="flex-row items-center mb-3">
            <Calendar color="#4B5563" size={20} />
            <Text className="text-gray-700 ml-2 font-medium">{eventData.date}</Text>

            <View style={{ width: 16 }} />
            <Clock color="#4B5563" size={20} />
            <Text className="text-gray-700 ml-2 font-medium">{eventData.time}</Text>
          </View>

          {/* Location */}
          <View className="flex-row items-center mb-3">
            <MapPin color="#4B5563" size={20} />
            <Text className="text-gray-700 ml-2 font-medium">{eventData.location}</Text>
          </View>

          {/* Participants */}
          <View className="flex-row items-center mb-4">
            <Users color="#4B5563" size={20} />
            <Text className="text-gray-700 ml-2 font-medium">
              {eventData.participants} / {eventData.maxParticipants} participantes
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full h-3 bg-gray-200 rounded-full mb-6">
            <View
              className="h-full bg-[#d14536] rounded-full"
              style={{
                width: `${(eventData.participants / eventData.maxParticipants) * 100}%`,
              }}
            />
          </View>

          {/* Description */}
          <Text className="text-gray-800 text-lg font-bold mb-3">Descripción</Text>
          <Text className="text-gray-600 mb-6">{eventData.description}</Text>

          {/* Organizer */}
          <View className="flex-row items-center mb-6">
            <User color="#4B5563" size={20} />
            <Text className="text-gray-700 ml-2 font-medium">
              Organizado por: {eventData.organizer}
            </Text>
          </View>

          {/* Prize */}
          <View className="flex-row items-center mb-8">
            <Trophy color="#F59E0B" size={20} />
            <Text className="text-gray-700 ml-2 font-bold">Premio: {eventData.prize}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Participation Section */}
      <View className="p-4 bg-white border-t border-gray-200">
        {isLoggedIn ? (
          <Button title="Participar en el Evento" onPress={handleParticipate} />
        ) : (
          <View>
            <Text className="text-gray-700 text-center mb-4">
              Debes iniciar sesión para participar en este evento
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Iniciar Sesión" onPress={() => router.push('/auth/LoginScreen')} />
              </View>
              <View className="flex-1">
                <Button title="Registrarse" variant="outline" onPress={() => router.push('/auth/LoginScreen?mode=register')} />
              </View>
            </View>
          </View>
        )}
      </View>
    </AppShell>
  );
}
