# BikeBuilders - Garage Management System

A comprehensive React Native Android application for managing garage/vehicle service operations with SQLite database, SMS reminders, and automatic Google Drive backup.

## Features

- **Customer Management**: Store and manage customer information
- **Vehicle Registration**: Register vehicles with owner details
- **Service Tracking**: Create and track vehicle services
- **Payment Management**: Handle payments with partial payment support
- **Service History**: View complete service history for each vehicle
- **SMS Reminders**: Send service reminders to customers via SMS
- **Admin Panel**: Manage common services and their default charges
- **Search Functionality**: Quick search by vehicle registration number
- **In-Progress Services**: Track ongoing services on the main screen
- **Google Drive Auto Sync**: Automatic backup to Google Drive (requires setup)
- **Local Backup**: Export/import backups as files

## Tech Stack

- React Native with Expo
- SQLite (in-memory database)
- React Navigation (Stack + Drawer)
- React Native Paper (UI components)
- Google Drive API with auto-sync
- Expo SMS for service reminders
- Local file backup with sharing

## Database Schema

### Tables

1. **Customers** - Customer information
2. **Vehicles** - Vehicle registration and details (includes NextServiceDays)
3. **Services** - Service records with status tracking
4. **ServiceParts** - Individual parts/services per service record
5. **CommonServices** - Admin-managed service inventory
6. **UserInfo** - Application user/garage information

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on Android:
```bash
npm run android
```

## Project Structure

```
bikeBuilders/
├── src/
│   ├── context/
│   │   └── AppContext.js          # Global state management
│   ├── database/
│   │   └── database.js            # SQLite database operations
│   ├── navigation/
│   │   └── Navigation.js          # Navigation setup
│   ├── screens/
│   │   ├── MainScreen.js          # Home screen with search and services
│   │   ├── VehicleScreen.js       # Vehicle details and history
│   │   ├── VehicleRegistrationScreen.js
│   │   ├── NewServiceScreen.js    # Create new service
│   │   ├── VehicleServiceScreen.js
│   │   ├── SMSReminderScreen.js   # SMS service reminders
│   │   ├── GDriveScreen.js        # Google Drive backup & local backup
│   │   ├── AdminScreen.js         # Admin panel
│   │   ├── UserInfoScreen.js      # User profile
│   │   └── AboutScreen.js         # About page
│   └── services/
│       ├── googleDriveSync.js     # Google Drive auto-sync service
│       └── localBackup.js         # Local file backup service
├── assets/                        # Images and icons
├── App.js                         # Root component
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
├── babel.config.js                # Babel configuration
├── GOOGLE_DRIVE_SETUP.md          # Google Drive setup guide
├── GOOGLE_DRIVE_INTEGRATION.md    # Developer integration guide
├── GOOGLE_DRIVE_QUICKSTART.md     # Quick setup card
├── GOOGLE_DRIVE_SUMMARY.md        # Implementation summary
└── SMS_FEATURE_GUIDE.md           # SMS reminders documentation
```

## Usage

### Main Screen
- Search for vehicles by registration number
- View all in-progress services
- Tap the "+" button to start a new service

### Creating a New Service
1. Tap "New Service" button
2. Enter vehicle registration number
3. If vehicle exists, proceed to service creation
4. If not, fill in vehicle and owner details
5. Enter current meter reading
6. Select services from common services list
7. Adjust amounts if needed
8. Submit to create service

### Managing Services
- Tap on any service to view details
- Update payment information
- Mark service as complete
- View service history

### Admin Panel
- Add/Edit/Delete common services
- Set default charges for services
- Manage service inventory

### User Information
- Set garage name
- Update contact information
- Configure user profile

### SMS Service Reminders
- View vehicles due for service (based on per-vehicle NextServiceDays)
- Send individual SMS reminders
- Send bulk SMS reminders with throttling
- Track sent/failed message counts
- See `SMS_FEATURE_GUIDE.md` for details

### Backup & Restore
- **Google Drive Auto Sync**: Automatic background backup to Google Drive
- **Local Backup**: Export/import backup files to any location
- See `GOOGLE_DRIVE_QUICKSTART.md` for setup

## Google Drive Backup Setup

The app supports automatic backup to Google Drive. To enable:

1. **Quick Setup** (30 minutes): Follow `GOOGLE_DRIVE_QUICKSTART.md`
2. **Detailed Guide**: See `GOOGLE_DRIVE_SETUP.md`
3. **Integration**: See `GOOGLE_DRIVE_INTEGRATION.md` for adding auto-sync to screens

**Key Steps:**
- Create Google Cloud Console project
- Enable Google Drive API
- Get Web Client ID
- Configure in `src/services/googleDriveSync.js`
- Rebuild app with `npx expo prebuild --clean`

**Note**: Local backup works without any setup!

## Upcoming Features

- PDF invoice generation
- Analytics and reports
- Multiple language support
- Dark mode
- Multi-device sync

## Development

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add route in `src/navigation/Navigation.js`
3. Update drawer menu if needed

### Database Operations

All database operations are in `src/database/database.js`. Use the singleton instance:

```javascript
import database from '../database/database';

// Example: Get vehicle
const vehicle = await database.getVehicleByRegNumber(regNumber);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

© 2025 BikeBuilders. All rights reserved.

## Support

For support, email errwael@gmail.com or open an issue on GitHub.

## Author

Developed with ❤️ for efficient garage management
