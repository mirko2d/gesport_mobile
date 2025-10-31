import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../components/AppShell';
import BMICalculator from '../components/tools/BMICalculator';
import ChatCoach from '../components/tools/ChatCoach';
import PaceCalculator from '../components/tools/PaceCalculator';
import SectionTitle from '../components/ui/SectionTitle';

export default function ToolsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  if (user?.role === 'superadmin') {
    router.replace('/admin/AdminProfile');
    return null;
  }
  return (
    <AppShell title="Recursos" showBack>
      <ScrollView className="flex-1 bg-white">
        <View className="px-6 py-6">
          <SectionTitle>RECURSOS</SectionTitle>
          <PaceCalculator />
          <BMICalculator />
          <View className="mt-6">
            <ChatCoach />
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
