# Pulse

A social battery app. Set your level, your circle sees it, nobody has to ask if you're okay.

## Setup

```bash
cd ~/Desktop/pulse
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. First install pulls a lot of packages, so give it a few minutes.

## Hooking up to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Pulse app scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pulse.git
git push -u origin main
```

`node_modules/` and `.expo/` are already gitignored.

## Structure

```
theme.js                    Design tokens. Single source of truth for colour and type.
lib/battery.js              All pure logic: status thresholds, MBTI personalisation,
                            circle helpers, weekly insights. No UI, easy to test.
components/
  BatteryGauge.js           The signature interaction. Drag to set, blue flame on the
                            fill edge while dragging.
  MiniBattery.js            Small read-only battery for circle rows.
  VibeCheck.js              Two-question tap-only flow for "I don't know my level".
screens/
  OnboardingScreen.js       8 steps: welcome, how it works, circle, vibes, soundtrack,
                            MBTI, first level, done.
  MyBatteryScreen.js        Gauge, presets, 7-day history, reason chips, "could use a
                            chat", companionship card, suggestions, "I'm around", pulse.
  CircleScreen.js           Ambient room summary, energy-sorted list, acknowledgments,
                            join open invites.
  InsightsScreen.js         Weekly ring with flame glow, plain-language metrics.
App.js                      Fonts, navigation, onboarding gate.
```

## What's mocked

Everything is local state. There is no backend yet.

- `CIRCLE` and `PAST_HISTORY` in `lib/battery.js` are hardcoded. Replace with Firestore reads.
- `sendPulse` sets local state. Replace with a Firestore write.
- Spotify integration is not built. The soundtrack step in onboarding collects the data but nothing consumes it yet.
- The weekly "pattern spotted" text is static copy, not computed.

## Next up

1. **Firebase**: Auth, Firestore for `users` / `circles` / `pulses` / `acknowledgments`, real-time listeners so the Circle screen updates live.
2. **Push notifications**: `expo-notifications` for pulses, plus the morning prompt (actionable notification with 4 emoji buttons so people never need to open the app).
3. **Spotify OAuth**: `expo-auth-session` with PKCE. Use audio-features (valence/energy) for real mood matching.
4. **Home screen widget**: needs `expo prebuild` and native code. Not possible in Expo Go. Highest-value remaining feature since it removes the last bit of friction.

## Gotchas

- `react-native-reanimated/plugin` must be **last** in the babel plugins array. It's already set in `babel.config.js`. If gestures silently stop working, check this first.
- `GestureHandlerRootView` must wrap the app. Already done in `App.js`.
- If you change `babel.config.js`, restart with `npx expo start -c` to clear the cache.
