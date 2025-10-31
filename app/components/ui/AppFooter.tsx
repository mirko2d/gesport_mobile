import { usePathname, useRouter } from 'expo-router';
import { MessageCircle, Newspaper, User, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';

// Bottom navigation bar: Noticias, Actividad, Herramientas, Perfil
export default function AppFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

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
  const isChat = pathname?.startsWith('/chat');
  const chatMode = !!isChat;
  const activeColor = chatMode ? '#FFFFFF' : '#111';
  const inactiveColor = '#9CA3AF';
  const isPerfil = pathname?.startsWith('/profile');
  const isEventos = pathname?.startsWith('/events');

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: chatMode ? '#000' : '#fff',
        borderTopWidth: chatMode ? 0 : 1,
        borderTopColor: chatMode ? '#000' : '#E5E7EB',
        paddingHorizontal: 8,
      }}
    >
      {isPrivileged ? (
        <>
          <Tab
            label="Noticias"
            active={!!isNoticias}
            onPress={() => router.replace('/?from=footer')}
            icon={<Newspaper color={isNoticias ? activeColor : inactiveColor} size={22} />}
          />
          <Tab
            label="Eventos"
            active={!!isEventos}
            onPress={() => router.replace('/events/TodosEvents')}
            icon={<Zap color={isEventos ? activeColor : inactiveColor} size={22} />}
          />
          <Tab
            label="Perfil"
            active={!!isPerfil || pathname?.startsWith('/admin/AdminProfile')}
            onPress={() => router.replace('/admin/AdminProfile')}
            icon={<User color={(isPerfil || pathname?.startsWith('/admin/AdminProfile')) ? activeColor : inactiveColor} size={22} />}
          />
        </>
      ) : (
        <>
          <Tab
            label="Noticias"
            active={!!isNoticias}
            onPress={() => router.replace('/')}
            icon={<Newspaper color={isNoticias ? activeColor : inactiveColor} size={22} />}
          />
          <Tab
            label="Actividad"
            active={!!isActividad}
            onPress={() => router.replace('/actividad/Index')}
            icon={<Zap color={isActividad ? activeColor : inactiveColor} size={22} />}
          />
          <Tab
            label="Chat"
            active={!!isChat}
            onPress={() => router.replace('/chat/Index')}
            icon={<MessageCircle color={isChat ? activeColor : inactiveColor} size={22} />}
          />
          <Tab
            label="Recursos"
            active={!!isHerramientas}
            onPress={() => router.replace('/herramientas/Index')}
            icon={<Text style={{ fontSize: 20, color: isHerramientas ? activeColor : inactiveColor }}>🏃</Text>}
          />
          <Tab
            label="Perfil"
            active={!!isPerfil}
            onPress={() => router.replace('/profile/profile')}
            icon={<User color={isPerfil ? activeColor : inactiveColor} size={22} />}
          />
        </>
      )}
    </View>
  );
}
