import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function AppShell({ title, showBack, right, children, hideFooter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = !pathname || pathname === '/';
  const derivedShowBack = showBack !== undefined ? showBack : !isHome;
  const insets = useSafeAreaInsets();
  // Espacio inferior extra para mantener los iconos donde están pero llevar el fondo hasta abajo
  const bottomSpacer = hideFooter ? 0 : 16; // equivalente al offset visual anterior

  const safeBack = React.useCallback(() => {
    try {
      // Evitar dispatch de GO_BACK si no hay historial (causa el error)
      // @ts-ignore - canGoBack may exist on newer expo-router versions
      const canGo = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
      if (canGo) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  }, [router]);

  // Interceptar botón físico de back en Android para evitar 'GO_BACK' no manejado
  React.useEffect(() => {
    const onBackPress = () => {
      try {
        // @ts-ignore
        const canGo = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
        if (canGo) {
          router.back();
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
      return true; // consumimos el evento
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <StatusBar style="light" backgroundColor="#000" />
      {/* Fondo sutil global (debajo de todo) */}
      <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
        <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
      </View>

      {/* Simple black header with only app name (and optional back) */}
  <View style={{ backgroundColor: '#000', paddingTop: (insets?.top || 0) + 16, paddingBottom: 16, paddingHorizontal: 16 }}>
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
        style={{ flex: 1, paddingBottom: hideFooter ? 0 : FOOTER_HEIGHT + bottomSpacer + (insets?.bottom || 0) }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 }) as number}
      >
        {children}
      </KeyboardAvoidingView>
      {!hideFooter && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <AppFooter extraBottomSpace={bottomSpacer} />
        </View>
      )}
    </SafeAreaView>
  );
}
