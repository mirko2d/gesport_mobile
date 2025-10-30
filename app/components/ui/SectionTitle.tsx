import React from 'react';
import { Text, TextProps } from 'react-native';

// Título de sección más grande y con color de acento
export default function SectionTitle({ children, className, ...rest }: TextProps & { children?: React.ReactNode }) {
  const base = 'text-black text-3xl font-extrabold mb-5 text-center';
  const cls = [base, className].filter(Boolean).join(' ');
  return (
    <Text className={cls} {...rest}>{children}</Text>
  );
}
