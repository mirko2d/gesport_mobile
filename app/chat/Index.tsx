import React from 'react';
import { View } from 'react-native';
import AppShell from '../components/AppShell';
import ChatCoach from '../components/tools/ChatCoach';

export default function ChatScreen() {
  return (
    <AppShell title="Chat" showBack>
      <View style={{ flex: 1 }}>
        <ChatCoach fullScreen />
      </View>
    </AppShell>
  );
}
