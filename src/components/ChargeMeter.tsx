import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

// Same bolt outline as the HTML prototype's meter SVG (viewBox 0 0 60 100).
const BOLT_PATH = 'M38 0 L12 52 L27 52 L18 100 L48 45 L31 45 Z';

interface Props {
  currentScore: number;
  targetScore: number;
}

/**
 * A lightning-bolt "charge meter": fills bottom-to-top as currentScore
 * approaches/exceeds targetScore. Mirrors the prototype's clip-path
 * animation using an SVG clipPath + rect.
 */
export default function ChargeMeter({ currentScore, targetScore }: Props) {
  const ratio = targetScore > 0 ? currentScore / targetScore : 0;
  const fillPct = Math.min(100, Math.max(0, ratio * 100));
  const exceeded = currentScore >= targetScore;
  const fillColor = exceeded ? colors.mint : colors.zap;

  // Fill rect grows from the bottom: top = (100 - fillPct)% of the 100-unit viewBox height.
  const fillTop = 100 - fillPct;

  return (
    <View style={styles.wrap}>
      <View style={styles.meterBox}>
        <Svg width={60} height={100} viewBox="0 0 60 100">
          <Path d={BOLT_PATH} fill={colors.panel2} stroke={colors.line} strokeWidth={1} />
          <Defs>
            <ClipPath id="fillClip">
              <Rect x={0} y={fillTop} width={60} height={fillPct} />
            </ClipPath>
          </Defs>
          <Path d={BOLT_PATH} fill={fillColor} clipPath="url(#fillClip)" />
        </Svg>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>Projection vs. target</Text>
        <Text style={[styles.value, { color: fillColor }]}>
          {currentScore} / {targetScore}
        </Text>
        <Text style={styles.sub}>
          {exceeded
            ? `Above target by ${currentScore - targetScore} pts`
            : `${targetScore - currentScore} pts to go`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  meterBox: {
    width: 60,
    height: 100,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: 4,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: 4,
  },
});
