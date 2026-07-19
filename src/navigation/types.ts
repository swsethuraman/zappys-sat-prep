import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ConceptId } from '../data/concepts';

// Auth flow — shown when no user is signed in.
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

// Onboarding/diagnostic flow — shown before a user has a profile.
export type OnboardingStackParamList = {
  Welcome: undefined;
  Diagnostic: undefined;
  DiagResults: undefined;
};

// Bottom tab navigator — the main app once onboarding is complete.
export type MainTabParamList = {
  Dashboard: undefined;
  Practice: undefined;
  Schedule: undefined;
  Profile: undefined;
};

// Root stack — switches between onboarding and main tabs, and hosts
// full-screen flows like an active practice session.
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  /** Pass focusConcept to run a single-concept session from LessonScreen. */
  Session: { focusConcept?: ConceptId } | undefined;
  SessionSummary: {
    delta: number;
    newScore: number;
    correctCount: number;
    totalCount: number;
    touchedConcepts: ConceptId[];
    justExceeded: boolean;
  };
  Lesson: { concept: ConceptId };
};
