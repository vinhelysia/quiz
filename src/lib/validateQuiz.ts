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

      // figure validation (optional)
      if (q.figure !== undefined) {
        if (typeof q.figure !== 'object' || q.figure === null || Array.isArray(q.figure)) {
          errors.push(`${ctx} "figure" must be an object.`);
        } else {
          const fig = q.figure as Record<string, unknown>;
          if (fig.type !== undefined && fig.type !== 'econ_chart') {
            errors.push(`${ctx} figure.type must be "econ_chart", got "${fig.type}".`);
          }
          if (fig.title !== undefined && typeof fig.title !== 'string') {
            errors.push(`${ctx} figure.title must be a string.`);
          }
          if (fig.xLabel !== undefined && typeof fig.xLabel !== 'string') {
            errors.push(`${ctx} figure.xLabel must be a string.`);
          }
          if (fig.yLabel !== undefined && typeof fig.yLabel !== 'string') {
            errors.push(`${ctx} figure.yLabel must be a string.`);
          }

          // domain validation
          if (fig.domain !== undefined) {
            if (!Array.isArray(fig.domain) || fig.domain.length !== 2 || typeof fig.domain[0] !== 'number' || typeof fig.domain[1] !== 'number') {
              errors.push(`${ctx} figure.domain must be an array of exactly 2 numbers.`);
            } else if (fig.domain[0] >= fig.domain[1]) {
              errors.push(`${ctx} figure.domain start must be less than end, got [${fig.domain.join(', ')}].`);
            }
          }

          // range validation
          if (fig.range !== undefined) {
            if (!Array.isArray(fig.range) || fig.range.length !== 2 || typeof fig.range[0] !== 'number' || typeof fig.range[1] !== 'number') {
              errors.push(`${ctx} figure.range must be an array of exactly 2 numbers.`);
            } else if (fig.range[0] >= fig.range[1]) {
              errors.push(`${ctx} figure.range start must be less than end, got [${fig.range.join(', ')}].`);
            }
          }

          // preset validation
          if (fig.preset !== undefined) {
            const validPresets = ['supply_demand', 'ppf', 'indifference_budget', 'cost_curves', 'monopoly'];
            if (typeof fig.preset !== 'string' || !validPresets.includes(fig.preset)) {
              errors.push(`${ctx} figure.preset must be one of [${validPresets.join(', ')}], got "${fig.preset}".`);
            }
          }

          if (fig.presetParams !== undefined) {
            if (typeof fig.presetParams !== 'object' || fig.presetParams === null || Array.isArray(fig.presetParams)) {
              errors.push(`${ctx} figure.presetParams must be an object.`);
            } else {
              const params = fig.presetParams as Record<string, unknown>;
              Object.keys(params).forEach(k => {
                if (typeof params[k] !== 'number') {
                  errors.push(`${ctx} figure.presetParams.${k} must be a number.`);
                }
              });
            }
          }

          // primitives validation
          if (fig.primitives !== undefined) {
            if (!Array.isArray(fig.primitives)) {
              errors.push(`${ctx} figure.primitives must be an array.`);
            } else {
              fig.primitives.forEach((prim: unknown, primIdx: number) => {
                if (typeof prim !== 'object' || prim === null || Array.isArray(prim)) {
                  errors.push(`${ctx} figure.primitives[${primIdx}] must be an object.`);
                  return;
                }
                const p = prim as Record<string, unknown>;
                const validKinds = ['line', 'curve', 'region', 'point', 'arrow'];
                if (typeof p.kind !== 'string' || !validKinds.includes(p.kind)) {
                  errors.push(`${ctx} figure.primitives[${primIdx}].kind must be one of [${validKinds.join(', ')}].`);
                  return;
                }

                const checkCoord = (coord: unknown, name: string) => {
                  if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                    errors.push(`${ctx} primitive[${primIdx}] "${name}" must be an array of [number, number].`);
                    return false;
                  }
                  return true;
                };

                if (p.kind === 'line') {
                  checkCoord(p.from, 'from');
                  checkCoord(p.to, 'to');
                  if (p.label !== undefined && typeof p.label !== 'string') errors.push(`${ctx} primitive[${primIdx}] "label" must be a string.`);
                  if (p.color !== undefined && typeof p.color !== 'string') errors.push(`${ctx} primitive[${primIdx}] "color" must be a string.`);
                  if (p.dash !== undefined && p.dash !== 'solid' && p.dash !== 'dashed') errors.push(`${ctx} primitive[${primIdx}] "dash" must be "solid" or "dashed".`);
                } else if (p.kind === 'curve') {
                  if (p.preset !== undefined) {
                    const validCurvePresets = ['ppf', 'indifference', 'isoquant_l', 'isocost'];
                    if (typeof p.preset !== 'string' || !validCurvePresets.includes(p.preset)) {
                      errors.push(`${ctx} primitive[${primIdx}] "preset" must be one of [${validCurvePresets.join(', ')}].`);
                    }
                  }
                  if (p.points !== undefined) {
                    if (!Array.isArray(p.points)) {
                      errors.push(`${ctx} primitive[${primIdx}] "points" must be an array.`);
                    } else {
                      p.points.forEach((pt: unknown, ptIdx: number) => {
                        checkCoord(pt, `points[${ptIdx}]`);
                      });
                    }
                  }
                  if (p.label !== undefined && typeof p.label !== 'string') errors.push(`${ctx} primitive[${primIdx}] "label" must be a string.`);
                  if (p.color !== undefined && typeof p.color !== 'string') errors.push(`${ctx} primitive[${primIdx}] "color" must be a string.`);
                } else if (p.kind === 'region') {
                  if (!Array.isArray(p.vertices) || p.vertices.length < 3) {
                    errors.push(`${ctx} primitive[${primIdx}] "vertices" must be an array of at least 3 points.`);
                  } else {
                    p.vertices.forEach((v: unknown, vIdx: number) => {
                      checkCoord(v, `vertices[${vIdx}]`);
                    });
                  }
                  if (p.label !== undefined && typeof p.label !== 'string') errors.push(`${ctx} primitive[${primIdx}] "label" must be a string.`);
                  if (p.semantic !== undefined) {
                    const validSemantics = ['consumer_surplus', 'producer_surplus', 'deadweight_loss', 'profit', 'loss', 'welfare'];
                    if (typeof p.semantic !== 'string' || !validSemantics.includes(p.semantic)) {
                      errors.push(`${ctx} primitive[${primIdx}] "semantic" must be one of [${validSemantics.join(', ')}].`);
                    }
                  }
                } else if (p.kind === 'point') {
                  checkCoord(p.at, 'at');
                  if (p.label !== undefined && typeof p.label !== 'string') errors.push(`${ctx} primitive[${primIdx}] "label" must be a string.`);
                  if (p.labelPos !== undefined) {
                    const validLabelPos = ['ne', 'nw', 'se', 'sw'];
                    if (typeof p.labelPos !== 'string' || !validLabelPos.includes(p.labelPos)) {
                      errors.push(`${ctx} primitive[${primIdx}] "labelPos" must be one of [${validLabelPos.join(', ')}].`);
                    }
                  }
                  if (p.dashed !== undefined && typeof p.dashed !== 'boolean') errors.push(`${ctx} primitive[${primIdx}] "dashed" must be a boolean.`);
                } else if (p.kind === 'arrow') {
                  checkCoord(p.from, 'from');
                  checkCoord(p.to, 'to');
                  if (p.label !== undefined && typeof p.label !== 'string') errors.push(`${ctx} primitive[${primIdx}] "label" must be a string.`);
                }
              });
            }
          }
        }
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, quiz: data as Quiz };
}
