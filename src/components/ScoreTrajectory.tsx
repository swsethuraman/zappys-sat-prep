import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SessionHistoryEntry } from '../lib/types';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

interface Props {
  history: SessionHistoryEntry[];
  targetScore: number;
}

const MAX_BAR_HEIGHT = 70;

/** Horizontal bar chart of score-over-time, ported from the prototype's .history strip. */
export default function ScoreTrajectory({ history, targetScore }: Props) {
  if (history.length === 0) return null;

  const scores = history.map((h) => h.score);
  const max = Math.max(...scores, targetScore);
  const min = Math.min(...scores, 400);
  const range = Math.max(40, max - min);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {history.map((h) => {
          const heightPct = (h.score - min) / range;
          const height = Math.max(6, heightPct * MAX_BAR_HEIGHT);
          return (
            <View key={h.n} style={styles.col}>
              <View style={[styles.stick, { height }]} />
              <Text style={styles.scoreLabel}>{h.score}</Text>
              <Text style={styles.nLabel}>{h.label === 'Diagnostic' ? 'Start' : `S${h.n}`}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT + 36,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  col: {
    alignItems: 'center',
    minWidth: 34,
  },
  stick: {
    width: 10,
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    backgroundColor: colors.zap,
  },
  scoreLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.muted,
    marginTop: 4,
  },
  nLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.muted,
  },
});
