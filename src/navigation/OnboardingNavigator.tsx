import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import WelcomeScreen from '../screens/WelcomeScreen';
import DiagnosticScreen from '../screens/DiagnosticScreen';
import DiagResultsScreen from '../screens/DiagResultsScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Shown to a signed-in user who hasn't completed the diagnostic yet.
 * Welcome (set target score) -> Diagnostic (16 questions) -> DiagResults
 * (starting score + mastery breakdown) -> hands off to the Main tabs.
 */
export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Diagnostic" component={DiagnosticScreen} />
      <Stack.Screen name="DiagResults" component={DiagResultsScreen} />
    </Stack.Navigator>
  );
}
