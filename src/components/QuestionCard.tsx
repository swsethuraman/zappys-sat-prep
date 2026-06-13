import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Question } from '../data/questions';
import { CONCEPTS } from '../data/concepts';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/colors';
import { Button } from './ui';

export type QuestionTag = 'warmup' | 'prereq' | 'main' | null;

const TAG_LABEL: Record<Exclude<QuestionTag, null>, string> = {
  warmup: '⚡ Warm-up · quick recall',
  prereq: '⚡ Quick refresher',
  main: '⚡ Focus',
};

interface Props {
  question: Question;
  /** Called once with whether the selected choice was correct. */
  onAnswered: (correct: boolean) => void;
  /** Called when the learner taps the continue button after answering. */
  onContinue: () => void;
  continueLabel: string;
  tag?: QuestionTag;
  progressLabel: string; // e.g. "Question 3 of 16 · Linear Eq."
}

/**
 * Renders a single question with 4 choices. Locks after the first
 * selection, highlights correct/incorrect, and shows OPACC-style
 * pre-written feedback (the misconception explanation for a wrong choice,
 * or the general explanation for a correct one).
 */
export default function QuestionCard({
  question,
  onAnswered,
  onContinue,
  continueLabel,
  tag,
  progressLabel,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const handlePick = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    onAnswered(index === question.correctIndex);
  };

  const tagLabel = tag ? TAG_LABEL[tag] : null;
  const tagConceptSuffix = tag === 'prereq' || tag === 'main' ? ` · ${CONCEPTS[question.concept].short}` : '';

  return (
    <View>
      {tagLabel && (
        <View style={[styles.tag, tag === 'prereq' && styles.tagWarn]}>
          <Text style={[styles.tagText, tag === 'prereq' && styles.tagTextWarn]}>
            {tagLabel}
            {tagConceptSuffix}
          </Text>
        </View>
      )}
      <Text style={styles.progress}>{progressLabel}</Text>

      <View style={styles.card}>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.choices.map((choice, index) => {
          const isPicked = picked !== null;
          const isCorrectChoice = index === question.correctIndex;
          const isPickedChoice = index === picked;

          let style: (typeof styles)['choice' | 'choiceCorrect' | 'choiceIncorrect'][] = [styles.choice];
          if (isPicked && isCorrectChoice) style = [styles.choice, styles.choiceCorrect];
          else if (isPicked && isPickedChoice) style = [styles.choice, styles.choiceIncorrect];

          return (
            <Pressable
              key={index}
              disabled={isPicked}
              onPress={() => handlePick(index)}
              style={({ pressed }) => [...style, pressed && !isPicked && { opacity: 0.85 }]}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}

        {picked !== null && (
          <View style={[styles.feedback, picked === question.correctIndex ? styles.feedbackGood : styles.feedbackBad]}>
            <Text style={styles.feedbackText}>
              {picked === question.correctIndex
                ? `✅ Correct. ${question.explanation}`
                : `✖️ Not quite. ${question.misconceptionByChoice[picked]}`}
            </Text>
            {picked !== question.correctIndex && (
              <Text style={styles.feedbackSubtext}>Why the right answer works: {question.explanation}</Text>
            )}
          </View>
        )}

        {picked !== null && <Button title={continueLabel} onPress={onContinue} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panel2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginBottom: spacing.sm,
  },
  tagWarn: {
    borderColor: colors.coral,
  },
  tagText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.mint,
  },
  tagTextWarn: {
    color: colors.coral,
  },
  progress: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  prompt: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  choice: {
    backgroundColor: colors.panel2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  choiceCorrect: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(94,230,200,0.12)',
  },
  choiceIncorrect: {
    borderColor: colors.coral,
    backgroundColor: 'rgba(255,107,129,0.12)',
  },
  choiceText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md - 0.5,
    color: colors.text,
  },
  feedback: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  feedbackGood: {
    backgroundColor: 'rgba(94,230,200,0.10)',
    borderColor: colors.mint,
    borderWidth: 1,
  },
  feedbackBad: {
    backgroundColor: 'rgba(255,107,129,0.10)',
    borderColor: colors.coral,
    borderWidth: 1,
  },
  feedbackText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm + 0.5,
    color: colors.text,
    lineHeight: 20,
  },
  feedbackSubtext: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
