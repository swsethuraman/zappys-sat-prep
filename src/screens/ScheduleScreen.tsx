import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Button, Card, Eyebrow } from '../components/ui';
import { useProgress } from '../context/ProgressContext';
import { ensureNotificationPermission, isNotificationGranted } from '../lib/notifications';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';

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

function toTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "HH:mm" → a Date today at that time (for the native time picker's value). */
function timeToDate(time: string | null): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

/** "16:30" → "4:30 PM" for display. */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ScheduleScreen(_props: Props) {
  const { progress, setScheduledSAT, setReminderTime } = useProgress();
  const [showPicker, setShowPicker] = useState(false);
  // Web: free-text date entry (YYYY-MM-DD)
  const [webDateText, setWebDateText] = useState(progress?.scheduledSAT ?? '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Web: free-text time entry (HH:mm)
  const [webTimeText, setWebTimeText] = useState(progress?.reminderTime ?? '');
  const [notifDenied, setNotifDenied] = useState(false);

  // Native: surface a gentle note if notification permission is off (FR3).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    isNotificationGranted()
      .then((granted) => {
        if (active) setNotifDenied(!granted);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!progress) {
    return (
      <Screen>
        <BrandHeader />
      </Screen>
    );
  }

  const { scheduledSAT, reminderTime } = progress;
  const days = scheduledSAT ? daysUntil(scheduledSAT) : null;

  // setScheduledSAT reschedules notifications (cancel-all-then-reschedule)
  // inside the context mutator; the screen no longer schedules directly.
  const saveDate = (dateStr: string) => {
    setScheduledSAT(dateStr);
  };

  const clearDate = () => {
    setScheduledSAT(null);
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

  // Reminder time: request permission on first set (native), then persist +
  // reschedule via the context mutator. Saved regardless of the grant (FR3).
  const saveReminderTime = async (time: string) => {
    if (Platform.OS !== 'web') {
      const granted = await ensureNotificationPermission();
      setNotifDenied(!granted);
    }
    setReminderTime(time);
    setWebTimeText(time);
  };

  const clearReminder = () => {
    setReminderTime(null);
    setWebTimeText('');
  };

  const onNativeTimeChange = (_event: unknown, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) saveReminderTime(toTimeString(selected)).catch(() => {});
  };

  const onWebTimeSave = () => {
    const [h, m] = webTimeText.trim().split(':').map(Number);
    if (Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      saveReminderTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`).catch(() => {});
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

      {/* Daily practice reminder */}
      <Card>
        <Eyebrow>Daily practice reminder</Eyebrow>
        <Text style={styles.body}>
          Pick a time you already have a rhythm around — right after school works great for most
          students.
        </Text>

        {reminderTime && (
          <Text style={styles.reminderTimeLabel}>Reminder set for {formatTime(reminderTime)}</Text>
        )}

        {Platform.OS === 'web' ? (
          <>
            <Text style={styles.label}>Enter time (HH:mm, 24-hour)</Text>
            <TextInput
              value={webTimeText}
              onChangeText={setWebTimeText}
              placeholder="16:00"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            <Button title="Save reminder time" onPress={onWebTimeSave} />
            <Text style={styles.note}>⚡ Reminders fire on the Zappy mobile app.</Text>
          </>
        ) : (
          <>
            <Button
              title={reminderTime ? `Change: ${formatTime(reminderTime)}` : 'Pick a time'}
              variant="ghost"
              onPress={() => setShowTimePicker(true)}
            />
            {showTimePicker && DateTimePicker && (
              <DateTimePicker
                value={timeToDate(reminderTime)}
                mode="time"
                display="default"
                onChange={onNativeTimeChange}
              />
            )}
            {notifDenied && reminderTime && (
              <Text style={styles.note}>
                Notifications are off — enable them for Zappy in your phone&apos;s settings to get
                reminders.
              </Text>
            )}
          </>
        )}

        {reminderTime && <Button title="Clear reminder" variant="ghost" onPress={clearReminder} />}
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
  reminderTimeLabel: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: colors.zap,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
