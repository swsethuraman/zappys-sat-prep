import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainTabs from './MainTabs';
import SessionScreen from '../screens/SessionScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';
import LessonScreen from '../screens/LessonScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user } = useAuth();
  const { progress } = useProgress();

  if (!user) {
    return <AuthNavigator />;
  }

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
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}
