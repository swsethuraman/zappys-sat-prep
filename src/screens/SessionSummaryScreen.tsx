import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button } from '../components/ui';
import MasteryBar from '../components/MasteryBar';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

export default function SessionSummaryScreen({ navigation, route }: Props) {
  const { progress } = useProgress();
  const { delta, newScore, correctCount, totalCount, touchedConcepts, justExceeded } = route.params;

  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta}`;
  const deltaColor = delta > 0 ? colors.mint : delta < 0 ? colors.coral : colors.muted;

  const goToDashboard = () => navigation.replace('Main', { screen: 'Dashboard' });

  return (
    <Screen>
      <BrandHeader />

      {justExceeded && (
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>⚡ Ready to exceed your target!</Text>
          <Text style={styles.bannerBody}>
            That session pushed your projected score past your target of{' '}
            {progress?.targetScore}. Head to Profile to raise your target or log a real SAT score.
          </Text>
        </Card>
      )}

      <Card style={styles.center}>
        <Eyebrow>Session complete</Eyebrow>
        <Text style={[styles.delta, { color: deltaColor }]}>{deltaLabel} pts</Text>
        <Text style={styles.sub}>New projected score: {newScore}</Text>
        <Text style={styles.sub}>
          {correctCount} / {totalCount} correct
        </Text>
      </Card>

      <Card>
        <Eyebrow>Updated mastery</Eyebrow>
        {progress &&
          touchedConcepts.map((concept) => (
            <MasteryBar key={concept} concept={concept} mastery={progress.mastery[concept]} showLabel />
          ))}
      </Card>

      <View style={{ height: spacing.sm }} />
      <Button title="Back to dashboard ⚡" onPress={goToDashboard} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  delta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.display,
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: 4,
  },
  banner: {
    backgroundColor: 'rgba(255,210,63,0.10)',
    borderColor: colors.zap,
  },
  bannerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md + 1,
    color: colors.text,
    marginBottom: 4,
  },
  bannerBody: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm + 0.5,
    color: colors.muted,
    lineHeight: 20,
  },
});
