# BikeBuilders - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Development Server

Choose one of these methods:

**Option A: Using VS Code Task**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Tasks: Run Task"
3. Select "Start Expo"

**Option B: Using Terminal**
```bash
npm start
```

### Step 2: Launch on Android

**Requirements:**
- Android Studio installed with an emulator, OR
- Physical Android device with Expo Go app installed

**Method A: Android Emulator**
1. Start Android emulator from Android Studio
2. In the Expo terminal, press `a` for Android

**Method B: Physical Device**
1. Install "Expo Go" from Play Store
2. Scan the QR code shown in terminal

**Method C: Direct Launch**
```bash
npm run android
```

### Step 3: Initial Setup

1. **Set Garage Name**
   - Open drawer menu (☰)
   - Tap "User Info"
   - Enter garage name and contact details
   - Tap "Save"

2. **Add Common Services**
   - Open drawer menu (☰)
   - Tap "Admin Panel"
   - Tap the "+" button
   - Add services like:
     - Oil Change - ₹500
     - Brake Service - ₹800
     - Engine Tuning - ₹1200
     - etc.

3. **Create Your First Service**
   - Return to main screen
   - Tap "New Service" button
   - Enter vehicle registration number
   - Fill in owner details
   - Enter current meter reading
   - Select services from suggested list
   - Tap "Create Service"

## 📱 App Features Overview

### Main Screen
- **Search Bar**: Search vehicles by registration number
- **In-Progress Services**: View all ongoing services
- **New Service Button**: Start a new service

### Vehicle Management
- Register new vehicles with owner details
- View complete service history
- Edit vehicle information
- Track last service date and reading

### Service Management
- Create new services with multiple parts/tasks
- Track service status (In Progress / Completed)
- Manage payments (Full / Partial)
- View detailed service breakdown

### Admin Panel
- Add/Edit/Delete common services
- Set default charges
- Manage service inventory

### User Info
- Set garage name (displayed on main screen)
- Update contact information
- Manage profile

## 🔧 Common Tasks

### Creating a Service for Existing Vehicle
1. Search vehicle on main screen
2. Tap on vehicle card
3. Tap "New Service" button
4. Fill in service details

### Completing a Service
1. Tap on in-progress service
2. Tap "Update Payment" (enter paid amount)
3. Tap "Complete Service"
4. Vehicle's last service date/reading updated automatically

### Searching for Vehicles
1. Type registration number in search bar
2. Results appear instantly
3. Tap to view vehicle details

## 📊 Database Structure

The app stores data locally using SQLite:

- **Customers**: Owner information
- **Vehicles**: Vehicle registration and details
- **Services**: Service records with status
- **ServiceParts**: Individual parts per service
- **CommonServices**: Admin-managed service catalog
- **UserInfo**: Garage/user profile

## 🔍 Troubleshooting

### App won't start?
```bash
npx expo start --clear
```

### Emulator not detected?
```bash
adb devices
adb kill-server
adb start-server
```

### Module errors?
```bash
rm -rf node_modules
npm install
```

## 📚 Documentation

- **Full Setup**: See `SETUP_GUIDE.md`
- **Features**: See `README.md`
- **Code Documentation**: Check inline comments in source files

## 🎨 Customization

### Change App Colors
Edit styles in screen files. Primary color: `#6200ee`

### Modify Services
Use Admin Panel within the app

### Change Garage Name
Use User Info screen within the app

## 🔐 Google Drive Backup (Optional)

To enable cloud backup:
1. Set up Google Cloud project
2. Enable Drive API
3. Update `src/services/googleDrive.js` with credentials
4. Implement backup buttons in UI

See `SETUP_GUIDE.md` for detailed instructions.

## 💡 Tips

- Use admin panel to set up common services before creating service records
- Set garage name to personalize the app
- Use search to quickly find vehicles
- Complete services to update vehicle's last service info
- Track partial payments using the payment management feature

## 🐛 Known Limitations

- Google Drive backup requires OAuth setup (not configured by default)
- Asset images use placeholders (add custom icons for production)
- No PDF invoice generation yet (planned feature)

## 🚀 Next Steps

1. ✅ Run the app and explore features
2. ✅ Set up garage name and user info
3. ✅ Add common services in admin panel
4. ✅ Create test vehicles and services
5. ✅ Customize to your needs
6. 📝 Plan additional features

---

**Need Help?** Check `SETUP_GUIDE.md` for detailed troubleshooting and advanced setup.

**Happy Managing!** 🏍️✨
