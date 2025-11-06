import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function AdminProfile() {
  const router = useRouter();
  const { user, signout } = useAuth();
  const isSuper = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  // Guard: only admin/superadmin can be here
  useEffect(() => {
    if (!isSuper && !isAdmin) {
      router.replace('/profile/profile');
    }
  }, [isSuper, isAdmin, router]);
  if (!isSuper && !isAdmin) return null;

  const handleSignout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await signout();
          } finally {
            router.replace('/auth/LoginScreen');
          }
        },
      },
    ]);
  };

  return (
    <AppShell title={isSuper ? 'Panel Superadmin' : 'Panel Admin'}>
      <ScrollView
        className="flex-1 bg-white px-6 py-6"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator
      >
        <Text className="text-black text-2xl font-extrabold mb-3">
          {isSuper ? 'Control total del sitio' : 'Acceso restringido'}
        </Text>
        <Text className="text-gray-700 mb-6">
          {isSuper
            ? 'Gestioná eventos, noticias y usuarios desde aquí.'
            : 'Tu acceso está limitado. Podés ver noticias y administrar tu sesión.'}
        </Text>

        {isSuper ? (
          <Card className="mb-6">
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => router.push('/admin/EventsAdmin')}
                className="bg-black rounded-xl px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Administrar eventos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/NewsAdmin')}
                className="bg-black rounded-xl px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Administrar noticias</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/UsersAdmin')}
                className="bg-black rounded-xl px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Administrar usuarios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/events/TodosEvents')}
                className="bg-gray-900 rounded-xl px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Ver eventos (público)</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card className="mb-6">
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => router.push('/events/TodosEvents')}
                className="bg-black rounded-xl px-4 py-3 items-center"
              >
                <Text className="text-white font-semibold">Ver eventos</Text>
              </TouchableOpacity>
              <Text className="text-gray-800">No tenés permisos de edición. Contactá al superadmin si necesitás más acceso.</Text>
            </View>
          </Card>
        )}

        <Button title="Cerrar sesión" onPress={handleSignout} />
      </ScrollView>
    </AppShell>
  );
}
