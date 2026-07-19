# Phase 7: EAS Build Setup + First Development Build

This phase gets Zappy's SAT Prep onto Swami's physical iPhone for the
first time, using Expo Application Services (EAS) to build a real native
app in the cloud. It also unlocks Phase 4b (Google/Apple sign-in) and
full testing of expo-notifications and react-native-view-shot, which have
only had graceful web fallbacks until now.

---

## Prerequisites (human steps — confirm before starting)

- [ ] Apple Developer Program individual membership active (enrolled and
      paid — Swami has confirmed this is done)
- [ ] expo.dev account exists or will be created at step 1 (free)
- [ ] Swami's Apple ID used for the Apple Developer enrollment is known

---

## Step 1 — Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

`eas login` opens a browser to expo.dev. If no expo.dev account exists,
create one (free, separate from the Apple Developer account). Once logged
in, the terminal will confirm the logged-in username.

---

## Step 2 — Configure EAS in the project

From the project root (`C:\Users\swami\Projects\zappys-sat-prep`):

```bash
eas build:configure
```

This interactive command will:
- Ask which platforms to configure — choose **All** (iOS + Android)
- Create `eas.json` in the project root with `development`, `preview`,
  and `production` build profiles
- Ask for a bundle identifier (iOS) and application ID (Android)

**Use these values when prompted:**
- iOS bundle identifier: `com.swaminathan.zappysatprep`
- Android application ID: `com.swaminathan.zappysatprep`

(These use Swami's personal name since the Apple Developer account is
Individual. If the app later moves to an AltruistAI Organization account,
the bundle ID can be re-registered under that team — low friction since
the app is still pre-release.)

After running, verify that `app.json` now has:
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.swaminathan.zappysatprep"
},
"android": {
  "package": "com.swaminathan.zappysatprep",
  ...existing adaptiveIcon config...
}
```

Also verify `eas.json` was created. It should look roughly like:
```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

If `eas build:configure` doesn't offer to set the bundle identifier, add
those fields to `app.json` manually.

---

## Step 3 — Add expo-dev-client

The development build requires `expo-dev-client`, which replaces Expo Go
with a custom runtime that supports all native modules (including the ones
we've been mocking/guarding on web):

```bash
npx expo install expo-dev-client
```

Then add it to the app entry point. In `App.tsx` (or the root
`index.ts`/`index.js`), add this import at the very top:

```ts
import 'expo-dev-client';
```

This import must be the FIRST import in the entry file — before React,
before navigation, before anything else.

---

## Step 4 — Register the app with Apple (EAS handles this)

```bash
eas device:create
```

This registers Swami's iPhone as a development device with Apple. It will:
- Prompt for a name for the device (e.g. "Swami iPhone")
- Generate a registration URL/QR code — open it on the iPhone to install
  the Apple configuration profile (Settings → prompt to allow)
- Once the profile is installed, EAS can target that specific device for
  internal distribution builds

**This step must be done before the iOS build, since internal distribution
builds are tied to registered devices.**

---

## Step 5 — First iOS development build

```bash
eas build --profile development --platform ios
```

This uploads the project to EAS's build servers and compiles it in the
cloud (no Mac needed). Expect this to take **15–25 minutes** for the first
build (subsequent builds are faster due to caching).

What EAS will do automatically:
- Create an App ID on the Apple Developer portal
- Create a development provisioning profile tied to the registered device
- Sign the build
- Upload the finished `.ipa` to EAS's servers

When the build finishes, EAS will output a QR code and a URL. On the
iPhone, open the URL (or scan the QR code) and install the app directly
— no TestFlight needed for development builds with internal distribution.

---

## Step 6 — First Android development build (optional but recommended)

```bash
eas build --profile development --platform android
```

Android doesn't need device registration or signing setup for internal
distribution. The output is an `.apk` that can be installed directly.
About 10–15 minutes.

---

## Step 7 — Verify the build on-device

Once installed on the iPhone, open the app and run through:

1. **Sign in** — confirm Firebase auth works natively (not just on web)
2. **Schedule tab** — set a SAT date and confirm the **native iOS date
   picker** appears (not the web `<input type="date">` fallback)
3. **Notifications** — set a date far enough out that a T-14-day reminder
   would be in the future, confirm the notification permission prompt
   appears and a notification gets scheduled
4. **Profile tab** — enter an actual score, confirm ShareCard renders,
   and confirm the **"Share my results" button appears** (the native
   path, not the mint fallback message) and opens the real iOS share sheet
5. **Trainer** — open a lesson, confirm the placeholder images load
   correctly on-device

---

## Step 8 — Commit and tag

Once the on-device test passes:

```bash
git add .
git commit -m "Phase 7: EAS config, expo-dev-client, first dev build"
git tag v0.7.0
```

---

## What Phase 7 unlocks for next steps

- **Phase 4b** (Google Sign-In + Apple Sign-In) is now unblocked —
  both require a real native build to work, and that build now exists.
  This is the natural next Claude Code task after Phase 7 verification.
- **Notifications** can be fully tested for the first time.
- **Share sheet** can be fully tested for the first time.
- **Question bank expansion** (all 8 concepts, 30 questions each) can
  be merged independently — it doesn't need a native build, so it can
  happen in parallel.

---

## Prompt for Claude Code

```
Phase 7: EAS Build setup. Read PHASE7-EAS-PLAN.md in the project root.

Work through the steps in order:
1. npm install -g eas-cli && eas login
2. eas build:configure (bundle ID: com.swaminathan.zappysatprep for both
   iOS and Android)
3. npx expo install expo-dev-client, add import at top of entry file
4. eas device:create (to register Swami's iPhone)
5. eas build --profile development --platform ios

Stop after step 4 and show me the device-registration QR code / URL so
I can install the Apple profile on my iPhone before the build starts.
Then proceed to step 5 once I confirm the profile is installed.

Stop again when the iOS build completes and give me the install URL/QR
code for the app itself. I'll run the on-device verification and report
back before we commit.
```

---

## Notes on expected friction points

- **Apple login during `eas build`**: EAS will ask for your Apple ID and
  password to access the Developer portal. It will handle provisioning
  profile creation automatically — you don't need to do anything on
  developer.apple.com manually. If two-factor authentication is triggered,
  enter the 6-digit code from your iPhone when prompted.
- **First build is slow**: 15–25 minutes is normal. EAS shows live build
  logs in the terminal and at expo.dev/builds.
- **Windows path note**: EAS CLI runs fine on Windows/PowerShell. If any
  command returns a "not recognized" error, check that the global npm bin
  is on the PATH (same issue as the earlier Claude Code / npm setup).

