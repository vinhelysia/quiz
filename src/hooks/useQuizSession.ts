import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, OptionKey, Question, Quiz } from '../types/quiz';
import { shuffleArray, shuffleQuestionOptions } from '../lib/shuffle';
import {
  clearProgress,
  loadProgress,
  saveProgress,
} from '../lib/storage';

export type QuizMode = 'practice' | 'exam';

export interface SessionOptions {
  mode: QuizMode;
  shuffle: boolean;
  difficulties?: Difficulty[];
  topics?: string[];
  timerSeconds?: number;
}

/** Serializable snapshot persisted between page loads. */
export interface PersistedState {
  chapterId: string;
  title: string;
  options: SessionOptions;
  questions: Question[];
  answers: Record<string, OptionKey>;
  currentIndex: number;
  startedAt: number;
}

export interface UseQuizSessionResult {
  questions: Question[];
  currentIndex: number;
  current: Question | undefined;
  answers: Record<string, OptionKey>;
  score: number;
  answeredCount: number;
  total: number;
  remainingSeconds: number | null;
  finished: boolean;
  selectAnswer: (questionId: string, key: OptionKey) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  finish: () => void;
}

/**
 * Build the working question set from a quiz + options: filter by difficulty
 * and topic, then (if shuffle) shuffle the questions and remap each option set.
 */
export function buildQuestionSet(
  quiz: Quiz,
  options: SessionOptions,
): Question[] {
  let qs: Question[] = quiz.questions;
  if (options.difficulties && options.difficulties.length > 0) {
    const set = new Set(options.difficulties);
    qs = qs.filter((q) => set.has(q.difficulty));
  }
  if (options.topics && options.topics.length > 0) {
    const set = new Set(options.topics);
    qs = qs.filter((q) => set.has(q.topic));
  }
  if (options.shuffle) {
    qs = shuffleArray(qs).map((q) => shuffleQuestionOptions(q));
  }
  return qs;
}

interface UseQuizSessionArgs {
  quiz: Quiz;
  options: SessionOptions;
  /** Optional resumed snapshot (from loadProgress) used to seed initial state. */
  initial?: PersistedState;
}

/**
 * Owns one quiz attempt: question set, current index, per-question answers,
 * score, optional timer, and localStorage persistence with resume support.
 */
export function useQuizSession({
  quiz,
  options,
  initial,
}: UseQuizSessionArgs): UseQuizSessionResult {
  const questions = useMemo<Question[]>(
    () => initial?.questions ?? buildQuestionSet(quiz, options),
    [quiz, options, initial],
  );

  const [answers, setAnswers] = useState<Record<string, OptionKey>>(
    () => initial?.answers ?? {},
  );
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(initial?.currentIndex ?? 0, Math.max(questions.length - 1, 0)),
  );
  const [finished, setFinished] = useState(false);

  // Start timestamp: reuse the resumed one so the timer continues correctly.
  const startedAtRef = useRef<number>(initial?.startedAt ?? Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    options.timerSeconds ?? null,
  );

  const persist = useCallback(
    (nextAnswers: Record<string, OptionKey>, nextIndex: number) => {
      if (finished) return;
      const state: PersistedState = {
        chapterId: quiz.chapter_id,
        title: quiz.title,
        options,
        questions,
        answers: nextAnswers,
        currentIndex: nextIndex,
        startedAt: startedAtRef.current,
      };
      saveProgress<PersistedState>(state);
    },
    [quiz, options, questions, finished],
  );

  // Countdown effect (only when a timer is configured and not yet finished).
  useEffect(() => {
    if (options.timerSeconds == null || finished) {
      return;
    }
    const total = options.timerSeconds;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const rem = Math.max(0, total - elapsed);
      setRemainingSeconds(rem);
      if (rem <= 0) {
        setFinished(true);
        clearProgress();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [options.timerSeconds, finished]);

  const selectAnswer = useCallback(
    (questionId: string, key: OptionKey) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: key };
        persist(next, currentIndex);
        return next;
      });
    },
    [currentIndex, persist],
  );

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      const ni = Math.min(i + 1, questions.length - 1);
      persist(answers, ni);
      return ni;
    });
  }, [questions.length, answers, persist]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => {
      const ni = Math.max(i - 1, 0);
      persist(answers, ni);
      return ni;
    });
  }, [answers, persist]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((i) => {
        const ni = Math.min(Math.max(index, 0), questions.length - 1);
        if (ni !== i) persist(answers, ni);
        return ni;
      });
    },
    [questions.length, answers, persist],
  );

  const finish = useCallback(() => {
    setFinished(true);
    clearProgress();
  }, []);

  const score = useMemo(() => {
    let s = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct_answer) s += 1;
    }
    return s;
  }, [questions, answers]);

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] != null).length,
    [questions, answers],
  );

  return {
    questions,
    currentIndex,
    current: questions[currentIndex],
    answers,
    score,
    answeredCount,
    total: questions.length,
    remainingSeconds,
    finished,
    selectAnswer,
    next,
    prev,
    goTo,
    finish,
  };
}

/** Read any persisted in-progress attempt from localStorage. */
export function loadResumable(): PersistedState | null {
  return loadProgress<PersistedState>();
}

/** Drop any persisted in-progress attempt. */
export function discardResumable(): void {
  clearProgress();
}
