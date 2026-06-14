import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Button, Card, Eyebrow } from '../components/ui';
import { useProgress } from '../context/ProgressContext';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';
import { scheduleReminderNotifications, cancelReminderNotifications } from '../lib/notifications';

// DateTimePicker is native only — import at module level but only render
// when Platform.OS !== 'web' so the web bundle never instantiates it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DateTimePicker = Platform.OS !== 'web' ? require('@react-native-community/datetimepicker').default : null;

type Props = BottomTabScreenProps<MainTabParamList, 'Schedule'>;

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ScheduleScreen(_props: Props) {
  const { progress, setScheduledSAT } = useProgress();
  const [showPicker, setShowPicker] = useState(false);
  // Web: free-text date entry (YYYY-MM-DD)
  const [webDateText, setWebDateText] = useState(progress?.scheduledSAT ?? '');

  if (!progress) {
    return (
      <Screen>
        <BrandHeader />
      </Screen>
    );
  }

  const { scheduledSAT } = progress;
  const days = scheduledSAT ? daysUntil(scheduledSAT) : null;

  const saveDate = (dateStr: string) => {
    setScheduledSAT(dateStr);
    scheduleReminderNotifications(dateStr).catch(() => {});
  };

  const clearDate = () => {
    setScheduledSAT(null);
    cancelReminderNotifications().catch(() => {});
    setWebDateText('');
  };

  // Native date picker change handler
  const onNativeChange = (_event: unknown, selected?: Date) => {
    setShowPicker(false);
    if (selected) saveDate(toDateString(selected));
  };

  // Web date text submit handler
  const onWebSave = () => {
    const trimmed = webDateText.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      saveDate(trimmed);
    }
  };

  return (
    <Screen>
      <BrandHeader />

      {/* Countdown card */}
      {scheduledSAT ? (
        <Card>
          <Eyebrow>Your SAT</Eyebrow>
          <Text style={styles.dateLabel}>{formatDate(scheduledSAT)}</Text>
          {days !== null && days > 0 ? (
            <View style={styles.countdownRow}>
              <Text style={styles.countdownNumber}>{days}</Text>
              <Text style={styles.countdownUnit}>days to go</Text>
            </View>
          ) : days !== null && days === 0 ? (
            <Text style={styles.todayText}>Today&apos;s the day! ⚡</Text>
          ) : (
            <Text style={styles.pastText}>Test date has passed.</Text>
          )}
          {progress.sessionCount > 0 && days !== null && days > 0 && (
            <Text style={styles.hint}>
              {progress.sessionCount} session{progress.sessionCount !== 1 ? 's' : ''} completed
              {progress.currentScore !== null && progress.baselineScore !== null
                ? ` · +${progress.currentScore - progress.baselineScore} pts gained`
                : ''}
            </Text>
          )}
        </Card>
      ) : (
        <Card>
          <Eyebrow>No date set</Eyebrow>
          <Text style={styles.body}>
            Set your SAT date to see your countdown and schedule reminders.
          </Text>
        </Card>
      )}

      {/* Date picker */}
      <Card>
        <Eyebrow>{scheduledSAT ? 'Change date' : 'Set SAT date'}</Eyebrow>

        {Platform.OS === 'web' ? (
          <>
            <Text style={styles.label}>Enter date (YYYY-MM-DD)</Text>
            <TextInput
              value={webDateText}
              onChangeText={setWebDateText}
              placeholder="2026-10-03"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            <Button title="Save date" onPress={onWebSave} />
          </>
        ) : (
          <>
            <Button
              title={scheduledSAT ? `Change: ${formatDate(scheduledSAT)}` : 'Pick a date'}
              variant="ghost"
              onPress={() => setShowPicker(true)}
            />
            {showPicker && DateTimePicker && (
              <DateTimePicker
                value={scheduledSAT ? new Date(scheduledSAT) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onNativeChange}
              />
            )}
          </>
        )}

        {scheduledSAT && (
          <Button title="Clear date" variant="ghost" onPress={clearDate} />
        )}
      </Card>

      {/* Reminders */}
      <Card>
        <Eyebrow>Reminders</Eyebrow>
        {Platform.OS === 'web' ? (
          <Text style={styles.body}>
            Reminders are available in the mobile app. Download Zappy on your phone to get
            notifications at 14 days, 3 days, and the morning of your SAT.
          </Text>
        ) : scheduledSAT ? (
          <Text style={styles.body}>
            Reminders scheduled for 14 days before, 3 days before, and the morning of your SAT.
          </Text>
        ) : (
          <Text style={styles.body}>
            Set your SAT date above to enable reminders.
          </Text>
        )}
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
  dateLabel: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  countdownNumber: {
    fontFamily: fonts.mono,
    fontSize: 56,
    color: colors.zap,
    lineHeight: 64,
  },
  countdownUnit: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.muted,
  },
  todayText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.zap,
  },
  pastText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.panel2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontFamily: fonts.mono,
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
