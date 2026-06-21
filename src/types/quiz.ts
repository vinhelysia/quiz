export type Difficulty = 'easy' | 'medium' | 'hard';
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface MathFormat {
  type: string;
  inline_delimiter: string;
  block_delimiter: string;
  renderer_hint?: string;
}

export interface Question {
  id: string;
  topic: string;
  difficulty: Difficulty;
  source_pages: number[];
  question: string;
  options: Record<OptionKey, string>;
  correct_answer: OptionKey;
  explanation: string;
}

export interface Quiz {
  chapter_id: string;
  title: string;
  source_file: string;
  language: string;
  math_format: MathFormat;
  question_type: 'single_choice';
  questions: Question[];
}
