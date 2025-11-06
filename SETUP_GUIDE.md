# BikeBuilders Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/

2. **Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and create an AVD (Android Virtual Device)

3. **Expo CLI** (optional, but recommended)
   ```bash
   npm install -g expo-cli
   ```

4. **Git** (for version control)
   - Download from: https://git-scm.com/

## Installation Steps

### 1. Install Dependencies

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 2. Configure Assets (Optional)

Replace placeholder asset files in the `assets/` directory:
- `icon.png` - App icon (1024x1024 px)
- `splash.png` - Splash screen (1284x2778 px)
- `adaptive-icon.png` - Adaptive icon (1024x1024 px)

For development, Expo will use default placeholders.

### 3. Google Drive Integration (Optional)

To enable Google Drive backup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Update `src/services/googleDrive.js` with your client ID
6. Add redirect URI in Google Cloud Console: `bikebuilders://`

## Running the Application

### Option 1: Using VS Code Tasks

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Select "Tasks: Run Task"
3. Choose:
   - **Start Expo** - Start development server
   - **Run on Android** - Run directly on Android emulator/device

### Option 2: Using Terminal Commands

#### Start Development Server
```bash
npm start
```

Then:
- Press `a` to run on Android
- Press `i` to run on iOS (requires Mac)
- Press `w` to run on web

#### Run on Android Directly
```bash
npm run android
```

**Note:** Ensure Android emulator is running or device is connected via USB with USB debugging enabled.

### Option 3: Using Expo Go App

1. Start the development server:
   ```bash
   npm start
   ```

2. Install Expo Go on your Android device from Play Store

3. Scan the QR code displayed in terminal/browser

## Development Workflow

### Database

The app uses SQLite for local storage. The database is initialized on first launch with the following tables:
- Customers
- Vehicles
- Services
- ServiceParts
- CommonServices
- UserInfo

### Adding Sample Data

On first launch:
1. Go to Admin Panel (drawer menu)
2. Add common services (e.g., "Oil Change - ₹500")
3. Go to User Info (drawer menu)
4. Set your garage name and details
5. Return to main screen and create your first service

### Navigation Structure

```
Drawer Navigator
├── Home (Stack Navigator)
│   ├── Main Screen
│   ├── Vehicle Screen
│   ├── Vehicle Registration Screen
│   ├── New Service Screen
│   └── Vehicle Service Screen
├── Admin Panel
├── User Info
└── About
```

## Troubleshooting

### Android Emulator Issues

**Problem:** Emulator not starting
- Solution: Open Android Studio → AVD Manager → Start emulator manually

**Problem:** App not installing on emulator
- Solution: 
  ```bash
  adb devices
  adb kill-server
  adb start-server
  ```

### Metro Bundler Issues

**Problem:** Metro bundler cache issues
- Solution:
  ```bash
  npx expo start --clear
  ```

### Dependencies Issues

**Problem:** Module not found errors
- Solution:
  ```bash
  rm -rf node_modules
  npm install
  ```

### SQLite Issues

**Problem:** Database not initializing
- Solution: Clear app data or reinstall app

## Building for Production

### Android APK

1. Configure `app.json` with your app details
2. Build APK:
   ```bash
   eas build --platform android
   ```

Note: Requires Expo Application Services (EAS) account.

### Alternative: Expo Build

```bash
expo build:android
```

## Project Structure Reference

```
bikeBuilders/
├── .github/
│   └── copilot-instructions.md
├── .vscode/
│   └── tasks.json
├── assets/
│   └── (icon, splash, adaptive-icon)
├── src/
│   ├── context/
│   │   └── AppContext.js
│   ├── database/
│   │   └── database.js
│   ├── navigation/
│   │   └── Navigation.js
│   ├── screens/
│   │   ├── MainScreen.js
│   │   ├── VehicleScreen.js
│   │   ├── VehicleRegistrationScreen.js
│   │   ├── NewServiceScreen.js
│   │   ├── VehicleServiceScreen.js
│   │   ├── AdminScreen.js
│   │   ├── UserInfoScreen.js
│   │   └── AboutScreen.js
│   └── services/
│       └── googleDrive.js
├── App.js
├── app.json
├── babel.config.js
├── package.json
└── README.md
```

## Testing

### Manual Testing Checklist

- [ ] Launch app successfully
- [ ] Set up garage name in User Info
- [ ] Add common services in Admin Panel
- [ ] Create a new vehicle registration
- [ ] Create a new service
- [ ] Update payment for a service
- [ ] Complete a service
- [ ] Search for vehicles
- [ ] View vehicle details
- [ ] Edit vehicle information
- [ ] View service history

## Support

For issues or questions:
- Check the README.md
- Review code comments
- Check Expo documentation: https://docs.expo.dev/

## Next Steps

1. Customize the app icon and splash screen
2. Add sample common services (Oil Change, Brake Service, etc.)
3. Test all features with sample data
4. Configure Google Drive backup (optional)
5. Customize color scheme in components
6. Add more features as needed

Happy coding! 🚀
