import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import Navigation from './src/navigation/Navigation';

// Force light theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac4',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AppProvider>
          <Navigation />
          <StatusBar style="dark" />
        </AppProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
