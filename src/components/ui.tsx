import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

/** Card: the standard rounded container used throughout the app. */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Eyebrow label — small mint caption above a card's main content. */
export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

/** BrandHeader — "⚡ Zappy&apos;s SAT Prep" wordmark used at the top of screens. */
export function BrandHeader({ right }: { right?: React.ReactNode }) {
  return (
    <View style={styles.topbar}>
      <Text style={styles.brand}>
        <Text style={{ color: colors.zap }}>⚡</Text> Zappy&apos;s SAT Prep
      </Text>
      {right}
    </View>
  );
}

type ButtonVariant = 'primary' | 'mint' | 'ghost';

/** Button — primary (zap yellow), mint, or ghost outline. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'mint' && styles.buttonMint,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'ghost' && { color: colors.text },
          (variant === 'primary' || variant === 'mint') && {
            color: '#1A1830',
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * NumberField — a labeled numeric input styled for score entry (400-1600,
 * step 10). Keeps the raw string value so users can clear/retype freely;
 * validation/clamping happens on save in the calling screen.
 */
export function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.mint,
    marginBottom: spacing.sm,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.zap,
  },
  buttonMint: {
    backgroundColor: colors.mint,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
  },
  fieldWrap: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.panel2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
