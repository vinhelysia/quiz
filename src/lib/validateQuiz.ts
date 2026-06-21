import type { Quiz, Difficulty, OptionKey } from '../types/quiz';

export type ValidationResult = { ok: true; quiz: Quiz } | { ok: false; errors: string[] };

export function validateQuiz(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, errors: ['Input data is not a JSON object'] };
  }

  const d = data as Record<string, unknown>;

  // Top-level fields validation
  if (typeof d.chapter_id !== 'string' || d.chapter_id.trim() === '') {
    errors.push('Top-level field "chapter_id" must be a non-empty string.');
  }
  if (typeof d.title !== 'string' || d.title.trim() === '') {
    errors.push('Top-level field "title" must be a non-empty string.');
  }
  if (typeof d.source_file !== 'string' || d.source_file.trim() === '') {
    errors.push('Top-level field "source_file" must be a non-empty string.');
  }
  if (typeof d.language !== 'string' || d.language.trim() === '') {
    errors.push('Top-level field "language" must be a non-empty string.');
  }

  // math_format validation
  if (typeof d.math_format !== 'object' || d.math_format === null || Array.isArray(d.math_format)) {
    errors.push('Top-level field "math_format" must be an object.');
  } else {
    const mf = d.math_format as Record<string, unknown>;
    if (typeof mf.type !== 'string' || mf.type.trim() === '') {
      errors.push('math_format.type must be a non-empty string.');
    }
    if (typeof mf.inline_delimiter !== 'string' || mf.inline_delimiter.trim() === '') {
      errors.push('math_format.inline_delimiter must be a non-empty string.');
    }
    if (typeof mf.block_delimiter !== 'string' || mf.block_delimiter.trim() === '') {
      errors.push('math_format.block_delimiter must be a non-empty string.');
    }
    if (mf.renderer_hint !== undefined && typeof mf.renderer_hint !== 'string') {
      errors.push('math_format.renderer_hint must be a string if defined.');
    }
  }

  // question_type validation
  if (d.question_type !== 'single_choice') {
    errors.push('Top-level field "question_type" must be exactly "single_choice".');
  }

  // questions validation
  if (!Array.isArray(d.questions)) {
    errors.push('Top-level field "questions" must be an array.');
  } else {
    d.questions.forEach((qItem: unknown, idx: number) => {
      if (typeof qItem !== 'object' || qItem === null || Array.isArray(qItem)) {
        errors.push(`Question at index ${idx} is not an object.`);
        return;
      }

      const q = qItem as Record<string, unknown>;
      const qIdStr = typeof q.id === 'string' && q.id.trim() !== '' ? q.id : `index ${idx}`;
      const ctx = `[Question ${qIdStr}]`;

      if (typeof q.id !== 'string' || q.id.trim() === '') {
        errors.push(`${ctx} "id" must be a non-empty string.`);
      }
      if (typeof q.topic !== 'string' || q.topic.trim() === '') {
        errors.push(`${ctx} "topic" must be a non-empty string.`);
      }

      // difficulty validation
      const difficulty = q.difficulty as string;
      const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(difficulty as Difficulty)) {
        errors.push(`${ctx} "difficulty" must be "easy", "medium", or "hard", got "${difficulty}".`);
      }

      // source_pages validation
      if (!Array.isArray(q.source_pages)) {
        errors.push(`${ctx} "source_pages" must be an array of numbers.`);
      } else {
        const nonNumbers = q.source_pages.filter(p => typeof p !== 'number');
        if (nonNumbers.length > 0) {
          errors.push(`${ctx} "source_pages" contains non-number elements: [${nonNumbers.join(', ')}].`);
        }
      }

      if (typeof q.question !== 'string' || q.question.trim() === '') {
        errors.push(`${ctx} "question" must be a non-empty string.`);
      }

      // options validation
      if (typeof q.options !== 'object' || q.options === null || Array.isArray(q.options)) {
        errors.push(`${ctx} "options" must be an object.`);
      } else {
        const opts = q.options as Record<string, unknown>;
        const keys = Object.keys(opts);
        const expectedKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
        
        // Check for extra keys or missing keys
        const missingKeys = expectedKeys.filter(k => !keys.includes(k));
        const extraKeys = keys.filter(k => !expectedKeys.includes(k as OptionKey));

        if (missingKeys.length > 0) {
          errors.push(`${ctx} "options" is missing keys: [${missingKeys.join(', ')}].`);
        }
        if (extraKeys.length > 0) {
          errors.push(`${ctx} "options" contains unexpected extra keys: [${extraKeys.join(', ')}].`);
        }

        // Check value types for correct keys
        expectedKeys.forEach(k => {
          if (keys.includes(k) && typeof opts[k] !== 'string') {
            errors.push(`${ctx} option "${k}" must be a string, got ${typeof opts[k]}.`);
          }
        });
      }

      // correct_answer validation
      const correct = q.correct_answer as string;
      const validCorrectKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
      if (!validCorrectKeys.includes(correct as OptionKey)) {
        errors.push(`${ctx} "correct_answer" must be one of "A", "B", "C", "D", got "${correct}".`);
      } else {
        // If correct_answer key is valid, double-check it exists in options
        if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
          const opts = q.options as Record<string, unknown>;
          if (!(correct in opts)) {
            errors.push(`${ctx} "correct_answer" ("${correct}") is not defined in options.`);
          }
        }
      }

      if (typeof q.explanation !== 'string') {
        errors.push(`${ctx} "explanation" must be a string.`);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, quiz: data as Quiz };
}
