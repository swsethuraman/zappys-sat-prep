import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Button, Card, Eyebrow } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts — please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      // Navigation is driven by AuthContext.user changing — no explicit navigate call.
    } catch (e: unknown) {
      setError(friendlyError((e as { code?: string }).code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BrandHeader />
      <Card>
        <Eyebrow>Create account</Eyebrow>
        <Text style={styles.heading}>{"Let's get started."}</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={busy ? 'Creating account…' : 'Create account ⚡'}
          onPress={handleSignUp}
          disabled={busy}
        />
      </Card>
      <Button
        title="Already have an account? Sign in"
        variant="ghost"
        onPress={() => navigation.navigate('SignIn')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.sm,
  },
  label: {
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
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.coral,
    marginBottom: spacing.sm,
  },
});
