export interface ReminderConfig {
  date: Date;
  title: string;
  body: string;
}

/**
 * Returns the three reminder fire-times for a scheduled SAT date:
 * T-14 days, T-3 days, and the morning of the test (09:00 local time).
 * Dates in the past are included — callers should filter them out before
 * scheduling (no-ops on a device are harmless, but skipping is cleaner).
 */
export function computeReminderDates(scheduledSAT: string): ReminderConfig[] {
  // Parse as local midnight to avoid timezone shifts moving the date.
  const [year, month, day] = scheduledSAT.split('-').map(Number);
  const satMorning = new Date(year, month - 1, day, 9, 0, 0, 0);

  const at = (offsetDays: number): Date => {
    const d = new Date(satMorning);
    d.setDate(d.getDate() + offsetDays);
    return d;
  };

  return [
    {
      date: at(-14),
      title: '2 weeks until your SAT ⚡',
      body: "Keep the sessions going — Zappy's got you on track.",
    },
    {
      date: at(-3),
      title: '3 days until your SAT ⚡',
      body: "Almost there. One more session before test day?",
    },
    {
      date: at(0),
      title: "Today's the day! ⚡",
      body: "Zappy believes in you. Go crush it.",
    },
  ];
}
