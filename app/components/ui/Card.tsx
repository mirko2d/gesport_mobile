import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children?: React.ReactNode;
  variant?: 'solid' | 'gradient';
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
};

export default function Card({ className, children, variant = 'solid', gradientColors, gradientStart, gradientEnd, ...rest }: CardProps) {
  const base = 'rounded-xl p-4 shadow-sm';
  const solidBase = 'bg-white';
  const cls = [variant === 'solid' ? solidBase : '', base, className].filter(Boolean).join(' ');

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={(gradientColors || ['#ffffff', '#f1f5f9']) as any}
        start={gradientStart || { x: 0, y: 0 }}
        end={gradientEnd || { x: 1, y: 1 }}
        className={cls}
        {...rest}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View className={cls} {...rest}>
      {children}
    </View>
  );
}
