export type Difficulty = 'easy' | 'medium' | 'hard';
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface MathFormat {
  type: string;
  inline_delimiter: string;
  block_delimiter: string;
  renderer_hint?: string;
}

export interface FigureLine {
  kind: 'line';                   // straight line between two points (x, y)
  from: [number, number];
  to: [number, number];
  label?: string;
  color?: string;                 // hex or css variable name
  dash?: 'solid' | 'dashed';
  id?: string;
}

export interface FigureCurve {
  kind: 'curve';
  preset?: 'ppf' | 'indifference' | 'isoquant_l' | 'isocost'; // auto-generated
  points?: [number, number][];    // OR explicit polyline
  label?: string;
  color?: string;
  id?: string;
}

export interface FigureRegion {
  kind: 'region';                 // closed polygon (auto-closes), colored
  vertices: [number, number][];
  label?: string;
  semantic?: 'consumer_surplus' | 'producer_surplus' | 'deadweight_loss'
           | 'profit' | 'loss' | 'welfare';   // controls the fill color semantic
}

export interface FigurePoint {
  kind: 'point';
  at: [number, number];
  label?: string;                 // e.g. 'E', 'E*', 'T'
  labelPos?: 'ne' | 'nw' | 'se' | 'sw';
  dashed?: boolean;               // project lines to axes
}

export interface FigureArrow {
  kind: 'arrow';                  // arrow to show curve shifts
  from: [number, number];
  to: [number, number];
  label?: string;
}

export type FigurePrimitive =
  | FigureLine | FigureCurve | FigureRegion | FigurePoint | FigureArrow;

export interface FigureSpec {
  type?: 'econ_chart';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  domain?: [number, number];      // x axis limits, e.g. [0, 100]
  range?: [number, number];       // y axis limits, e.g. [0, 100]
  preset?: 'supply_demand' | 'ppf' | 'indifference_budget'
         | 'cost_curves' | 'monopoly';
  presetParams?: Record<string, number>; // e.g. { demandA: 60, demandB: 1 }
  primitives?: FigurePrimitive[];        // additional annotations
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
  figure?: FigureSpec;            // ← NEW, optional
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
