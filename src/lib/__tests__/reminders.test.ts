import { computeReminderDates } from '../reminders';

describe('computeReminderDates', () => {
  const SAT_DATE = '2026-10-03'; // A Saturday

  it('returns exactly three reminders', () => {
    expect(computeReminderDates(SAT_DATE)).toHaveLength(3);
  });

  it('first reminder fires 14 days before the SAT at 09:00', () => {
    const [r] = computeReminderDates(SAT_DATE);
    expect(r.date.getFullYear()).toBe(2026);
    expect(r.date.getMonth()).toBe(8); // September (0-indexed)
    expect(r.date.getDate()).toBe(19); // Oct 3 - 14 = Sep 19
    expect(r.date.getHours()).toBe(9);
    expect(r.date.getMinutes()).toBe(0);
  });

  it('second reminder fires 3 days before the SAT at 09:00', () => {
    const [, r] = computeReminderDates(SAT_DATE);
    expect(r.date.getMonth()).toBe(8); // September
    expect(r.date.getDate()).toBe(30); // Oct 3 - 3 = Sep 30
    expect(r.date.getHours()).toBe(9);
  });

  it('third reminder fires on the SAT morning at 09:00', () => {
    const [, , r] = computeReminderDates(SAT_DATE);
    expect(r.date.getFullYear()).toBe(2026);
    expect(r.date.getMonth()).toBe(9); // October (0-indexed)
    expect(r.date.getDate()).toBe(3);
    expect(r.date.getHours()).toBe(9);
  });

  it('all reminders have non-empty title and body', () => {
    computeReminderDates(SAT_DATE).forEach((r) => {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
    });
  });

  it('reminders are in ascending chronological order', () => {
    const dates = computeReminderDates(SAT_DATE).map((r) => r.date.getTime());
    expect(dates[0]).toBeLessThan(dates[1]);
    expect(dates[1]).toBeLessThan(dates[2]);
  });

  it('handles year boundary correctly (SAT on Jan 5)', () => {
    const reminders = computeReminderDates('2027-01-05');
    const [t14, t3, t0] = reminders;
    expect(t14.date.getFullYear()).toBe(2026);
    expect(t14.date.getMonth()).toBe(11); // December
    expect(t14.date.getDate()).toBe(22);
    expect(t3.date.getFullYear()).toBe(2027);
    expect(t3.date.getMonth()).toBe(0); // January
    expect(t3.date.getDate()).toBe(2);
    expect(t0.date.getDate()).toBe(5);
  });
});
