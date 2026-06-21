import type { Quiz } from '../types/quiz';
import { validateQuiz } from './validateQuiz';

export function loadBundledQuizzes(): Quiz[] {
  const modules = import.meta.glob('/Json/*.json', { eager: true });
  const quizzes: Quiz[] = [];

  for (const path of Object.keys(modules)) {
    const mod = modules[path] as Record<string, unknown>;
    // In Vite, json files are usually imported as default exports
    const data = (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod;
    const result = validateQuiz(data);

    if (result.ok) {
      quizzes.push(result.quiz);
    } else {
      console.warn(`Invalid quiz file at ${path}:\n${result.errors.join('\n')}`);
    }
  }

  // Sort by chapter_id (natural sorting e.g. chuong-1, chuong-2a, chuong-2b...)
  quizzes.sort((a, b) =>
    a.chapter_id.localeCompare(b.chapter_id, undefined, { numeric: true, sensitivity: 'base' })
  );

  return quizzes;
}

export async function parseQuizFile(file: File): Promise<Quiz> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON format: ${errMsg}`);
  }

  const result = validateQuiz(data);
  if (!result.ok) {
    throw new Error(result.errors.join('\n'));
  }

  return result.quiz;
}
