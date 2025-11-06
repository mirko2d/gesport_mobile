import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../components/AppShell';
import BMICalculator from '../components/tools/BMICalculator';
import PaceCalculator from '../components/tools/PaceCalculator';
import WeatherFormosa from '../components/tools/WeatherFormosa';
import SectionTitle from '../components/ui/SectionTitle';

export default function ToolsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // Asegura que el último contenido no quede oculto detrás del footer fijo
  const bottomContentPadding = 72 + 16 + (insets?.bottom || 0) + 24; // FOOTER_HEIGHT + extra + safe-area + margen
  if (user?.role === 'superadmin') {
    router.replace('/admin/AdminProfile');
    return null;
  }
  return (
    <AppShell title="Recursos" showBack>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: bottomContentPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          <SectionTitle>RECURSOS</SectionTitle>
          <WeatherFormosa />
          <View className="mt-6">
            <PaceCalculator />
          </View>
          <View className="mt-6">
            <BMICalculator />
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
