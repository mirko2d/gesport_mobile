import { Stack } from "expo-router";
import React, { useEffect } from 'react';
import { Text as RNText } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import "../global.css";

export default function RootLayout() {
  // Bump global base text size for better readability across the app
  useEffect(() => {
    // Ensure we only set this once
    if ((RNText as any).__gesportTextPatched) return;
    (RNText as any).__gesportTextPatched = true;
    (RNText as any).defaultProps = (RNText as any).defaultProps || {};
    const baseStyle = Array.isArray((RNText as any).defaultProps.style)
      ? (RNText as any).defaultProps.style
      : (RNText as any).defaultProps.style
  ? [(RNText as any).defaultProps.style]
      : [];
    (RNText as any).defaultProps.style = [
      { fontSize: 16, lineHeight: 22 }, // base readable size; specific tailwind sizes will still override
      ...baseStyle,
    ];
    // Keep font scaling enabled (users can enlarge via OS settings too)
    (RNText as any).defaultProps.allowFontScaling = true;
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
