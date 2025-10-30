import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Image as ImageIcon, Lock, Mail, MapPin, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api, baseURL, uploadAvatar } from '../../lib/api';
import Button from '../components/ui/Button';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  address: string;
  avatarUrl?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { isAuth, signin, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    address: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (params?.mode === 'register') setIsLogin(false);
  }, [params?.mode]);

  // Si la sesión ya existe, redirige al inicio (Home) donde verás tu barra de perfil arriba
  useEffect(() => {
    if (isAuth) router.replace('/');
  }, [isAuth, router]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    const emailNorm = formData.email.trim().toLowerCase();
    if (!emailNorm || !formData.password) return Alert.alert('Error', 'Por favor complete todos los campos');
    if (!emailRegex.test(emailNorm)) return Alert.alert('Error', 'Por favor ingrese un correo válido');

    try {
      setSubmitting(true);
      await signin(emailNorm, formData.password); // dentro de AuthContext envía { email, contrasenia }
      router.replace('/');
    } catch (e: any) {
      console.log('Login error', e?.response?.status, e?.response?.data);
      const msg = e?.response?.data?.error || e?.message || 'No se pudo iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    const { email, password, confirmPassword, fullName, phone, address, avatarUrl } = formData;

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password || !confirmPassword || !fullName || !phone || !address) {
      return Alert.alert('Error', 'Por favor complete todos los campos');
    }
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden');
    if (!emailRegex.test(emailNorm)) return Alert.alert('Error', 'Por favor ingrese un correo válido');

    const parts = fullName.trim().split(/\s+/);
    const nombre = parts.shift() ?? '';
    const apellido = parts.join(' ') || '-';

    try {
      setSubmitting(true);
      await api.post(
        '/auth/signup',
        { nombre, apellido, email: emailNorm, contrasenia: password, avatarUrl: (avatarUrl || undefined) },
        { headers: { 'Content-Type': 'application/json' } }
      );
  // Auto login y redirección al Home
      await signin(emailNorm, password);
  router.replace('/');
    } catch (e: any) {
      console.log('Signup error', e?.response?.status, e?.response?.data);
      const msg = e?.response?.data?.error || e?.message || 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Habilita el acceso a tus fotos para continuar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        // SDK54+ expects an array of JSMediaTypes
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      // Cancelled
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      setSubmitting(true);
      const { url } = await uploadAvatar(asset.uri);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
      Alert.alert('Foto subida', 'Tu foto fue cargada correctamente.');
    } catch (e: any) {
      console.log('Upload avatar error', e?.message, e?.response?.data);
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo cargar la imagen');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePing = async () => {
    try {
      setPingStatus('ping…');
      const { data } = await api.get('/health');
      setPingStatus(`ok: ${JSON.stringify(data)}`);
      Alert.alert('Conexión OK', `Backend respondió: ${JSON.stringify(data)}`);
    } catch (e: any) {
      console.log('Ping error', e?.message, e?.response?.status, e?.response?.data);
      const status = e?.response?.status;
      const detail = e?.response?.data?.error || e?.message || 'Error de red';
      setPingStatus(`error: ${status ?? ''} ${detail}`);
      Alert.alert('No conecta con el backend', `URL: ${baseURL}\nDetalle: ${detail}`);
    }
  };

  // Estados de carga o redirección
  if (loading || isAuth) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator />
        <Text className="text-coffee mt-3">{loading ? 'Cargando…' : 'Redirigiendo…'}</Text>
      </View>
    );
  }

  return (
  <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="flex-1">
  <View className="h-64 relative">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1629216509258-4dbd7880e605?w=900&auto=format&fit=crop&q=60' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 flex items-center justify-center px-6">
            <Text className="text-white text-3xl font-bold text-center">
              {isLogin ? 'Bienvenido a GeSport' : 'Crea tu cuenta'}
            </Text>
            <Text className="text-white text-center mt-2 text-lg">
              {isLogin ? 'Accede a eventos deportivos exclusivos' : 'Únete a nuestra comunidad deportiva'}
            </Text>
          </View>
  </View>

        <View className="p-6 bg-white rounded-t-3xl -mt-6">
          <View className="flex-row bg-white rounded-xl p-1 mb-6 border border-gray-200">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${isLogin ? 'bg-primary' : ''}`}
              onPress={() => setIsLogin(true)}
            >
              <Text className={`font-bold ${isLogin ? 'text-white' : 'text-gray-600'}`}>Iniciar Sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${!isLogin ? 'bg-primary' : ''}`}
              onPress={() => setIsLogin(false)}
            >
              <Text className={`font-bold ${!isLogin ? 'text-white' : 'text-gray-600'}`}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {!isLogin && (
              <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                <User size={20} color="#000000" />
                <TextInput
                  className="flex-1 ml-3 text-base"
                  placeholder="Nombre completo"
                  value={formData.fullName}
                  onChangeText={v => handleInputChange('fullName', v)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
              <Mail size={20} color="#000000" />
              <TextInput
                className="flex-1 ml-3 text-base"
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={v => handleInputChange('email', v)}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
              <Lock size={20} color="#000000" />
              <TextInput
                className="flex-1 ml-3 text-base"
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={v => handleInputChange('password', v)}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={20} color="#000000" /> : <Eye size={20} color="#000000" />}
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                  <Lock size={20} color="#000000" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Confirmar contraseña"
                    secureTextEntry={!showPassword}
                    value={formData.confirmPassword}
                    onChangeText={v => handleInputChange('confirmPassword', v)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                  <Phone size={20} color="#000000" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Número de teléfono"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={v => handleInputChange('phone', v)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                  <MapPin size={20} color="#000000" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Dirección"
                    value={formData.address}
                    onChangeText={v => handleInputChange('address', v)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Foto de perfil (opcional) */}
                <View className="flex-row items-center justify-between mt-2">
                  <TouchableOpacity className="flex-row items-center" onPress={handlePickAvatar}>
                    <ImageIcon size={18} color="#000000" />
                    <Text className="text-primary font-medium ml-2">Elegir imagen (opcional)</Text>
                  </TouchableOpacity>
                  {formData.avatarUrl ? (
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: formData.avatarUrl }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                      <Text className="text-gray-500 text-xs ml-2">Vista previa</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}

            <Button
              title={isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              onPress={isLogin ? handleLogin : handleRegister}
              loading={submitting}
            />

            {isLogin && (
              <TouchableOpacity className="mt-4 items-center">
                <Text className="text-primary font-medium">¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}
            <View className="mt-6 items-center">
              <Text className="text-gray-400 text-xs">API: {baseURL}</Text>
              <TouchableOpacity onPress={handlePing} className="mt-2">
                <Text className="text-primary text-xs font-semibold">Probar conexión</Text>
              </TouchableOpacity>
              {pingStatus ? (
                <Text className="text-gray-400 text-[10px] mt-1">{pingStatus}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
