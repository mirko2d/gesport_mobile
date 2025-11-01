import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ChevronRight, Clock, MapPin, MessageCircle, Trophy } from 'lucide-react-native';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import SectionTitle from '../components/ui/SectionTitle';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <AppShell showBack title="Conócenos">
      <ScrollView className="flex-1 bg-white">
        {/* Hero */}
        <LinearGradient colors={["#000000", "#1a1a1a"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="px-4 py-10">
          <Text className="text-white text-4xl font-extrabold">GeSPORT</Text>
          <Text className="text-white/90 text-lg leading-7 mt-3">
            Somos una comunidad que impulsa el running con eventos seguros, vibrantes y bien organizados. 
            Conectamos deportistas de todos los niveles para vivir la experiencia de correr, competir y superar metas.
          </Text>
          <View className="flex-row gap-3 mt-6">
            <Link href="/events/TodosEvents" asChild>
              <Button title="Ver eventos" variant="primary" />
            </Link>
            <Link href="/calendario/Calendar" asChild>
              <Button title="Calendario" variant="secondary" />
            </Link>
          </View>
        </LinearGradient>

        {/* Misión */}
        <View className="px-6 py-8">
          <SectionTitle>NUESTRA MISIÓN</SectionTitle>
          <View className="bg-black rounded-2xl p-5 mt-3">
            <Text className="text-white text-lg leading-7">
              Crear experiencias deportivas memorables, promover hábitos saludables y construir una comunidad 
              inclusiva donde cada corredor encuentre su mejor versión.
            </Text>
          </View>
        </View>

        {/* Qué hacemos */}
        <View className="px-6">
          <SectionTitle>QUÉ HACEMOS</SectionTitle>
          <View className="mt-4 gap-3">
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex-row items-center">
              <Trophy color="#111" size={18} />
              <Text className="text-gray-800 ml-2">Eventos seguros y bien señalizados</Text>
            </View>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex-row items-center">
              <MessageCircle color="#111" size={18} />
              <Text className="text-gray-800 ml-2">Comunidad y acompañamiento</Text>
            </View>
            <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex-row items-center">
              <Clock color="#111" size={18} />
              <Text className="text-gray-800 ml-2">Entrenamientos y seguimiento</Text>
            </View>
          </View>
        </View>

        {/* Dónde estamos */}
        <View className="px-6 mt-8">
          <SectionTitle>DÓNDE ESTAMOS</SectionTitle>
          <View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex-row items-center mt-3">
            <MapPin color="#111" size={18} />
            <Text className="text-gray-800 ml-2">Formosa, Argentina</Text>
          </View>
        </View>

        {/* Cómo participar */}
        <View className="px-6 mt-8">
          <SectionTitle>CÓMO PARTICIPAR</SectionTitle>
          <View className="mt-4 gap-3">
            <TouchableOpacity onPress={() => router.push('/events/TodosEvents')} className="bg-black rounded-xl px-4 py-3 flex-row items-center justify-between">
              <Text className="text-white font-semibold">Inscribite a próximos eventos</Text>
              <ChevronRight color="#fff" size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/chat/Index')} className="bg-black rounded-xl px-4 py-3 flex-row items-center justify-between">
              <Text className="text-white font-semibold">Unite a la conversación</Text>
              <ChevronRight color="#fff" size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/noticias/Index')} className="bg-black rounded-xl px-4 py-3 flex-row items-center justify-between">
              <Text className="text-white font-semibold">Leé nuestras noticias</Text>
              <ChevronRight color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contacto */}
        <View className="px-6 mt-8 mb-12">
          <SectionTitle>CONTACTO</SectionTitle>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:contacto@gesport.example')} className="mt-3">
            <Text className="text-primary font-semibold">contacto@gesport.example</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppShell>
  );
}
