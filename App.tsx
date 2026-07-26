import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { useZappyFonts } from './src/theme/fonts';
import { AuthProvider } from './src/context/AuthContext';
import { ProgressProvider, useProgress } from './src/context/ProgressContext';
import { rescheduleAllReminders } from './src/lib/notifications';
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
  const { progress, isLoading } = useProgress();

  // One-time, idempotent reminder reconciliation on native startup (FR2):
  // cancel all scheduled notifications and reschedule from current state. This
  // clears any legacy Phase 5 countdown notifications on existing devices and
  // re-establishes the current daily + taper set. Runs once per launch, after
  // progress has loaded; no-op on web.
  const didReconcile = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' || !progress || didReconcile.current) return;
    didReconcile.current = true;
    rescheduleAllReminders(progress).catch(() => {});
  }, [progress]);

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
    <AuthProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </AuthProvider>
  );
}
