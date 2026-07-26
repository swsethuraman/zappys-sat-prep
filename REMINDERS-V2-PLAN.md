# Reminders v2: Daily Anchor + Taper (replacing countdown reminders)

Handoff for Claude Code to replace the Phase 5 milestone-countdown
reminders (T-14 / T-3 / day-of) with the evidence-backed pattern: a
**user-chosen daily practice-time reminder** (implementation intentions)
plus **one day-before taper message**. Drop this in the project root
(`zappys-sat-prep/REMINDERS-V2-PLAN.md`).

**Why (research basis, from the prep-best-practices research pass):**
milestone countdown notifications ("14 days left!") are anxiety-inducing
rather than motivating, and notification-driven adherence collapses when
nudges stop — extrinsic dependency, not habit. The evidence-backed
alternative is an implementation intention: the student picks their own
routine-anchored time ("weekdays at 4pm, after school") and gets a daily
reminder at *their* chosen time in Zappy's friendly voice. The one
milestone worth keeping is a day-before **taper** message — flipping
test-eve pressure into the research-backed protocol (sleep, not
cramming).

---

## Scope decisions — read before starting

- **Setting lives on the Schedule tab only** (decision: option a). No
  onboarding changes this phase — onboarding gets touched once, later,
  when College Targets forces it anyway.
- **This phase deletes more than it adds.** The T-14/T-3/day-of
  scheduling logic goes away entirely. Net code should be simpler than
  Phase 5's.
- **No new packages, no new native modules.** `expo-notifications` and
  the datetime picker are already installed and in the existing dev
  build — so this is fully testable on-device TODAY via Metro
  (`npx expo start --dev-client`), no new EAS build needed.
- **The on-screen countdown card on ScheduleScreen stays.** The research
  objection is to countdown *push notifications*, not a passive
  days-remaining display the student chooses to look at. Leave the card;
  don't add urgency styling to it.
- **All notification APIs stay web-guarded per HN-02.** Web gets the
  time picker and Firestore persistence, with a "reminders work on your
  phone" note — never a crash.
- Follow the HN-11 field pattern exactly for the new `UserProgress`
  field, and Zappy's voice (encouraging, never nagging) for all message
  copy.

---

## Expected outcome + failure modes to guard against

**Expected outcome:** student picks a daily practice time on the
Schedule tab → a repeating local notification fires at that time each
day with a short rotating Zappy message; if a SAT date is set, exactly
one additional notification is scheduled for the evening before
(taper). Changing or clearing either setting reschedules cleanly. Old
countdown notifications are cancelled for existing users. Web never
crashes. tsc/eslint/jest clean.

- **FR1 — Duplicate/stale scheduling.** Every (re)schedule must cancel
  before it schedules. Simplest robust pattern: on any change to
  `reminderTime` or `scheduledSAT`, cancel ALL scheduled notifications
  for the app, then schedule the current set fresh (daily + taper).
  Avoid tracking individual notification IDs unless the cancel-all
  approach conflicts with something — it shouldn't; these are the only
  notifications the app schedules.
