import {
  REMINDER_MESSAGES,
  TAPER_HOUR,
  TAPER_MESSAGE,
  dailyMessage,
  dailyTrigger,
  taperTrigger,
} from '../reminders';

// Local-time ms helper so taper tests are timezone-independent (both `now`
// and the taper Date are built in local time).
const localMs = (y: number, mo: number, d: number, h = 0, min = 0) =>
  new Date(y, mo - 1, d, h, min, 0, 0).getTime();

describe('dailyTrigger', () => {
  it('parses a valid HH:mm into hour/minute', () => {
    expect(dailyTrigger('16:30')).toEqual({ hour: 16, minute: 30 });
    expect(dailyTrigger('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(dailyTrigger('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(dailyTrigger('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  it('returns null for unset or malformed values', () => {
    expect(dailyTrigger(null)).toBeNull();
    expect(dailyTrigger('')).toBeNull();
    expect(dailyTrigger('25:00')).toBeNull();
    expect(dailyTrigger('16:60')).toBeNull();
    expect(dailyTrigger('abc')).toBeNull();
    expect(dailyTrigger('1630')).toBeNull();
  });
});

describe('taperTrigger', () => {
  it('returns null when no date is set', () => {
    expect(taperTrigger(null, localMs(2026, 6, 1))).toBeNull();
  });

  it('fires at TAPER_HOUR the evening before a future SAT', () => {
    const taper = taperTrigger('2026-10-03', localMs(2026, 1, 1));
    expect(taper).not.toBeNull();
    expect(taper!.getFullYear()).toBe(2026);
    expect(taper!.getMonth()).toBe(9); // October (0-indexed)
    expect(taper!.getDate()).toBe(2); // evening before Oct 3
    expect(taper!.getHours()).toBe(TAPER_HOUR);
    expect(taper!.getMinutes()).toBe(0);
  });

  it('returns null for a past SAT date', () => {
    expect(taperTrigger('2020-01-01', localMs(2026, 6, 1))).toBeNull();
  });

  it('returns null on the day of the SAT (taper evening already passed)', () => {
    expect(taperTrigger('2026-10-03', localMs(2026, 10, 3, 8))).toBeNull();
  });

  it('schedules tonight when the SAT is tomorrow and it is before 7pm', () => {
    const taper = taperTrigger('2026-10-02', localMs(2026, 10, 1, 12));
    expect(taper).not.toBeNull();
    expect(taper!.getDate()).toBe(1);
    expect(taper!.getHours()).toBe(TAPER_HOUR);
  });

  it('returns null when the SAT is tomorrow but 7pm tonight already passed', () => {
    expect(taperTrigger('2026-10-02', localMs(2026, 10, 1, 20))).toBeNull();
  });
});

describe('dailyMessage', () => {
  it('is deterministic for a given day and keys off day-of-month', () => {
    // day-of-month 7 -> index 7 % length
    const now = localMs(2026, 6, 7, 16);
    expect(dailyMessage(now)).toBe(REMINDER_MESSAGES[7 % REMINDER_MESSAGES.length]);
    // same day -> same message
    expect(dailyMessage(now)).toBe(dailyMessage(localMs(2026, 6, 7, 9)));
  });

  it('always returns a message from the list', () => {
    for (let d = 1; d <= 31; d++) {
      expect(REMINDER_MESSAGES).toContain(dailyMessage(localMs(2026, 5, d, 10)));
    }
  });
});

describe('message constants', () => {
  it('has 5-8 non-empty daily messages', () => {
    expect(REMINDER_MESSAGES.length).toBeGreaterThanOrEqual(5);
    expect(REMINDER_MESSAGES.length).toBeLessThanOrEqual(8);
    REMINDER_MESSAGES.forEach((m) => expect(m.length).toBeGreaterThan(0));
  });

  it('has a non-empty taper message', () => {
    expect(TAPER_MESSAGE.length).toBeGreaterThan(0);
  });
});
