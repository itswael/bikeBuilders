import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { IconButton } from 'react-native-paper';
import { useApp } from '../context/AppContext';

// Screens
import MainScreen from '../screens/MainScreen';
import VehicleScreen from '../screens/VehicleScreen';
import NewServiceScreen from '../screens/NewServiceScreen';
import VehicleServiceScreen from '../screens/VehicleServiceScreen';
import VehicleRegistrationScreen from '../screens/VehicleRegistrationScreen';
import AdminScreen from '../screens/AdminScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import AboutScreen from '../screens/AboutScreen';
import GDriveScreen from '../screens/GDriveScreen';
import SMSReminderScreen from '../screens/SMSReminderScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function MainStack({ navigation }) {
  const { userInfo } = useApp();
  const garageName = userInfo?.GarageName || 'BikeBuilders';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{
          title: garageName,
          headerLeft: () => (
            <IconButton
              icon="menu"
              iconColor="#fff"
              size={24}
              onPress={() => navigation.openDrawer()}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{ title: 'Vehicle Details' }}
      />
      <Stack.Screen
        name="NewService"
        component={NewServiceScreen}
        options={{ title: 'New Service' }}
      />
      <Stack.Screen
        name="VehicleService"
        component={VehicleServiceScreen}
        options={{ title: 'Service Details' }}
      />
      <Stack.Screen
        name="VehicleRegistration"
        component={VehicleRegistrationScreen}
        options={{ title: 'Vehicle Registration' }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerStyle: {
            backgroundColor: '#fff',
            width: 280,
          },
          drawerActiveTintColor: '#6200ee',
          drawerInactiveTintColor: '#000',
        }}
      >
        <Drawer.Screen
          name="Home"
          component={MainStack}
          options={{ title: 'Home', headerShown: false }}
        />
        <Drawer.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Admin Panel' }}
        />
        <Drawer.Screen
          name="GDrive"
          component={GDriveScreen}
          options={{ title: 'Backup & Restore' }}
        />
        <Drawer.Screen
          name="SMSReminder"
          component={SMSReminderScreen}
          options={{ title: 'Send SMS Reminders' }}
        />
        <Drawer.Screen
          name="UserInfo"
          component={UserInfoScreen}
          options={{ title: 'User Info' }}
        />
        <Drawer.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About' }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