- **FR2 — Legacy cleanup.** Existing users (Swami's phone) have
  T-14/T-3/day-of notifications scheduled on-device from Phase 5. The
  cancel-all in FR1 handles this the first time they touch either
  setting — but they might not touch settings for weeks. Add a
  one-time cleanup: on app start (native only), if the old scheduling
  code is gone, cancel-all-and-reschedule-from-current-state once.
  Keep it idempotent.
- **FR3 — Permissions.** Request notification permission when the user
  first SETS a reminder time (not on app launch). Handle denial
  gracefully: save the time anyway (it's their preference), show a
  gentle note that notifications are off in system settings. Native
  only; web skips the entire permission path.
- **FR4 — Web guards.** `Platform.OS === 'web'` before every
  expo-notifications call (HN-02). The time picker uses the existing
  datetimepicker in time mode — web falls back to `<input type="time">`
  (bare styling is acceptable, same as the date picker). Note the
  existing dark-mode contrast KNOWN-GAP applies here too; don't fix it
  in this phase, just don't make it worse.
- **FR5 — Field pattern (HN-11).** `reminderTime: string | null`
  ("HH:mm", 24h, local time) on `UserProgress`: types.ts +
  `createInitialProgress()` (null) + `userDocFields()` + mapper default
  (absent → null) + a `setReminderTime` mutator following
  `setScheduledSAT` exactly. Existing docs must load cleanly.
- **FR6 — Taper correctness.** The taper notification is scheduled only
  when `scheduledSAT` is set and is in the future; scheduled for the
  evening before (19:00 local on scheduledSAT minus 1 day); cancelled/
  rescheduled when the date changes; never scheduled in the past (if
  the SAT is tomorrow, schedule only if 19:00 tonight is still ahead).
- **FR7 — Time handling stays pure and testable.** Trigger computation
  (daily hour/minute; taper datetime from scheduledSAT) lives as pure
  functions in `src/lib/` with an injectable now, unit-tested. Daily
  triggers use expo-notifications' repeating hour/minute trigger (local
  time — DST handled by the OS; note this in a comment rather than
  hand-rolling timezone math).
- **FR8 — Old pure logic removed cleanly.** The Phase 5 reminder-date
  computation (T-14/T-3/day-of) and its tests are deleted, not left as
  dead code. Grep for stragglers.

---

## 1. Data model

Per FR5: `reminderTime: string | null` with the full HN-11 pattern and
a `setReminderTime(time: string | null)` mutator on `ProgressContext`.

## 2. Pure scheduling logic (`src/lib/reminders.ts` + tests)

- `dailyTrigger(reminderTime)` → `{hour, minute}` parsed/validated.
- `taperTrigger(scheduledSAT, now)` → Date | null per FR6.
- `REMINDER_MESSAGES: string[]` — 5-8 short daily messages in Zappy's
  voice. Anchor-flavored and warm, never guilt: e.g. "⚡ Practice time!
  15 minutes to keep the charge building." / "Your future self says
  thanks — quick session?" Rotation can key off day-of-month modulo
  list length (deterministic, testable).
- `TAPER_MESSAGE` — one message: rest-and-confidence framing, e.g.
  "Tomorrow's the day. You've done the work — tonight is for sleep,
  not cramming. ⚡ You're ready."
- Unit tests: trigger parsing, taper edge cases (no date, past date,
  tomorrow, today-evening-passed), message rotation determinism.

## 3. Notification wiring (native-only module or guarded functions)

- `rescheduleAllReminders(progress)`: cancel all scheduled
  notifications, then schedule the daily repeater (if reminderTime) and
  the taper (if applicable). Called from: `setReminderTime`,
  `setScheduledSAT`, and the one-time startup cleanup (FR2).
- Permission request on first set, graceful denial path (FR3).
- Every entry point web-guarded (FR4).
- Delete the Phase 5 T-14/T-3/day-of scheduling code and its pure
  helpers/tests (FR8).

## 4. ScheduleScreen UI

- New "Daily practice reminder" card above/below the SAT-date card:
  time picker (datetimepicker, mode="time"), a clear-reminder option,
  and one line of anchor-framing copy: "Pick a time you already have a
  rhythm around — right after school works great for most students."
- On web, the picker renders via the input fallback and a small note:
  "⚡ Reminders fire on the Zappy mobile app."
- Keep the countdown card as-is.

## 5. Validate

`npx tsc --noEmit`, `npx eslint .`, `npx jest` after each step. New
tests per Step 2; existing suite must stay green (91 passing currently;
Phase 5 reminder-logic tests are expected to be REMOVED, so the total
will change — removals must correspond exactly to deleted Phase 5
logic, nothing else).

## 6. STOP — manual test (Swami drives)

**Web pass** (`npx expo start --web`): set a reminder time → persists in
Firestore (`reminderTime`) → refresh, survives → clear it → null in
Firestore → no console errors anywhere → old account loads clean.

**Device pass** (existing dev build + `npx expo start --dev-client` —
no new build needed): set a reminder time a few minutes ahead → OS
permission prompt appears (first time) → notification fires at the
chosen minute with a Zappy message → set scheduledSAT to tomorrow →
confirm (via a debug log or expo-notifications' scheduled-list) that
exactly TWO notifications are scheduled: daily + taper at 19:00
tonight → change the reminder time → still exactly two, updated. Also
confirm no stale Phase 5 countdown notifications remain scheduled.

Target status: ✅ DEVICE-VERIFIED (notifications) + 🌐 WEB-VERIFIED
(persistence/UI) in the same session — this phase has no
native-untested remainder.

## 7. Commit (only after Swami confirms both passes)

```bash
git add <scoped files> && git commit -m "Reminders v2: daily practice-time anchor + day-before taper, replacing countdown reminders"
```

Then draft (as text for Swami to apply) a HUMAN_NOTES status update:
Phase 5 countdown reminders replaced per research; reminderTime field
follows HN-11 pattern; cancel-all-then-reschedule is the scheduling
invariant.

---

## Prompt to paste into Claude Code

```
New feature on zappys-sat-prep: Reminders v2. Read HUMAN_NOTES.md first
(HN-02 web guards, HN-11 field pattern, HN-12 git discipline), then
REMINDERS-V2-PLAN.md in the project root for the full plan and failure
modes FR1-FR8.

Core design: replace the Phase 5 T-14/T-3/day-of countdown
notifications entirely with (1) a user-chosen daily practice-time
reminder — new reminderTime field on UserProgress (HN-11 pattern) +
setReminderTime mutator + a time picker on ScheduleScreen — and (2) one
day-before taper notification at 19:00 when scheduledSAT is set. The
scheduling invariant is cancel-ALL-then-reschedule on any change, plus
a one-time idempotent startup cleanup so existing devices lose the old
countdown notifications. Permission requested on first set, denial
handled gracefully. Everything web-guarded per HN-02; pure trigger
logic and message constants in src/lib/reminders.ts with injectable
clock and tests. Delete the Phase 5 reminder logic and its tests
cleanly — no dead code.

No new packages or native modules — this must remain testable on the
existing dev build via Metro.

Work Steps 1-4 in order, running tsc/eslint/jest after each step. Stop
before Step 6 — I'll drive the manual web + device test myself — and
stop again before the commit. Confirm git status is clean at finish,
per HN-12.
```
