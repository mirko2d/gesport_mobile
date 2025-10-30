import { usePathname, useRouter } from 'expo-router';
import { Newspaper, User, Wrench, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Bottom navigation bar: Noticias, Actividad, Herramientas, Perfil
export default function AppFooter() {
  const pathname = usePathname();
  const router = useRouter();

  const Tab = ({
    label,
    icon,
    active,
    onPress,
  }: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 40,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 12, color: active ? '#111' : '#9CA3AF', fontWeight: active ? '700' as any : '500' as any }}>{label}</Text>
    </TouchableOpacity>
  );

  const isNoticias = pathname === '/' || pathname === '/index';
  const isActividad = pathname?.startsWith('/actividad');
  const isHerramientas = pathname?.startsWith('/herramientas');
  const isPerfil = pathname?.startsWith('/profile');

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingHorizontal: 8,
      }}
    >
      <Tab
        label="Noticias"
        active={!!isNoticias}
        onPress={() => router.replace('/')}
        icon={<Newspaper color={isNoticias ? '#111' : '#9CA3AF'} size={22} />}
      />
      <Tab
        label="Actividad"
        active={!!isActividad}
        onPress={() => router.replace('/actividad/Index')}
        icon={<Zap color={isActividad ? '#111' : '#9CA3AF'} size={22} />}
      />
      <Tab
        label="Herramientas"
        active={!!isHerramientas}
        onPress={() => router.replace('/herramientas/Index')}
        icon={<Wrench color={isHerramientas ? '#111' : '#9CA3AF'} size={22} />}
      />
      <Tab
        label="Perfil"
        active={!!isPerfil}
        onPress={() => router.replace('/profile/profile')}
        icon={<User color={isPerfil ? '#111' : '#9CA3AF'} size={22} />}
      />
    </View>
  );
}
