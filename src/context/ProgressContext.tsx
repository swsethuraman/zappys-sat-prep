import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyDiagnosticResults,
  applySessionResults,
  type SessionAnswer,
} from '../lib/sessionBuilder';
import type { ConceptId } from '../data/concepts';
import { createInitialProgress, type UserProgress } from '../lib/types';

const STORAGE_KEY = 'zappySAT:progress:v1';

interface ProgressContextValue {
  /** null while loading from storage. */
  progress: UserProgress | null;
  /** True until the initial AsyncStorage read completes. */
  isLoading: boolean;
  setTargetScore: (score: number) => void;
  /** Applies diagnostic answers, sets diagnosticDone, and persists. */
  completeDiagnostic: (answers: { concept: ConceptId; correct: boolean }[]) => void;
  /** Applies session answers, returns the score delta + whether target was just exceeded. */
  completeSession: (answers: SessionAnswer[]) => { delta: number; justExceeded: boolean };
  raiseTarget: (score: number) => void;
  setActualScore: (score: number, date: string) => void;
  /** Persist updated pool cursors after buildSession() advances them. */
  setPoolIndex: (poolIndex: UserProgress['poolIndex']) => void;
  /** Wipes all progress and starts over (Profile screen "Reset Zappy"). */
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted progress on mount.
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!isMounted) return;
        if (raw) {
          try {
            setProgress(JSON.parse(raw) as UserProgress);
          } catch {
            setProgress(createInitialProgress());
          }
        } else {
          setProgress(createInitialProgress());
        }
      })
      .catch(() => {
        if (isMounted) setProgress(createInitialProgress());
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist on every change, once loaded.
  useEffect(() => {
    if (isLoading || !progress) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {
      // Best-effort persistence — Phase 4 (Firestore) will be the source
      // of truth and handle retries/offline queueing.
    });
  }, [progress, isLoading]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      isLoading,
      setTargetScore: (score) => {
        setProgress((prev) => (prev ? { ...prev, targetScore: score } : prev));
      },
      completeDiagnostic: (answers) => {
        if (!progress) return;
        setProgress(applyDiagnosticResults(progress, answers));
      },
      completeSession: (answers) => {
        if (!progress) return { delta: 0, justExceeded: false };
        const applied = applySessionResults(progress, answers);
        setProgress(applied.progress);
        return { delta: applied.delta, justExceeded: applied.justExceeded };
      },
      raiseTarget: (score) => {
        setProgress((prev) => (prev ? { ...prev, targetScore: score } : prev));
      },
      setActualScore: (score, date) => {
        setProgress((prev) => (prev ? { ...prev, actualScore: score, actualDate: date } : prev));
      },
      setPoolIndex: (poolIndex) => {
        setProgress((prev) => (prev ? { ...prev, poolIndex } : prev));
      },
      reset: () => {
        setProgress(createInitialProgress());
      },
    }),
    [progress, isLoading],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
