import React from 'react';
import { ScrollView, View } from 'react-native';
import AppShell from '../components/AppShell';
import BMICalculator from '../components/tools/BMICalculator';
import ChatCoach from '../components/tools/ChatCoach';
import PaceCalculator from '../components/tools/PaceCalculator';
import SectionTitle from '../components/ui/SectionTitle';

export default function ToolsScreen() {
  return (
    <AppShell title="Herramientas" showBack>
      <ScrollView className="flex-1 bg-white">
        <View className="px-6 py-6">
          <SectionTitle>HERRAMIENTAS</SectionTitle>
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
