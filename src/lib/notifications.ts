import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { dailyTrigger, taperTrigger, dailyMessage, TAPER_MESSAGE } from './reminders';
import type { UserProgress } from './types';

// Static top-level import (HN-02 pattern): importing the expo-notifications
// module is web-safe; only its APIs are native-only, so every call below is
// gated behind a `Platform.OS === 'web'` early return. A dynamic
// `await import()` here breaks the dev client at runtime ("Requiring unknown
// module") — the module-import shape Phase 5 used is the device-verified one.

/** The subset of progress the scheduler reads. */
type ReminderState = Pick<UserProgress, 'reminderTime' | 'scheduledSAT'>;

/**
 * Whether notifications are currently granted (native). Web → false. Does not
 * prompt — used to decide whether to show the "notifications are off" note.
 */
export async function isNotificationGranted(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/**
 * Ensures notification permission on native; returns whether it's granted.
 * Requests it (once) only when not already decided — call this when the user
 * first SETS a reminder time (FR3), never on app launch. Web returns false.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * The scheduling invariant (FR1): cancel ALL scheduled notifications, then
 * schedule the current set fresh — a daily repeater (if a reminderTime is
 * set) and a single day-before taper (if that evening is still ahead). These
 * are the only notifications the app schedules, so cancel-all also clears any
 * legacy Phase 5 countdown notifications (FR2). No-op on web (FR4).
 *
 * Does not request permission: scheduling without it is a harmless OS no-op,
 * and permission is requested separately when the user sets a time (FR3).
 */
export async function rescheduleAllReminders(
  progress: ReminderState,
  now: number = Date.now(),
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const daily = dailyTrigger(progress.reminderTime);
  if (daily) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Zappy', body: dailyMessage(now), sound: true },
      // Repeating local daily trigger — the OS re-fires at this hour/minute
      // each day and handles DST; we don't hand-roll timezone math (FR7).
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: daily.hour,
        minute: daily.minute,
      },
    });
  }

  const taper = taperTrigger(progress.scheduledSAT, now);
  if (taper) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Zappy', body: TAPER_MESSAGE, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: taper },
    });
  }
}
