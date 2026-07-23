import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  type DocumentData,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  applyDiagnosticResults,
  applySessionResults,
  recordSeenQuestions,
  type SessionAnswer,
} from '../lib/sessionBuilder';
import { updateJournal } from '../lib/errorJournal';
import { isPoolQuestion } from '../data/questions';
import type { ConceptId } from '../data/concepts';
import {
  createInitialProgress,
  toMissedQuestions,
  toSeenQuestions,
  userDocFields,
  type MasteryMap,
  type LastSeenMap,
  type PoolIndexMap,
  type SessionHistoryEntry,
  type UserProgress,
} from '../lib/types';

// ---------------------------------------------------------------------------
// Firestore ↔ UserProgress converters
// ---------------------------------------------------------------------------

function progressFromDoc(data: DocumentData): Omit<UserProgress, 'history'> {
  return {
    mastery: (data['mastery'] ?? {}) as MasteryMap,
    lastSeen: (data['lastSeen'] ?? {}) as LastSeenMap,
    poolIndex: (data['poolIndex'] ?? {}) as PoolIndexMap,
    sessionCount: (data['sessionCount'] ?? 0) as number,
    targetScore: (data['targetScore'] ?? 1200) as number,
    baselineScore: (data['baselineScore'] ?? null) as number | null,
    currentScore: (data['currentScore'] ?? null) as number | null,
    diagnosticDone: (data['diagnosticDone'] ?? false) as boolean,
    actualScore: (data['actualScore'] ?? null) as number | null,
    actualDate: (data['actualDate'] ?? null) as string | null,
    scheduledSAT: (data['scheduledSAT'] ?? null) as string | null,
    // Pre-field docs won't have `seenQuestions`; default missing/malformed
    // entries to empty per concept so existing users load without error (F6).
    seenQuestions: toSeenQuestions(data['seenQuestions']),
    // Pre-field docs won't have `missedQuestions`; default absent/malformed
    // to an empty journal so existing users load without error (FJ3).
    missedQuestions: toMissedQuestions(data['missedQuestions']),
  };
}

function progressToDoc(p: UserProgress) {
  return { ...userDocFields(p), updatedAt: serverTimestamp() };
}

// ---------------------------------------------------------------------------
// Context shape — public API unchanged from the AsyncStorage era
// ---------------------------------------------------------------------------

interface ProgressContextValue {
  /** null while loading from Firestore (or no signed-in user). */
  progress: UserProgress | null;
  /** True while auth is resolving or the initial Firestore load is in flight. */
  isLoading: boolean;
  setTargetScore: (score: number) => void;
  /** Applies diagnostic answers, sets diagnosticDone, and persists. */
  completeDiagnostic: (answers: { concept: ConceptId; correct: boolean; questionId: string }[]) => void;
  /** Applies session answers, returns the score delta + whether target was just exceeded. */
  completeSession: (answers: SessionAnswer[]) => { delta: number; justExceeded: boolean };
  raiseTarget: (score: number) => void;
  setActualScore: (score: number, date: string) => void;
  setScheduledSAT: (date: string | null) => void;
  /** Wipes all progress and starts over (Profile screen "Reset Zappy"). */
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  // Use the uid string (not the User object) as a stable primitive dep.
  const uid = user?.uid ?? null;

  const [docData, setDocData] = useState<Omit<UserProgress, 'history'> | null>(null);
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  // True after both the user doc and history subcollection have returned their
  // first results for the current uid. Reset to false in the effect cleanup
  // so the spinner re-appears whenever the signed-in user changes.
  const [firestoreReady, setFirestoreReady] = useState(false);

  // Show a spinner while auth is resolving OR a signed-in user's data is loading.
  const isLoading = authLoading || (uid !== null && !firestoreReady);

