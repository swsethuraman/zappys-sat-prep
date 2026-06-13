import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader, Card, Eyebrow } from '../components/ui';
import { colors, fonts, fontSizes } from '../theme/colors';

type Props = BottomTabScreenProps<MainTabParamList, 'Schedule'>;

/**
 * PHASE 5 TODO: date picker for the user's SAT date (synced to
 * users/{uid}.scheduledSAT in Firestore), countdown display, and
 * expo-notifications reminders at 14 days / 3 days / day-of.
 */
export default function ScheduleScreen(_props: Props) {
  return (
    <Screen>
      <BrandHeader />
      <Card>
        <Eyebrow>Schedule</Eyebrow>
        <Text style={styles.body}>
          SAT date picker, countdown, and reminders go here (Phase 5).
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    lineHeight: 22,
  },
});
