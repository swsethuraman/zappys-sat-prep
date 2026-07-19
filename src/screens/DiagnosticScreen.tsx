import React, { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import { BrandHeader } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import { CONCEPTS } from '../data/concepts';
import { getQuestionById } from '../data/questions';
import { buildDiagnosticQueue, shuffle, type DiagnosticQueueItem } from '../lib/sessionBuilder';
import { useProgress } from '../context/ProgressContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Diagnostic'>;

interface AnswerRecord {
  concept: DiagnosticQueueItem['concept'];
  correct: boolean;
}

export default function DiagnosticScreen({ navigation }: Props) {
  const { completeDiagnostic } = useProgress();

  // Shuffle once per diagnostic attempt.
  const queue = useMemo(() => shuffle(buildDiagnosticQueue()), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const item = queue[index];
  const question = getQuestionById(item.questionId);
  const total = queue.length;

  const handleAnswered = (correct: boolean) => {
    setAnswers((prev) => [...prev, { concept: item.concept, correct }]);
  };

  const handleContinue = () => {
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      completeDiagnostic(answers);
      navigation.replace('DiagResults');
    }
  };

  const isLast = index === total - 1;

  return (
    <Screen>
      <BrandHeader />
      <QuestionCard
        key={index}
        question={question}
        onAnswered={handleAnswered}
        onContinue={handleContinue}
        continueLabel={isLast ? 'See your starting score' : 'Next question'}
        progressLabel={`Diagnostic · Question ${index + 1} of ${total} · ${CONCEPTS[item.concept].short}`}
      />
    </Screen>
  );
}
