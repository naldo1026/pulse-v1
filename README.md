# Pulse

A social battery app. Set your level, your circle sees it, nobody has to ask if you're okay.

Right now it runs as a web app people add to their home screen (a PWA), backed by Supabase, for a closed test with a handful of people. The Expo code still builds for native when it's time for a real app.

## Local setup

```bash
cd ~/Desktop/pulse/pulse
npm install
cp .env.example .env   # fill in the three values, see "Going live" below
npx expo start --web
```

The app follows the phone's light/dark setting, so check changes in both.

Expo bakes the `EXPO_PUBLIC_*` values into the bundle and caches it. After changing `.env`, restart with `npx expo start --web --clear`, or you'll keep talking to the old project.

## How it works

```
home-screen web app (Vercel) ── supabase-js ──> Supabase Postgres (RLS on every table)
                                                   │ triggers           │ pg_cron, every 5 min
                                                   ▼                    ▼
                                         Edge Function notify   Edge Function morning
                                                   └── web push (VAPID) ──> phone ──> public/sw.js
```

- **Data:** the app reads and writes Supabase directly. Everyone signed in can see everyone's level. You can only change your own rows.
- **Live updates:** Supabase Realtime tells the app when anyone's level, pulse or seen mark changes, and the app refetches. It also refetches when it comes back to the front, because iOS drops the connection in the background.
- **Pulses:** sending one inserts a row in `pulses`. A trigger works out the recipients from your groups (anyone you haven't sorted counts as Friends) and calls `notify`, which pushes to their phones.
- **Morning check-in:** cron calls `morning` every 5 minutes. It pushes "Morning. How are you feeling?" to anyone whose check-in time just passed, once a day. Tapping it opens the app on the morning prompt.
- **Sign-in:** email and password. There's no sign-up in the app. You add people in the Supabase dashboard with a starting password, and they can change it in Settings.

**iPhone limits:**
- Push needs iOS 16.4 or later, and Pulse has to be opened from the home screen. It also has to be signed into there: Safari and the home-screen app don't share sign-ins.
- Notifications can't have buttons on iPhone, so the morning check-in opens the app instead.

## Going live (one-time setup)

### 1. Supabase project

Create a project at supabase.com (free tier is fine). Save the database password; `supabase link` asks for it. Then, in the dashboard:

- **Authentication > Sign In / Providers:** turn off **Allow new users to sign up**. Leave the Email provider on.

No email setup is needed. Pulse never sends email.

### 2. Keys

Three local files hold the keys. All three are gitignored:

- `.env`: the public values the app is built with (Supabase URL, publishable key, VAPID public key).
- `supabase/functions/.env`: the Edge Function secrets (VAPID key pair, `PUSH_SECRET`).
- `supabase/vault.local.sql`: the two Vault secrets for the database.

To make them from scratch:

```bash
npx web-push generate-vapid-keys   # VAPID key pair for push
openssl rand -hex 32               # PUSH_SECRET: lets only the database trigger the push functions
```

### 3. Database and functions

`npx supabase` runs the CLI without installing it. `link` and `db push` ask for the database password.

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env
npx supabase functions deploy notify
npx supabase functions deploy morning
```

Then paste `supabase/vault.local.sql` into **SQL Editor** and run it. It tells the database where the functions are, and gives it the shared secret.

Until those two secrets exist, everything works except push.

### 4. Vercel

- Import the GitHub repo at vercel.com. `vercel.json` already sets the build command and output folder.
- Add the three env vars from `.env.example`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_KEY` (the publishable/anon key)
  - `EXPO_PUBLIC_VAPID_PUBLIC_KEY`
- **The project name becomes the URL** (`name.vercel.app`), so pick it once. Home-screen installs and push subscriptions belong to that URL, so changing it means everyone reinstalls.
- Every push to `main` deploys.
- Set Supabase **Authentication > URL Configuration > Site URL** to the Vercel URL.

## Adding a tester

**Authentication > Users > Add user > Create new user** in Supabase:
- Their email.
- A starting password.
- Auto Confirm on.

Their profile is created automatically. Then send them:

> Open https://YOUR-APP.vercel.app in Safari. Tap Share, then Add to Home Screen. Open Pulse from your home screen (not Safari) and sign in with your email and the password I've sent you. Allow notifications when it asks. You can change your password in Settings.

If someone forgets their password, set a new one in **SQL Editor** and send it to them:

```sql
update auth.users set encrypted_password = crypt('their-new-password', gen_salt('bf'))
where email = 'them@example.com';
```

On Android, open it in Chrome and accept the install prompt (or use the menu > Add to Home screen).

## Structure

```
theme.js                    Design tokens: light/dark palettes (useTheme), Roboto, type
                            scale, soft shadow. Ink on near-white; colour comes only from
                            the level (battery fluid and the background streak).
lib/data.js                 Level colour ramps (THEMES), status copy, quiz, song library.
lib/supabase.js             Supabase client.
lib/api.js                  Every read and write, mapped to the shapes screens use.
lib/push.js                 Web push permission and subscription.
lib/pwa.js                  Install detection, service worker, notification deep links.
lib/haptics.js              Haptic tick/tap, no-ops on web.
components/
  primitives.js             Btn, Label, Panel, Chip, Display (bold heading), Segmented,
                            Toggle. Buttons, chips and segments are pills.
  LightStreak.js            Soft diagonal streak of light behind each screen's header,
                            tinted by the current level. Drifts slowly.
  LiquidCell.js             The battery. Drag to set; waves, bubbles, haptic ticks.
  PulseBurst.js             Full-screen colour wash + haptics when a pulse is sent.
  Orb.js                    Person on the Circle ring, with a level arc.
  PeopleEditor.js           Everyone on Pulse, each with a group picker.
  Sheet.js                  Bottom sheet used by MorningPrompt and VibeCheckModal.
  Icon.js                   Small stroke icon set (react-native-svg).
screens/
  InstallScreen.js          iPhone in Safari: how to add to the home screen.
  SignInScreen.js           Email and password.
  OnboardingScreen.js       Welcome, name, level, sort your people, notifications.
  YouScreen.js              Battery, status, reasons / "I'm around", send pulse.
  CircleScreen.js           Ring of people per group (Home, Family, Friends).
  WeekScreen.js             Last 7 days of your levels and a few plain facts.
  SettingsScreen.js         Name, password, people, notifications, colours, morning
                            check-in, personality type, songs, sign out.
App.js                      Gates (install, sign-in, onboarding), app state, saving,
                            realtime, deep links.
supabase/
  migrations/               Tables, RLS, triggers, cron, realtime. The whole backend.
  functions/notify          Pushes pulses and nudges.
  functions/morning         Pushes the morning check-in.
public/                     Page template, manifest, service worker (sw.js), icons.
                            Expo copies it into dist/ on export.
assets/icon.svg             App icon source (battery + streak). The PNGs in assets/ and
                            public/ are rendered from it; re-export them if it changes.
```

## Still not real

- Spotify isn't built. Settings saves a song per mood but nothing reads it.
- The personality-type copy on the Week screen is fixed text.

## Next up

1. **Native app:** the backend carries over as is. Native phones would add `platform = 'expo'` rows to `push_subscriptions`, and `notify` would send those through Expo's push service.
2. **Home screen widget:** needs native code. Highest-value remaining feature since it removes the last bit of friction.

## Gotchas

- `react-native-reanimated/plugin` must be **last** in the babel plugins array. It's already set in `babel.config.js`. If gestures silently stop working, check this first.
- Import fonts per weight (`@expo-google-fonts/roboto/500Medium`), not from the package index, or the web export ships every weight.
- `GestureHandlerRootView` must wrap the app. Already done in `App.js`.
- If you change `babel.config.js` or `.env`, restart with `npx expo start -c` to clear the cache.
- `public/sw.js` must show a notification for every push. iOS cancels the subscription of a web app that gets pushes without showing anything.
- `Notification.requestPermission()` has to be the first thing a tap handler does. On iOS, any `await` before it loses the tap and the prompt never shows.
