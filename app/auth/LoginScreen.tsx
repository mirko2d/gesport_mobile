import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Button from '../components/ui/Button';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { isAuth, signin, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
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
  const normalizeEmail = (email: string) => {
    const raw = (email || '').trim().toLowerCase();
    const parts = raw.split('@');
    if (parts.length !== 2) return raw;
    let [local, domain] = parts;
    if (domain === 'googlemail.com') domain = 'gmail.com';
    if (domain === 'gmail.com') {
      const base = local.split('+')[0];
      local = base.replace(/\./g, '');
    }
    return `${local}@${domain}`;
  };

  const isStrongPassword = (pw: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);

  const handleLogin = async () => {
  const emailNorm = normalizeEmail(formData.email);
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
    const { email, password, confirmPassword, firstName, lastName, phone, address } = formData;

    const emailNorm = normalizeEmail(email);
    if (!emailNorm || !password || !confirmPassword || !firstName || !lastName || !phone || !address) {
      return Alert.alert('Error', 'Por favor complete todos los campos');
    }
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden');
    if (!emailRegex.test(emailNorm)) return Alert.alert('Error', 'Por favor ingrese un correo válido');
    if (!isStrongPassword(password)) {
      return Alert.alert('Contraseña insegura', 'Debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.');
    }

    const nombre = firstName.trim();
    const apellido = lastName.trim();

    try {
      setSubmitting(true);
      await api.post(
        '/auth/signup',
        { nombre, apellido, email: emailNorm, contrasenia: password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      // Registro exitoso: limpiar formulario y redirigir explícitamente a pantalla de login
      Alert.alert('Registro exitoso', 'Tu cuenta fue creada. Inicia sesión para continuar.');
      setFormData({
        email: emailNorm,
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
      });
      setIsLogin(true);
      router.replace('/auth/LoginScreen');
    } catch (e: any) {
      console.log('Signup error', e?.response?.status, e?.response?.data);
      const msg = e?.response?.data?.error || e?.message || 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminado flujo de subida de avatar

  // Probar conexión (debug) eliminado para producción

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
  <KeyboardAvoidingView
    behavior={Platform.select({ ios: 'padding', android: undefined })}
    style={{ flex: 1 }}
    keyboardVerticalOffset={64}
  >
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
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
              <>
                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                  <User size={20} color="#000000" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Nombre"
                    value={formData.firstName}
                    onChangeText={v => handleInputChange('firstName', v)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
                  <User size={20} color="#000000" />
                  <TextInput
                    className="flex-1 ml-3 text-base"
                    placeholder="Apellido"
                    value={formData.lastName}
                    onChangeText={v => handleInputChange('lastName', v)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </>
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

                {/* Avatar removido */}
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
            {/* Indicadores de API y Probar conexión eliminados para producción */}
          </View>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  );
}
