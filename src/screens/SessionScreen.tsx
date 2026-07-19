import React, { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import { CONCEPTS } from '../data/concepts';
import { getQuestionById } from '../data/questions';
import { buildSession, buildFocusedSession, type SessionAnswer } from '../lib/sessionBuilder';
import { useProgress } from '../context/ProgressContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export default function SessionScreen({ navigation, route }: Props) {
  const { progress, completeSession } = useProgress();
  const focusConcept = route.params?.focusConcept;

  // Build the session queue once, from progress as it was when the session
  // started. Served questions are recorded on completion (completeSession),
  // not on mount — so an abandoned session leaves the pool untouched.
  const built = useMemo(
    () =>
      progress
        ? focusConcept
          ? buildFocusedSession(progress, focusConcept)
          : buildSession(progress)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);

  if (!progress || !built || progress.currentScore === null) {
    return (
      <Screen>
        <BrandHeader />
      </Screen>
    );
  }

  const queue = built.queue;
  const item = queue[index];
  const question = getQuestionById(item.questionId);
  const total = queue.length;
  const isLast = index === total - 1;

  const handleAnswered = (correct: boolean) => {
    setAnswers((prev) => [
      ...prev,
      { concept: item.concept, questionId: item.questionId, correct, kind: item.kind },
    ]);
  };

  const handleContinue = () => {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }

    const { delta, justExceeded } = completeSession(answers);
    const correctCount = answers.filter((a) => a.correct).length;
    const touchedConcepts = Array.from(new Set(answers.map((a) => a.concept)));

    navigation.replace('SessionSummary', {
      delta,
      newScore: progress.currentScore! + delta,
      correctCount,
      totalCount: answers.length,
      touchedConcepts,
      justExceeded,
    });
  };

  return (
    <Screen>
      <BrandHeader />
      <QuestionCard
        key={index}
        question={question}
        onAnswered={handleAnswered}
        onContinue={handleContinue}
        continueLabel={isLast ? 'See session results' : 'Next question'}
        tag={item.kind}
        progressLabel={`Session · Question ${index + 1} of ${total} · ${CONCEPTS[item.concept].short}`}
      />
    </Screen>
  );
}
