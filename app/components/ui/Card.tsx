import React from 'react';
import { View, ViewProps } from 'react-native';

export default function Card({ className, children, ...rest }: ViewProps & { children?: React.ReactNode }) {
  const base = 'bg-white rounded-xl p-4 shadow-sm';
  const cls = [base, className].filter(Boolean).join(' ');
  return (
    <View className={cls} {...rest}>
      {children}
    </View>
  );
}
