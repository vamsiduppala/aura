# Installing and running aura

aura runs in three places from **one codebase**: the web app, an Android app and an iOS app.
All three talk to the same local backend (`apps/api`) with its SQLite database on your machine.
Nothing leaves your computer.

---

## 1. Web (start here — 2 minutes)

**You need:** [Node 24+](https://nodejs.org) (Node 22.5+ works; the API uses Node's built-in
`node:sqlite`, so there's no native build step).

```bash
git clone <your-repo>  &&  cd cosmicmentor
npm install            # installs every workspace
npm run dev            # API on :8787 + web on :5173, together
```

Open **http://localhost:5173** → *Create an account* → enter your date, time and place of
birth → your chart is computed and saved to your account.

That's it. Config is optional (`cp apps/web/.env.example apps/web/.env.local` if you want to
change the port or add a Gemini key for LLM-narrated mentor replies).

**Run the pieces separately** if you prefer: `npm run dev:api` and `npm run dev:web`.

---

## 2. Android

**You need:** [Android Studio](https://developer.android.com/studio) (which brings the SDK and
a device emulator). Java ships inside Android Studio — you don't install it separately.

```bash
cd apps/web
npm run android:run      # builds the web app, syncs it, and launches on a device/emulator
```

or, to drive it from the IDE:

```bash
npm run android:open     # opens the project in Android Studio → press ▶ Run
```

**Point the app at your computer** (one-time, and the most important step):

1. Find your computer's address on the Wi-Fi: `ipconfig` on Windows → *IPv4 Address*
   (looks like `192.168.1.65`); `ifconfig | grep inet` on macOS/Linux.
2. In the app: **Settings → Local aura server** → enter `http://192.168.1.65:8787` → **Save**.
3. The status dot turns green when it connects.

Why: on a phone, `localhost` means *the phone itself*. The server is on your computer, so the
app needs your computer's Wi-Fi address. Both devices must be on the same network.

**To install the APK on a real phone** without Android Studio:

```bash
cd apps/web/android && ./gradlew assembleDebug
# APK lands at: app/build/outputs/apk/debug/app-debug.apk  → copy to your phone and open it
```

---

## 3. iOS

**You need:** a Mac with [Xcode](https://developer.apple.com/xcode/) and CocoaPods
(`sudo gem install cocoapods`). The `ios/` project is already generated and committed, so it
works from a fresh clone on a Mac.

```bash
cd apps/web
npm run ios:open         # opens Xcode → pick your device/simulator → press ▶
```

Then set the server address in **Settings** exactly as in the Android steps above.

For a real iPhone, select your device in Xcode and set a signing team under
*Signing & Capabilities* (a free Apple ID works for personal installs).

---

## 4. After you change the app

The native apps bundle a **built copy** of the web app, so re-sync after edits:

```bash
cd apps/web && npm run cap:sync     # rebuild + push into android/ and ios/
```

The web app needs no such step — Vite hot-reloads while `npm run dev` runs.

---

## Verifying everything works

```bash
npm test           # 4 workspaces: engine, knowledge, api, web
npm run typecheck  # real tsc on every package (vitest does NOT type-check)
```

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| “Can’t reach your local aura server” | The API isn't running (`npm run dev`), or on a phone the address is still `localhost` — set your computer's LAN IP in Settings. |
| Phone connects on Wi-Fi but not mobile data | Correct — the server is on your LAN, so both devices must be on the same Wi-Fi. |
| Green dot never appears on the phone | Your computer's firewall is blocking port 8787. Allow Node through it, or on Windows: `netsh advfirewall firewall add rule name="aura" dir=in action=allow protocol=TCP localport=8787`. |
| `node:sqlite` error on start | You're on Node < 22.5. Install Node 24. |
| Android build can't find the SDK | Open the project once in Android Studio; it writes `local.properties` for you. |
| App shows old content after a code change | Run `npm run cap:sync` — native apps bundle a built copy. |

---

## What runs where

| | Web | Android | iOS |
|---|---|---|---|
| Chart engine (ephemeris, dashas, yogas) | on-device | on-device | on-device |
| Accounts + saved profile | your local API | your local API | your local API |
| Works with the server off | yes (guest mode) | yes (guest mode) | yes (guest mode) |
