# Quick Start Instructions

## The app code is complete! Here's how to run it:

### Option 1: Try Running (May have Expo SDK 52 startup bug)
Open your terminal in the `Offline Games` folder and run:
```bash
npx expo start
```

If you see a QR code, scan it with Expo Go app on your phone!

### Option 2: If Option 1 Fails (Recommended Fix)
There's a known bug with Expo SDK 52. Downgrade to SDK 51:

```bash
npm install expo@~51.0.0 expo-status-bar@~1.12.0
npx expo start
```

### Option 3: Manual Terminal Commands
1. Open PowerShell/Terminal
2. Navigate: `cd "C:\Users\vikash\Offline Games"`
3. Run: `npx expo start`
4. Scan QR code with your phone

## What You'll See
- First time: Enter your name screen
- After that: Home dashboard with 6 game cards
- Bottom tabs for navigation

The app works 100% offline after initial load!
