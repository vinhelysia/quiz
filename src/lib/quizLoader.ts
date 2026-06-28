import type { Quiz } from '../types/quiz';
import { validateQuiz } from './validateQuiz';

/**
 * Derive the subjectId from the glob path.
 * e.g. /Json/kinh-te-vi-mo/chuong-1.json  → 'kinh-te-vi-mo'
 *      /Json/khac.json                     → 'khac'
 */
function subjectIdFromPath(path: string): string {
  // path looks like /Json/<folder>/<file>.json or /Json/<file>.json
  const after = path.replace(/^\/Json\//, '');
  const slashIdx = after.indexOf('/');
  if (slashIdx === -1) {
    // File sits directly in /Json/ — no sub-folder
    return 'khac';
  }
  return after.slice(0, slashIdx);
}

export function loadBundledQuizzes(): Quiz[] {
  const modules = import.meta.glob('/Json/**/*.json', { eager: true });
  const quizzes: Quiz[] = [];

  for (const path of Object.keys(modules)) {
    const mod = modules[path] as Record<string, unknown>;
    // In Vite, json files are usually imported as default exports
    const data = (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod;
    const result = validateQuiz(data);

    if (result.ok) {
      const quiz: Quiz = { ...result.quiz, subjectId: subjectIdFromPath(path) };
      quizzes.push(quiz);
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

/** Group quizzes by subjectId for convenient lookup. */
export function groupBySubject(quizzes: Quiz[]): Map<string, Quiz[]> {
  const map = new Map<string, Quiz[]>();
  for (const q of quizzes) {
    const sid = q.subjectId ?? 'khac';
    const arr = map.get(sid) ?? [];
    arr.push(q);
    map.set(sid, arr);
  }
  return map;
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

  return { ...result.quiz, subjectId: 'khac' };
}
