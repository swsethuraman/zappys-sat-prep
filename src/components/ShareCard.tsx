import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

export interface ShareCardProps {
  baselineScore: number;
  targetScore: number;
  currentScore: number | null;
  actualScore: number;
  actualDate: string | null;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <View style={[styles.badge, isPositive ? styles.badgeGreen : styles.badgeRed]}>
      <Text style={[styles.badgeText, isPositive ? styles.badgeTextGreen : styles.badgeTextRed]}>
        {isPositive ? '+' : ''}
        {value}
      </Text>
    </View>
  );
}

function ScoreRow({
  label,
  score,
  delta,
  highlight,
}: {
  label: string;
  score: number;
  delta?: number | null;
  highlight?: boolean;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={[styles.scoreLabel, highlight && styles.scoreLabelHighlight]}>{label}</Text>
      <View style={styles.scoreRight}>
        {delta != null && <DeltaBadge value={delta} />}
        <Text style={[styles.scoreValue, highlight && styles.scoreValueHighlight]}>{score}</Text>
      </View>
    </View>
  );
}

/**
 * A self-contained, brand-styled card showing the user's SAT score journey.
 * Wrap this in a ref and pass to captureRef() to produce a shareable image.
 */
const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ baselineScore, targetScore, currentScore, actualScore, actualDate }, ref) => {
    const projDelta = currentScore != null ? currentScore - baselineScore : null;
    const actualDelta = actualScore - baselineScore;
    const projAccuracy = currentScore != null ? actualScore - currentScore : null;

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Brand header */}
        <Text style={styles.brand}>
          <Text style={{ color: colors.zap }}>⚡</Text> Zappy&apos;s SAT Prep
        </Text>
        <View style={styles.divider} />

        <Text style={styles.eyebrow}>MY SAT RESULTS</Text>

        {/* Score table */}
        <View style={styles.table}>
          <ScoreRow label="Baseline" score={baselineScore} />
          <ScoreRow label="Target" score={targetScore} />
          {currentScore != null && (
            <ScoreRow label="Projection" score={currentScore} delta={projDelta} />
          )}
          <ScoreRow label="Actual ⚡" score={actualScore} delta={actualDelta} highlight />
        </View>

        {/* Projection accuracy note */}
        {projAccuracy != null && (
          <Text style={styles.accuracyNote}>
            Projection was {Math.abs(projAccuracy)} pt{Math.abs(projAccuracy) !== 1 ? 's' : ''}{' '}
            {projAccuracy === 0
              ? 'exactly right'
              : projAccuracy > 0
                ? 'under actual'
                : 'over actual'}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {actualDate && <Text style={styles.footerText}>{formatDate(actualDate)}</Text>}
          <Text style={styles.footerText}>zappysat.app</Text>
        </View>
      </View>
    );
  },
);

ShareCard.displayName = 'ShareCard';

export default ShareCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.xl,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    letterSpacing: 1.5,
    color: colors.mint,
    marginBottom: spacing.lg,
  },
  table: {
    gap: 4,
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  scoreLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    flex: 1,
  },
  scoreLabelHighlight: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
  },
  scoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
    color: colors.text,
    minWidth: 44,
    textAlign: 'right',
  },
  scoreValueHighlight: {
    fontSize: fontSizes.lg,
    color: colors.zap,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(94,230,200,0.12)',
  },
  badgeRed: {
    backgroundColor: 'rgba(255,107,129,0.12)',
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
  },
  badgeTextGreen: {
    color: colors.mint,
  },
  badgeTextRed: {
    color: colors.coral,
  },
  accuracyNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
});
