import { Platform } from 'react-native';
import { computeReminderDates } from './reminders';

/**
 * Schedule (or reschedule) the three SAT reminder notifications for a given
 * date. Silently no-ops on web — expo-notifications is native only.
 */
export async function scheduleReminderNotifications(scheduledSAT: string): Promise<void> {
  if (Platform.OS === 'web') return;

  // Dynamic import keeps the web bundle clean; this branch is never reached
  // on web so Metro's tree-shaking removes it there.
  const Notifications = await import('expo-notifications');

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel any previously scheduled reminders before scheduling new ones.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const reminders = computeReminderDates(scheduledSAT);

  for (const reminder of reminders) {
    if (reminder.date.getTime() <= now) continue; // skip dates already past
    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
      },
    });
  }
}

/** Cancel all pending SAT reminder notifications. */
export async function cancelReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
