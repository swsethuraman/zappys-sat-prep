import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CONCEPTS, type ConceptId } from '../data/concepts';
import { masteryColor, masteryLabel } from '../lib/scoring';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

interface Props {
  concept: ConceptId;
  mastery: number;
  /** Show "Needs work / Developing / Strong" next to the concept name. */
  showLabel?: boolean;
  /** Optional note rendered below the bar (e.g. prerequisite callout). */
  note?: string;
}

/** A single concept's mastery as a labeled, colored progress bar. */
export default function MasteryBar({ concept, mastery, showLabel, note }: Props) {
  const pct = Math.round(mastery * 100);
  const color = masteryColor(mastery);

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.name}>
          {CONCEPTS[concept].short}
          {showLabel && <Text style={[styles.statusLabel, { color }]}> · {masteryLabel(mastery)}</Text>}
        </Text>
        <Text style={[styles.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {note && <Text style={styles.note}>⚡ {note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  pct: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
  },
  track: {
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.panel2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 16,
  },
});
