// Zappy's SAT Prep — reminder scheduling logic (pure + testable).
//
// Reminders v2 replaces the Phase 5 T-14 / T-3 / day-of countdown
// notifications with (1) a user-chosen daily practice-time reminder and
// (2) a single day-before "taper" message. All time math here is pure with an
// injectable `now` (ms epoch); the actual OS scheduling lives in
// notifications.ts.

/** Parsed local hour/minute for a daily repeating reminder. */
export interface DailyTrigger {
  hour: number;
  minute: number;
}

/**
 * Parses a "HH:mm" (24-hour, local) reminder time into `{ hour, minute }`, or
 * returns null when unset or malformed. The OS owns the actual daily repeat
 * and any DST shifts (see notifications.ts) — we only supply hour/minute.
 */
export function dailyTrigger(reminderTime: string | null): DailyTrigger | null {
  if (!reminderTime) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(reminderTime);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Local hour at which the day-before taper notification fires (7pm). */
export const TAPER_HOUR = 19;

/**
 * The taper fire-time: TAPER_HOUR local on the evening BEFORE the SAT. Returns
 * null when there's no date or when that evening is already in the past —
 * including the "SAT is tomorrow but it's already past 7pm tonight" case
 * (FR6). `now` (ms epoch) is injectable for testing.
 */
export function taperTrigger(scheduledSAT: string | null, now: number): Date | null {
  if (!scheduledSAT) return null;
  const [year, month, day] = scheduledSAT.split('-').map(Number);
  if (!year || !month || !day) return null;
  const taper = new Date(year, month - 1, day, TAPER_HOUR, 0, 0, 0);
  taper.setDate(taper.getDate() - 1); // the evening before the test
  return taper.getTime() > now ? taper : null;
}

/**
 * Short daily reminder messages in Zappy's voice — warm, anchor-flavored,
 * never guilt-tripping. A repeating notification shows one of these; the
 * choice is deterministic (see dailyMessage).
 */
export const REMINDER_MESSAGES: string[] = [
  '⚡ Practice time! 15 minutes keeps the charge building.',
  'Your future self says thanks — quick session?',
  '⚡ A few questions now beats a big cram later. Ready?',
  'Small reps, real score gains. Let’s go ⚡',
  '⚡ Zappy’s warmed up and waiting — quick practice?',
  'Right on schedule ⚡ time to sharpen up.',
  '⚡ One short session keeps the momentum going.',
];

/** The single day-before taper message: rest and confidence, not cramming. */
export const TAPER_MESSAGE =
  'Tomorrow’s the day. You’ve done the work — tonight is for sleep, not cramming. ⚡ You’re ready.';

/**
 * Deterministic daily-message pick, keyed off the day-of-month so the message
 * varies over time but stays stable/testable. (A repeating OS notification
 * keeps whatever message it was scheduled with until the next reschedule.)
 */
export function dailyMessage(now: number): string {
  const dayOfMonth = new Date(now).getDate(); // 1..31
  return REMINDER_MESSAGES[dayOfMonth % REMINDER_MESSAGES.length];
}
