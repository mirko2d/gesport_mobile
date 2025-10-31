import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppFooter from './ui/AppFooter';

type Props = {
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  children?: React.ReactNode;
  hideFooter?: boolean;
};

const FOOTER_HEIGHT = 72;
const FOOTER_OFFSET = 12; // base lift above OS edge
const FOOTER_EXTRA_LIFT = 4; // lowered closer to edge per feedback

export default function AppShell({ title, showBack, right, children, hideFooter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = !pathname || pathname === '/';
  const derivedShowBack = showBack !== undefined ? showBack : !isHome;
  const insets = useSafeAreaInsets();
  const footerBottomOffset = hideFooter
    ? 0
    : Math.max(FOOTER_OFFSET + FOOTER_EXTRA_LIFT, (insets?.bottom || 0) + FOOTER_OFFSET + FOOTER_EXTRA_LIFT);

  const safeBack = React.useCallback(() => {
    try {
      // @ts-ignore - canGoBack is available in expo-router >= 3
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
      router.back();
      // If back didn't navigate (no history), ensure we land somewhere sensible
      setTimeout(() => {
        // @ts-ignore accessing private state is not supported; fallback to replace home
        router.replace('/');
      }, 50);
    } catch {
      router.replace('/');
    }
  }, [router]);

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
                onPress={safeBack}
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

      {/* Contenido con padding inferior para footer fijo (ajustado por offset) y evitando cubrir por teclado */}
      <KeyboardAvoidingView
        style={{ flex: 1, paddingBottom: hideFooter ? 0 : FOOTER_HEIGHT + footerBottomOffset }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={0}
      >
        {children}
      </KeyboardAvoidingView>
      {!hideFooter && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: footerBottomOffset }}>
          <AppFooter />
        </View>
      )}
    </SafeAreaView>
  );
}
