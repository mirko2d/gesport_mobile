import React from 'react';
import { Platform, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'chip';

type Props = TouchableOpacityProps & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export default function Button({ title, variant = 'primary', loading, className, ...rest }: Props) {
  const isWeb = Platform.OS === 'web';
  const base = `rounded-full py-3 px-5 items-center justify-center ${isWeb ? 'transition-all' : ''} active:opacity-80`;

  const stylesByVariant: Record<ButtonVariant, string> = {
    primary: `bg-primary ${isWeb ? 'hover:opacity-90' : ''}`,
    secondary: `border-2 border-white ${isWeb ? 'hover:bg-white/10' : ''}`,
    outline: `border border-coffee bg-white ${isWeb ? 'hover:bg-coffee/5' : ''}`,
    ghost: `bg-transparent ${isWeb ? 'hover:bg-black/5' : ''}`,
    chip: `px-4 py-2 rounded-full ${isWeb ? 'hover:opacity-90' : ''}`,
  } as const;

  const textByVariant: Record<ButtonVariant, string> = {
    primary: 'text-white font-bold',
    secondary: 'text-white font-bold',
    outline: 'text-coffee font-semibold',
    ghost: 'text-primary font-semibold',
    chip: 'text-white',
  } as const;

  const disabled = loading || rest.disabled;
  const disabledClasses = disabled ? `opacity-60 ${isWeb ? 'cursor-not-allowed' : ''}` : `${isWeb ? 'cursor-pointer' : ''}`;

  // Compose classes; allow external className to override
  const containerClass = [base, stylesByVariant[variant], disabledClasses, className]
    .filter(Boolean)
    .join(' ');
  const textClass = textByVariant[variant];

  return (
    <TouchableOpacity className={containerClass} disabled={disabled} {...rest}>
      <Text className={textClass}>{loading ? '...' : title}</Text>
    </TouchableOpacity>
  );
}
