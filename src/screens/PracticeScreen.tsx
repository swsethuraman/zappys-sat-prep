import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button } from '../components/ui';
import { projectSessionGain } from '../lib/sessionBuilder';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Practice'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PracticeScreen({ navigation }: Props) {
  const { progress } = useProgress();

  if (!progress || progress.currentScore === null) {
    return (
      <Screen>
        <BrandHeader />
        <Card>
          <Text style={styles.body}>Complete the diagnostic to start practicing.</Text>
        </Card>
      </Screen>
    );
  }

  const proj = projectSessionGain(progress);
  const projLabel =
    proj.lo === proj.hi
      ? `${proj.lo >= 0 ? '+' : ''}${proj.lo}`
      : `${proj.lo >= 0 ? '+' : ''}${proj.lo} to ${proj.hi >= 0 ? '+' : ''}${proj.hi}`;

  // Most recent first; the diagnostic ("Start") stays at the end.
  const reversedHistory = [...progress.history].reverse();

  return (
    <Screen>
      <BrandHeader />
      <Card>
        <Eyebrow>Next session</Eyebrow>
        <Text style={styles.body}>
          A short, focused session — warm-up, then your weakest topic. Projected impact:{' '}
          <Text style={styles.projection}>{projLabel} pts</Text>.
        </Text>
        <Button title="Start session ⚡" onPress={() => navigation.navigate('Session')} />
      </Card>

      <Card>
        <Eyebrow>Session history</Eyebrow>
        {reversedHistory.map((entry) => {
          const deltaLabel = `${entry.delta >= 0 ? '+' : ''}${entry.delta}`;
          const deltaColor = entry.delta > 0 ? colors.mint : entry.delta < 0 ? colors.coral : colors.muted;
          return (
            <View key={entry.n} style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>
                  {entry.label === 'Diagnostic' ? 'Diagnostic (starting point)' : entry.label}
                </Text>
                <Text style={styles.rowScore}>{entry.score}</Text>
              </View>
              {entry.label !== 'Diagnostic' && (
                <Text style={[styles.rowDelta, { color: deltaColor }]}>{deltaLabel}</Text>
              )}
            </View>
          );
        })}
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
  projection: {
    fontFamily: fonts.bodySemiBold,
    color: colors.zap,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  rowScore: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginTop: 2,
  },
  rowDelta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
  },
});
