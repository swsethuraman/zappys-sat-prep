import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabs from './MainTabs';
import SessionScreen from '../screens/SessionScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';
import { useProgress } from '../context/ProgressContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Switches between the Onboarding flow (Welcome -> Diagnostic ->
 * DiagResults) and the Main tab bar based on whether the user's stored
 * progress has diagnosticDone === true. Both stacks stay registered so
 * DiagResultsScreen can navigate into Main, and so Session/SessionSummary
 * (full-screen modals) are reachable from Main.
 *
 * PHASE 4 TODO: once Firebase Auth lands, branch here on auth state too —
 * show an AuthNavigator before Onboarding when there's no signed-in user.
 */
export default function RootNavigator() {
  const { progress } = useProgress();
  const hasCompletedDiagnostic = progress?.diagnosticDone ?? false;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasCompletedDiagnostic ? 'Main' : 'Onboarding'}
    >
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
