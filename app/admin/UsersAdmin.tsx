import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // ajusta ruta si difiere
import { listUsersAdmin, setUserRole } from '../../lib/api'; // ajusta ruta si difiere
import AppShell from '../components/AppShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type UserDoc = {
  _id: string;
  nombre?: string;
  apellido?: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin' | string;
};

export default function UsersAdmin() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserDoc[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isSuperadmin = user?.role === 'superadmin';
  const isAdminOrSuper = isSuperadmin || user?.role === 'admin';

  useEffect(() => {
    if (!isAdminOrSuper) {
      // si no es superadmin, reenvía fuera
      router.replace('/profile/profile');
      return;
    }
    (async () => {
      try {
        setLoading(true);
  const data: UserDoc[] = await listUsersAdmin();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cargar usuarios');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminOrSuper, isSuperadmin, router]);

  const fullName = (u: UserDoc) => [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email;

  const onPromote = async (u: UserDoc) => {
    try {
      setBusyId(u._id);
      await setUserRole(u._id, 'admin');
      setRows((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: 'admin' } : x)));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };
  const onDemote = async (u: UserDoc) => {
    try {
      setBusyId(u._id);
      await setUserRole(u._id, 'user');
      setRows((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: 'user' } : x)));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell showBack title="Administrar usuarios">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-coffee mt-3">Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {rows.map((u) => (
            <Card key={u._id} className="mb-3">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-gray-900 font-semibold">{fullName(u)}</Text>
                  <Text className="text-gray-600 text-sm">{u.email}</Text>
                </View>
                <View className="px-2 py-1 rounded-full bg-white">
                  <Text className="text-coffee text-xs">Rol: {u.role}</Text>
                </View>
              </View>

              {/* Botones */}
              {isSuperadmin ? (
                <View className="flex-row gap-2 mt-3">
                  {u.role !== 'admin' && u.role !== 'superadmin' ? (
                    <Button
                      title={busyId === u._id ? 'Aplicando...' : 'Hacer admin'}
                      onPress={() => onPromote(u)}
                    />
                  ) : null}

                  {u.role === 'admin' ? (
                    <Button
                      title={busyId === u._id ? 'Aplicando...' : 'Quitar admin'}
                      variant="outline"
                      onPress={() => onDemote(u)}
                    />
                  ) : null}
                </View>
              ) : null}
            </Card>
          ))}

          {rows.length === 0 && (
            <View className="items-center justify-center py-20">
              <Text className="text-brown">No hay usuarios cargados.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </AppShell>
  );
}