  useEffect(() => {
    // Wait until Firebase Auth has resolved, and skip when there's no user.
    // State resets happen in the cleanup below, not synchronously here, so
    // that we avoid triggering cascading renders from the effect body.
    if (authLoading || !uid) return;

    let mounted = true;
    let historyDone = false;
    let docDone = false;

    const markReady = () => {
      if (historyDone && docDone && mounted) setFirestoreReady(true);
    };

    const userDocRef = doc(db, 'users', uid);
    const historyColRef = collection(db, 'users', uid, 'history');

    // One-time history fetch on sign-in; updated locally after each session.
    getDocs(query(historyColRef, orderBy('n', 'asc')))
      .then((snap) => {
        if (!mounted) return;
        setHistory(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              n: data['n'] as number,
              label: data['label'] as string,
              score: data['score'] as number,
              delta: data['delta'] as number,
            };
          }),
        );
        historyDone = true;
        markReady();
      })
      .catch(() => {
        if (!mounted) return;
        historyDone = true;
        markReady();
      });

    // Real-time subscription for the main user doc.
    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (!mounted) return;
        if (snap.exists()) {
          setDocData(progressFromDoc(snap.data()));
        } else {
          // Doc missing (e.g. sign-up Firestore write lost) — recreate it.
          setDoc(userDocRef, {
            ...userDocFields(createInitialProgress()),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        }
        if (!docDone) {
          docDone = true;
          markReady();
        }
      },
      () => {
        if (!mounted) return;
        if (!docDone) {
          docDone = true;
          markReady();
        }
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
      // Reset state as cleanup (safe to call setState here) so the previous
      // user's data is cleared when a new user signs in or the user signs out.
      setDocData(null);
      setHistory([]);
      setFirestoreReady(false);
    };
  }, [uid, authLoading]);

  // Merge the main-doc fields with locally tracked history.
  const progress = useMemo<UserProgress | null>(
    () => (docData ? { ...docData, history } : null),
    [docData, history],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      isLoading,

      setTargetScore: (score) => {
        if (!uid) return;
        updateDoc(doc(db, 'users', uid), {
          targetScore: score,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      },

      completeDiagnostic: (answers) => {
        if (!uid || !progress) return;
        const updated = applyDiagnosticResults(progress, answers);
        updateDoc(doc(db, 'users', uid), progressToDoc(updated)).catch(() => {});
        const entry = updated.history[0];
        if (entry) {
          // Instrumentation: log per-question diagnostic responses on the
          // existing history write (no new write path). Valuable for
          // item-difficulty calibration; the journal itself stays pool-only.
          const responses = answers.map((a) => ({ questionId: a.questionId, correct: a.correct }));
          addDoc(collection(db, 'users', uid, 'history'), {
            ...entry,
            responses,
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }
        setHistory(updated.history);
      },

      completeSession: (answers) => {
        if (!uid || !progress) return { delta: 0, justExceeded: false };
        const { progress: updated, delta, justExceeded } = applySessionResults(progress, answers);
        // Fold this session's served pool questions into the seen-set AND the
        // error journal, so both persist in the same write as score/history
        // (F8 / FJ4). The journal upserts pool misses and clears any question
        // answered correctly; isPool gates diagnostic/unknown IDs out (FJ2).
        const served = answers.map((a) => ({ concept: a.concept, questionId: a.questionId }));
        const results = answers.map((a) => ({
          questionId: a.questionId,
          concept: a.concept,
          correct: a.correct,
          isPool: isPoolQuestion(a.questionId),
        }));
        const withUpdates = {
          ...updated,
          seenQuestions: recordSeenQuestions(updated.seenQuestions, served),
          missedQuestions: updateJournal(updated.missedQuestions, results, Date.now()),
        };
        // Atomically persist the user doc and the new history entry (F8 / D2).
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', uid), progressToDoc(withUpdates));
        const entry = withUpdates.history[withUpdates.history.length - 1];
        if (entry) {
          const historyRef = doc(collection(db, 'users', uid, 'history'));
          // Per-question response logging — instrumentation only, no reads.
          const responses = answers.map((a) => ({ questionId: a.questionId, correct: a.correct }));
          batch.set(historyRef, { ...entry, responses, createdAt: serverTimestamp() });
        }
        batch.commit().catch(() => {});
        setHistory(withUpdates.history);
        return { delta, justExceeded };
      },

      raiseTarget: (score) => {
        if (!uid) return;
        updateDoc(doc(db, 'users', uid), {
          targetScore: score,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      },

      setActualScore: (score, date) => {
        if (!uid) return;
        updateDoc(doc(db, 'users', uid), {
          actualScore: score,
          actualDate: date,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      },

      setScheduledSAT: (date) => {
        if (!uid) return;
        updateDoc(doc(db, 'users', uid), {
          scheduledSAT: date,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      },

      reset: () => {
        if (!uid) return;
        const initial = createInitialProgress();
        setDoc(doc(db, 'users', uid), {
          ...userDocFields(initial),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        setHistory([]);
        // Best-effort: delete existing history docs so they don't reappear
        // on the next sign-in.
        getDocs(collection(db, 'users', uid, 'history'))
          .then((snap) => snap.docs.forEach((d) => deleteDoc(d.ref).catch(() => {})))
          .catch(() => {});
      },
    }),
    [progress, isLoading, uid],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
