import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Quiz } from './types/quiz';
import { loadBundledQuizzes } from './lib/quizLoader';
import {
  discardResumable,
  loadResumable,
  useQuizSession,
} from './hooks/useQuizSession';
import type {
  PersistedState,
  SessionOptions,
} from './hooks/useQuizSession';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

type Screen = 'home' | 'quiz' | 'results';

interface ActiveAttempt {
  quiz: Quiz;
  options: SessionOptions;
  initial?: PersistedState;
}

function App() {
  const quizzes = useMemo(() => loadBundledQuizzes(), []);

  const [screen, setScreen] = useState<Screen>('home');
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  // Bumped on each fresh start so the quiz subtree fully remounts (clean reset).
  const [runKey, setRunKey] = useState(0);
  const [resumeSnapshot, setResumeSnapshot] = useState<PersistedState | null>(
    () => loadResumable(),
  );

  const startAttempt = useCallback(
    (quiz: Quiz, options: SessionOptions, initial?: PersistedState) => {
      discardResumable();
      setAttempt({ quiz, options, initial });
      setRunKey((k) => k + 1);
      setScreen('quiz');
    },
    [],
  );

  const handleStart = useCallback(
    (quiz: Quiz, options: SessionOptions) => {
      startAttempt(quiz, options);
    },
    [startAttempt],
  );

  const handleResume = useCallback(() => {
    if (!resumeSnapshot) return;
    // Prefer a fresh, validated quiz object for the same chapter.
    const quiz =
      quizzes.find((q) => q.chapter_id === resumeSnapshot.chapterId) ??
      rebuildQuizFromSnapshot(resumeSnapshot);
    startAttempt(quiz, resumeSnapshot.options, resumeSnapshot);
    setResumeSnapshot(null);
  }, [resumeSnapshot, quizzes, startAttempt]);

  const handleDiscardResume = useCallback(() => {
    discardResumable();
    setResumeSnapshot(null);
  }, []);

  if (screen === 'home' || !attempt) {
    return (
      <HomeScreen
        quizzes={quizzes}
        onStart={handleStart}
        resume={resumeSnapshot ? { title: resumeSnapshot.title } : null}
        onResume={handleResume}
        onDiscardResume={handleDiscardResume}
      />
    );
  }

  return (
    <QuizRunner
      key={runKey}
      attempt={attempt}
      screen={screen}
      onFinish={() => setScreen('results')}
      onQuit={() => {
        discardResumable();
        setAttempt(null);
        setResumeSnapshot(null);
        setScreen('home');
      }}
      onRestart={() => {
        // Remount via a new key to fully reset hook state.
        startAttempt(attempt.quiz, attempt.options);
      }}
      onHome={() => {
        setAttempt(null);
        setScreen('home');
      }}
    />
  );
}

interface QuizRunnerProps {
  attempt: ActiveAttempt;
  screen: Screen;
  onFinish: () => void;
  onQuit: () => void;
  onRestart: () => void;
  onHome: () => void;
}

/**
 * Owns the useQuizSession hook so that a `key` change on this component
 * (via runKey in App) fully tears down and recreates state on restart.
 */
function QuizRunner({
  attempt,
  screen,
  onFinish,
  onQuit,
  onRestart,
  onHome,
}: QuizRunnerProps) {
  const session = useQuizSession({
    quiz: attempt.quiz,
    options: attempt.options,
    initial: attempt.initial,
  });

  const isPractice = attempt.options.mode === 'practice';

  useEffect(() => {
    if (session.finished) onFinish();
  }, [session.finished, onFinish]);

  if (screen === 'results') {
    return (
      <ResultsScreen
        quiz={attempt.quiz}
        mode={attempt.options.mode}
        session={session}
        onRestart={onRestart}
        onHome={onHome}
      />
    );
  }

  return (
    <QuizScreen
      quiz={attempt.quiz}
      session={session}
      revealImmediately={isPractice}
      onQuit={onQuit}
    />
  );
}

/** Reconstruct a minimal Quiz from a persisted snapshot (fallback when the
 * chapter is no longer in the bundled set, e.g. an imported file). */
function rebuildQuizFromSnapshot(snapshot: PersistedState): Quiz {
  return {
    chapter_id: snapshot.chapterId,
    title: snapshot.title,
    source_file: '',
    language: 'vi',
    math_format: {
      type: 'latex',
      inline_delimiter: '$',
      block_delimiter: '$$',
    },
    question_type: 'single_choice',
    questions: snapshot.questions,
  };
}

export default App;
