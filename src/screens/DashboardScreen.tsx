import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button } from '../components/ui';
import ChargeMeter from '../components/ChargeMeter';
import ScoreTrajectory from '../components/ScoreTrajectory';
import MasteryBar from '../components/MasteryBar';
import { CONCEPTS, MATH_CONCEPTS, RW_CONCEPTS } from '../data/concepts';
import { sectionScore, sortByMastery } from '../lib/scoring';
import { projectSessionGain } from '../lib/sessionBuilder';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STEP = 10;
const MAX_SCORE = 1600;

export default function DashboardScreen({ navigation }: Props) {
  const { progress, raiseTarget } = useProgress();

  if (!progress || progress.currentScore === null) {
    return (
      <Screen>
        <BrandHeader />
        <Card>
          <Text style={styles.body}>Complete the diagnostic to see your dashboard.</Text>
        </Card>
      </Screen>
    );
  }

  const mathScore = sectionScore(progress.mastery, MATH_CONCEPTS);
  const rwScore = sectionScore(progress.mastery, RW_CONCEPTS);
  const exceeded = progress.currentScore >= progress.targetScore;
  const proj = projectSessionGain(progress);
  const weakest = sortByMastery(progress.mastery);
  const target = weakest[0];
  const targetPrereq = CONCEPTS[target].prereq;
  const showsPrereq = targetPrereq && progress.mastery[targetPrereq] < 0.6;

  const projLabel =
    proj.lo === proj.hi
      ? `${proj.lo >= 0 ? '+' : ''}${proj.lo}`
      : `${proj.lo >= 0 ? '+' : ''}${proj.lo} to ${proj.hi >= 0 ? '+' : ''}${proj.hi}`;

  const suggestion = Math.min(MAX_SCORE, Math.round((progress.currentScore + 50) / STEP) * STEP);

  const handleRaiseTarget = () => {
    raiseTarget(suggestion);
  };

  return (
    <Screen>
      <BrandHeader />

      {exceeded && (
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>⚡ Ready to exceed your target!</Text>
          <Text style={styles.bannerBody}>
            Your projected score ({progress.currentScore}) is already at or above your goal of{' '}
            {progress.targetScore}. Consider raising your target to ~{suggestion}, or it&apos;s a
            good time to schedule the real SAT.
          </Text>
          <Button title={`Raise target to ${suggestion}`} variant="mint" onPress={handleRaiseTarget} />
        </Card>
      )}

      <Card>
        <Eyebrow>Projected score</Eyebrow>
        <Text style={styles.score}>{progress.currentScore}</Text>
        <Text style={styles.sub}>
          Math {mathScore} · Reading &amp; Writing {rwScore} · {progress.sessionCount} session
          {progress.sessionCount === 1 ? '' : 's'} completed
        </Text>
        <View style={styles.divider} />
        <ChargeMeter currentScore={progress.currentScore} targetScore={progress.targetScore} />
      </Card>

      <Card>
        <Eyebrow>Score trajectory</Eyebrow>
        <ScoreTrajectory history={progress.history} targetScore={progress.targetScore} />
      </Card>

      <Card>
        <Eyebrow>Current focus areas</Eyebrow>
        {weakest.slice(0, 3).map((c) => (
          <MasteryBar key={c} concept={c} mastery={progress.mastery[c]} />
        ))}
      </Card>

      <Card>
        <Eyebrow>Next session</Eyebrow>
        <Text style={styles.body}>
          Targets <Text style={styles.bold}>{CONCEPTS[target].short}</Text>
          {showsPrereq ? ` (with a quick ${CONCEPTS[targetPrereq!].short} refresher first)` : ''}.
        </Text>
        <Text style={styles.bodySmall}>
          Projected impact: <Text style={styles.projection}>{projLabel} pts</Text> depending on how
          you do.
        </Text>
        <Button title="Start session ⚡" onPress={() => navigation.navigate('Session')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  bold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  projection: {
    fontFamily: fonts.bodySemiBold,
    color: colors.zap,
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
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
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
    marginBottom: spacing.xs,
  },
});
