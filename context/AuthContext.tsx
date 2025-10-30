// app/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { me as apiMe, signin as apiSignin, setToken } from '../lib/api';

type User = {
  _id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  avatarUrl?: string;
  pesoKg?: number;
  alturaCm?: number;
  role?: string;
};

type AuthContextType = {
  isAuth: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTok] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehidratar token al abrir la app
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@gesport_token');
        if (saved) {
          setTok(saved);
          setToken(saved);
          try {
            const u = await apiMe();
            if (u) setUser(u);
            else {
              // Si no se pudo recuperar el perfil, invalida el token guardado
              setTok(null);
              setUser(null);
              setToken(null);
              await AsyncStorage.removeItem('@gesport_token');
            }
          } catch (err) {
            // Token inválido o backend inaccesible: limpia para permitir login
            setTok(null);
            setUser(null);
            setToken(null);
            await AsyncStorage.removeItem('@gesport_token');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signin = async (email: string, password: string) => {
    // Llama /auth/signin con { email, contrasenia }
    const { token: t, user: u } = await apiSignin(email, password);
    setTok(t);
    setUser(u);
    setToken(t);
    await AsyncStorage.setItem('@gesport_token', t);
  };

  const signout = async () => {
    setTok(null);
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('@gesport_token');
  };

  const refreshMe = async () => {
    if (!token) return;
    const u = await apiMe();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ isAuth: !!token, token, user, loading, signin, signout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
