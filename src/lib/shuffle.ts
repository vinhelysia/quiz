import type { Question, OptionKey } from '../types/quiz';

function getRng(seed?: number): () => number {
  if (seed === undefined) {
    return Math.random;
  }
  // Mulberry32 generator
  let state = seed;
  return () => {
    let t = (state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArray<T>(items: T[], seed?: number): T[] {
  const result = [...items];
  const rng = getRng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function shuffleQuestionOptions(q: Question, seed?: number): Question {
  const keys: OptionKey[] = ['A', 'B', 'C', 'D'];
  const indices = [0, 1, 2, 3];
  
  // Shuffle the indices of options
  const shuffledIndices = shuffleArray(indices, seed);

  // Map shuffled values to keys A-D
  const newOptions = {} as Record<OptionKey, string>;
  keys.forEach((key, newIndex) => {
    const oldIndex = shuffledIndices[newIndex];
    const oldKey = keys[oldIndex];
    newOptions[key] = q.options[oldKey];
  });

  // Track where the original correct answer index ended up
  const oldCorrectIndex = keys.indexOf(q.correct_answer);
  const newCorrectIndex = shuffledIndices.indexOf(oldCorrectIndex);
  // Fallback to original answer if something unexpected happens
  const newCorrectAnswer = newCorrectIndex !== -1 ? keys[newCorrectIndex] : q.correct_answer;

  return {
    ...q,
    options: newOptions,
    correct_answer: newCorrectAnswer,
  };
}
