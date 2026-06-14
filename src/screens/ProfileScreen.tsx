import React, { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow, Button, NumberField } from '../components/ui';
import ShareCard from '../components/ShareCard';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme/colors';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

const MIN_SCORE = 400;
const MAX_SCORE = 1600;
const STEP = 10;

function clampToStep(raw: number): number {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, raw));
  return Math.round(clamped / STEP) * STEP;
}

export default function ProfileScreen(_props: Props) {
  const { progress, setTargetScore, setActualScore, reset } = useProgress();
  const { signOut } = useAuth();

  const [targetText, setTargetText] = useState(String(progress?.targetScore ?? 1200));
  const [actualText, setActualText] = useState(progress?.actualScore ? String(progress.actualScore) : '');
  const shareCardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share my SAT results' });
      } else {
        Alert.alert('Sharing', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not capture or share your results.');
    }
  };

  if (!progress) {
    return (
      <Screen>
        <BrandHeader />
      </Screen>
    );
  }

  const handleSaveTarget = () => {
    const parsed = parseInt(targetText, 10);
    if (Number.isNaN(parsed)) return;
    setTargetScore(clampToStep(parsed));
  };

  const handleSaveActual = () => {
    const parsed = parseInt(actualText, 10);
    if (Number.isNaN(parsed) || parsed < MIN_SCORE || parsed > MAX_SCORE) return;
    const today = new Date().toISOString().slice(0, 10);
    setActualScore(clampToStep(parsed), today);
  };

  const handleReset = () => {
    Alert.alert('Reset all progress?', 'This clears your diagnostic, mastery, and session history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => reset() },
    ]);
  };

  const comparisonRows: { label: string; value: number | null }[] = [
    { label: 'Baseline (diagnostic)', value: progress.baselineScore },
    { label: 'Current projection', value: progress.currentScore },
    { label: 'Target', value: progress.targetScore },
    { label: 'Actual SAT result', value: progress.actualScore },
  ];

  return (
    <Screen>
      <BrandHeader />

      <Card>
        <Eyebrow>Your target</Eyebrow>
        <NumberField label="Target SAT score" value={targetText} onChangeText={setTargetText} placeholder="1200" />
        <Button title="Save target" variant="ghost" onPress={handleSaveTarget} />
      </Card>

      <Card>
        <Eyebrow>Baseline → projection → target</Eyebrow>
        {comparisonRows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value ?? '—'}</Text>
          </View>
        ))}
        {progress.actualScore !== null && progress.currentScore !== null && (
          <Text style={styles.note}>
            Projection vs. actual: {progress.currentScore - progress.actualScore >= 0 ? '+' : ''}
            {progress.currentScore - progress.actualScore} pts
          </Text>
        )}
      </Card>

      <Card>
        <Eyebrow>Real SAT result</Eyebrow>
        <Text style={styles.body}>
          Once you&apos;ve taken the real SAT, log your score here to see how Zappy&apos;s
          projection compared.
        </Text>
        <NumberField label="Actual SAT score" value={actualText} onChangeText={setActualText} placeholder="1200" />
        <Button title="Save actual score" variant="mint" onPress={handleSaveActual} />
        {progress.actualDate && <Text style={styles.note}>Logged on {progress.actualDate}.</Text>}
      </Card>

      {progress.actualScore !== null && progress.baselineScore !== null && (
        <Card>
          <Eyebrow>Share your results</Eyebrow>
          <ShareCard
            ref={shareCardRef}
            baselineScore={progress.baselineScore}
            targetScore={progress.targetScore}
            currentScore={progress.currentScore}
            actualScore={progress.actualScore}
            actualDate={progress.actualDate}
          />
          {Platform.OS === 'web' ? (
            <Text style={styles.shareWebNote}>
              ⚡ Sharing is available on the Zappy mobile app.
            </Text>
          ) : (
            <Button title="Share my results ⚡" variant="mint" onPress={handleShare} />
          )}
        </Card>
      )}

      <Card>
        <Eyebrow>Reset</Eyebrow>
        <Text style={styles.body}>Start over from scratch — clears mastery, history, and scores.</Text>
        <Button title="Reset all progress" variant="ghost" onPress={handleReset} />
      </Card>

      <Card>
        <Eyebrow>Account</Eyebrow>
        <Button title="Sign out" variant="ghost" onPress={() => signOut().catch(() => {})} />
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
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  shareWebNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mint,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
