import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button } from '../components/ui';
import MasteryBar from '../components/MasteryBar';
import { CONCEPTS, MATH_CONCEPTS, RW_CONCEPTS } from '../data/concepts';
import { sectionScore, sortByMastery } from '../lib/scoring';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes } from '../theme/colors';

type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, 'DiagResults'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function DiagResultsScreen({ navigation }: Props) {
  const { progress } = useProgress();

  if (!progress || progress.baselineScore === null) {
    // Shouldn't happen in normal flow, but guards against a direct nav.
    return (
      <Screen>
        <BrandHeader />
        <Card>
          <Text style={styles.body}>Complete the diagnostic to see your starting score.</Text>
          <Button title="Back to start" onPress={() => navigation.replace('Welcome')} />
        </Card>
      </Screen>
    );
  }

  const mathScore = sectionScore(progress.mastery, MATH_CONCEPTS);
  const rwScore = sectionScore(progress.mastery, RW_CONCEPTS);
  const gap = Math.max(0, progress.targetScore - progress.baselineScore);
  const sorted = sortByMastery(progress.mastery);

  const goToDashboard = () => {
    navigation.getParent()?.navigate('Main', { screen: 'Dashboard' });
  };

  return (
    <Screen>
      <BrandHeader />
      <Card style={styles.center}>
        <Eyebrow>Your starting score</Eyebrow>
        <Text style={styles.score}>{progress.baselineScore}</Text>
        <Text style={styles.sub}>
          Math {mathScore} · Reading &amp; Writing {rwScore}
        </Text>
        <Text style={styles.sub}>
          Target: {progress.targetScore} · Gap: {gap} pts
        </Text>
      </Card>
      <Card>
        <Eyebrow>Strengths &amp; weaknesses</Eyebrow>
        {sorted.map((concept) => {
          const m = progress.mastery[concept];
          const prereq = CONCEPTS[concept].prereq;
          const note =
            m < 0.4 && prereq && progress.mastery[prereq] < 0.6
              ? `Often linked to ${CONCEPTS[prereq].short} — Zappy will check that first.`
              : undefined;
          return <MasteryBar key={concept} concept={concept} mastery={m} showLabel note={note} />;
        })}
      </Card>
      <Card>
        <Text style={styles.body}>
          Zappy will open every session with a quick warm-up, then drill your weakest topic —
          checking prerequisite concepts first if that&apos;s where the real gap is.
        </Text>
        <Button title="Go to dashboard ⚡" onPress={goToDashboard} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.display,
    color: colors.zap,
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: 4,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    lineHeight: 22,
  },
});
