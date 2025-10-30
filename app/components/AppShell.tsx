import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppFooter from './ui/AppFooter';

type Props = {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
  hideFooter?: boolean;
};

const FOOTER_HEIGHT = 72;
const FOOTER_OFFSET = 12; // raise footer slightly above the OS edge

export default function AppShell({ title, showBack, right, children, hideFooter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = !pathname || pathname === '/';
  const derivedShowBack = showBack !== undefined ? showBack : !isHome;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Fondo sutil global (debajo de todo) */}
      <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
        <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
      </View>

      {/* Simple black header with only app name (and optional back) */}
      <View style={{ backgroundColor: '#000', paddingVertical: 16, paddingHorizontal: 16, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 44, alignItems: 'flex-start', justifyContent: 'center' }}>
            {derivedShowBack ? (
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
              >
                <ArrowLeft color="white" size={20} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44, height: 44 }} />
            )}
          </View>
          <Text className="text-white text-xl font-extrabold">GESPORT</Text>
          {/* Right content (optional) to keep title centered */}
          <View style={{ width: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
            {right ? right : <View style={{ width: 44, height: 44 }} />}
          </View>
        </View>
      </View>

      {/* Contenido con padding inferior para footer fijo (ajustado por offset) */}
      <View style={{ flex: 1, paddingBottom: hideFooter ? 0 : FOOTER_HEIGHT + FOOTER_OFFSET }}>{children}</View>
      {!hideFooter && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: FOOTER_OFFSET }}>
          <AppFooter />
        </View>
      )}
    </SafeAreaView>
  );
}
