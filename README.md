# Pulse

A social battery app. Set your level, your circle sees it, nobody has to ask if you're okay.

## Setup

```bash
cd ~/Desktop/pulse/pulse
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `w` for the browser. First install pulls a lot of packages, so give it a few minutes.

The app follows the phone's light/dark setting, so check changes in both.

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
theme.js                    Design tokens: light/dark palettes (useTheme), fonts, type
                            scale. Ink on warm paper; the battery fluid is the only colour.
lib/data.js                 Mock data, level colour ramps (THEMES), status copy.
lib/haptics.js              Haptic tick/tap, no-ops on web.
components/
  primitives.js             Btn, Label, Panel, Chip, Display (serif), Segmented, Toggle.
  LiquidCell.js             The battery. Drag to set; waves, bubbles, haptic ticks.
  PulseBurst.js             Full-screen colour wash + haptics when a pulse is sent.
  Orb.js                    Person on the Circle ring, with a level arc.
  PeopleEditor.js           Add/remove people and pick their group.
  Sheet.js                  Bottom sheet used by MorningPrompt and VibeCheckModal.
  Icon.js                   Small stroke icon set (react-native-svg).
screens/
  OnboardingScreen.js       3 steps: welcome, set your level, add your people.
  YouScreen.js              Battery, status, reasons / "I'm around", send pulse.
  CircleScreen.js           Ring of people per group (Home, Family, Friends).
  WeekScreen.js             Weekly bars and a few plain facts.
  SettingsScreen.js         People, colours, morning check-in, personality type, songs.
App.js                      Fonts, navigation, onboarding gate, app state.
```

## What's mocked

Everything is local state. There is no backend yet.

- `PEOPLE` and `WEEK` in `lib/data.js` are hardcoded. Replace with Firestore reads.
- `sendPulse` sets local state. Replace with a Firestore write.
- Spotify integration is not built. Settings collects a song per mood but nothing consumes it yet.
- The Week headline and personality-type copy are static, not computed.

## Next up

1. **Firebase**: Auth, Firestore for `users` / `circles` / `pulses` / `acknowledgments`, real-time listeners so the Circle screen updates live.
2. **Push notifications**: `expo-notifications` for pulses, plus the morning prompt (actionable notification with 4 emoji buttons so people never need to open the app).
3. **Spotify OAuth**: `expo-auth-session` with PKCE. Use audio-features (valence/energy) for real mood matching.
4. **Home screen widget**: needs `expo prebuild` and native code. Not possible in Expo Go. Highest-value remaining feature since it removes the last bit of friction.

## Gotchas

- `react-native-reanimated/plugin` must be **last** in the babel plugins array. It's already set in `babel.config.js`. If gestures silently stop working, check this first.
- Import fonts per weight (`@expo-google-fonts/inter/500Medium`), not from the package index, or the web export ships every weight.
- `GestureHandlerRootView` must wrap the app. Already done in `App.js`.
- If you change `babel.config.js`, restart with `npx expo start -c` to clear the cache.
