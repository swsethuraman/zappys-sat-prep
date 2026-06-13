import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { useZappyFonts } from './src/theme/fonts';
import { ProgressProvider, useProgress } from './src/context/ProgressContext';
import { colors } from './src/theme/colors';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink,
    card: colors.panel,
    border: colors.line,
    primary: colors.zap,
    text: colors.text,
  },
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink }}>
      <ActivityIndicator color={colors.zap} size="large" />
    </View>
  );
}

function AppContent() {
  const fontsLoaded = useZappyFonts();
  const { isLoading } = useProgress();

  if (!fontsLoaded || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
}
