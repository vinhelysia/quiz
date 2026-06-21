export interface ScoreRecord {
  chapterId: string;
  title: string;
  score: number;
  total: number;
  mode: 'practice' | 'exam';
  timestamp: number;
}

const PREFIX = 'quizapp.v1.';
const PROGRESS_KEY = `${PREFIX}progress`;
const HISTORY_KEY = `${PREFIX}history`;

export function saveProgress<T>(state: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save progress to localStorage:', err);
  }
}

export function loadProgress<T>(): T | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch (err) {
    console.error('Failed to clear progress from localStorage:', err);
  }
}

export function addScore(record: ScoreRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const history = getScoreHistory();
    history.unshift(record); // Prepend to store newest first
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to add score to history:', err);
  }
}

export function getScoreHistory(): ScoreRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ScoreRecord[];
    }
    return [];
  } catch {
    return [];
  }
}

export function clearScoreHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear score history from localStorage:', err);
  }
}

