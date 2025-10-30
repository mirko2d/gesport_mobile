import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'chip';

type Props = TouchableOpacityProps & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export default function Button({ title, variant = 'primary', loading, className, ...rest }: Props) {
  const base = 'rounded-full py-3 px-5 items-center justify-center';
  const stylesByVariant: Record<ButtonVariant, string> = {
    primary: 'bg-primary',
    secondary: 'border-2 border-white',
    outline: 'border border-coffee bg-white',
    ghost: 'bg-transparent',
    chip: 'px-4 py-2 rounded-full',
  } as const;

  const textByVariant: Record<ButtonVariant, string> = {
    primary: 'text-white font-bold',
    secondary: 'text-white font-bold',
    outline: 'text-coffee font-semibold',
    ghost: 'text-primary font-semibold',
    chip: 'text-white',
  } as const;

  // Compose classes; allow external className to override
  const containerClass = [base, stylesByVariant[variant], className].filter(Boolean).join(' ');
  const textClass = textByVariant[variant];

  return (
    <TouchableOpacity className={containerClass} disabled={loading || rest.disabled} {...rest}>
      <Text className={textClass}>{loading ? '...' : title}</Text>
    </TouchableOpacity>
  );
}
