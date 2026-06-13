import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button, NumberField } from '../components/ui';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes } from '../theme/colors';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const MIN_SCORE = 400;
const MAX_SCORE = 1600;
const STEP = 10;

function clampToStep(raw: number): number {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, raw));
  return Math.round(clamped / STEP) * STEP;
}

export default function WelcomeScreen({ navigation }: Props) {
  const { progress, setTargetScore } = useProgress();
  const [targetText, setTargetText] = useState(String(progress?.targetScore ?? 1200));

  const handleStart = () => {
    const parsed = parseInt(targetText, 10);
    const target = clampToStep(Number.isNaN(parsed) ? 1200 : parsed);
    setTargetScore(target);
    navigation.navigate('Diagnostic');
  };

  return (
    <Screen>
      <BrandHeader />
      <Card>
        <Eyebrow>Welcome</Eyebrow>
        <Text style={styles.heading}>Meet Zappy.</Text>
        <Text style={styles.body}>
          A quick diagnostic finds your starting score and your strongest / weakest topics. Every
          session after that targets your biggest gaps — and shows how many points it&apos;s
          projected to add.
        </Text>
      </Card>
      <Card>
        <NumberField
          label="Your target SAT score"
          value={targetText}
          onChangeText={setTargetText}
          placeholder="1200"
        />
        <Text style={styles.hint}>
          Zappy will tell you when you&apos;re projected to hit — and exceed — this number.
        </Text>
        <Button title="Start diagnostic ⚡" onPress={handleStart} />
      </Card>
      <Text style={styles.footnote}>
        16 quick questions across Math and Reading &amp; Writing — about 10 minutes.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    lineHeight: 22,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 18,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});
