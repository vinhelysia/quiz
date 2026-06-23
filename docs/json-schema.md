# Quiz JSON Schema Documentation

This document describes the structure and constraints of the JSON files used by the Quiz Application. All quiz files must comply with this schema to pass validation.

## Top-Level Fields

- `chapter_id` (string, required): A unique slug identifying the chapter (e.g. `"chuong-1"`, `"chuong-2a"`).
- `title` (string, required): The display title of the chapter (e.g. `"Chương 1 - Giới thiệu về kinh tế học"`).
- `source_file` (string, required): The name of the source PDF or document used to compile this quiz.
- `language` (string, required): The language code of the quiz content (e.g. `"vi"`).
- `math_format` (object, required): Configuration for rendering mathematical equations.
  - `type` (string, required): The math format type (e.g. `"latex"`).
  - `inline_delimiter` (string, required): Delimiter used for inline math (e.g. `"$"`).
  - `block_delimiter` (string, required): Delimiter used for block equations (e.g. `"$$"`).
  - `renderer_hint` (string, optional): A descriptive hint about the target renderer (e.g. `"KaTeX hoặc MathJax"`).
- `question_type` (string, required): Must be exactly `"single_choice"`.
- `questions` (array of objects, required): The list of quiz questions.

## Question Object Fields

Each object in the `questions` array must contain:

- `id` (string, required): A unique question identifier within the chapter (e.g. `"1-001"`).
- `topic` (string, required): The specific topic of the question (e.g. `"Sự khan hiếm"`).
- `difficulty` (string, required): The difficulty level. Allowed values: `"easy"`, `"medium"`, or `"hard"`.
- `source_pages` (array of integers, required): The page numbers in the source document where this topic is covered (e.g. `[1, 2]`).
- `question` (string, required): The question text. LaTeX math can be embedded within inline delimiters (e.g. `"$P = MC$"`).
- `options` (object, required): A map of exactly 4 choices keyed `A`, `B`, `C`, and `D`. All option values must be strings.
  - `options.A` (string, required)
  - `options.B` (string, required)
  - `options.C` (string, required)
  - `options.D` (string, required)
- `correct_answer` (string, required): The correct option key. Must be exactly `"A"`, `"B"`, `"C"`, or `"D"`.
- `explanation` (string, required): Explanation of why the answer is correct and why other choices are incorrect.
- `figure` (object, optional): Configuration to render inline SVG economic charts.
  - `type` (string, optional): Must be exactly `"econ_chart"` if provided.
  - `title` (string, optional): Title displayed above the chart.
  - `xLabel` (string, optional): Horizontal axis label (default: `"Q"`).
  - `yLabel` (string, optional): Vertical axis label (default: `"P"`).
  - `domain` (array of 2 numbers, optional): Horizontal coordinate boundaries `[xMin, xMax]` (default: `[0, 100]`).
  - `range` (array of 2 numbers, optional): Vertical coordinate boundaries `[yMin, yMax]` (default: `[0, 100]`).
  - `preset` (string, optional): Shorthand to automatically generate standard economic diagrams. Allowed values: `"supply_demand"`, `"ppf"`, `"indifference_budget"`, `"cost_curves"`, `"monopoly"`.
  - `presetParams` (object, optional): Parameters to customize the preset curves (e.g. `{ "demandA": 80, "demandB": 0.8 }`).
  - `primitives` (array of objects, optional): Annotations or custom shapes to draw on the chart:
    - **Line**: `{ "kind": "line", "from": [x1, y1], "to": [x2, y2], "label"?: string, "color"?: string, "dash"?: "solid"|"dashed", "id"?: string }`
    - **Curve**: `{ "kind": "curve", "preset"?: "ppf"|"indifference"|"isoquant_l"|"isocost", "points"?: [[x,y],...], "label"?: string, "color"?: string, "id"?: string }`
    - **Region**: `{ "kind": "region", "vertices": [[x,y],...], "label"?: string, "semantic"?: "consumer_surplus"|"producer_surplus"|"deadweight_loss"|"profit"|"loss"|"welfare" }`
    - **Point**: `{ "kind": "point", "at": [x, y], "label"?: string, "labelPos"?: "ne"|"nw"|"se"|"sw", "dashed"?: boolean }`
    - **Arrow**: `{ "kind": "arrow", "from": [x1, y1], "to": [x2, y2], "label"?: string }`

---

## Minimal Valid Example

```json
{
  "chapter_id": "chuong-test",
  "title": "Chương Test - Chương Thử Nghiệm",
  "source_file": "TEST-DOCUMENT.pdf",
  "language": "vi",
  "math_format": {
    "type": "latex",
    "inline_delimiter": "$",
    "block_delimiter": "$$"
  },
  "question_type": "single_choice",
  "questions": [
    {
      "id": "test-001",
      "topic": "Ví dụ thử nghiệm",
      "difficulty": "easy",
      "source_pages": [1],
      "question": "Tính giá trị của $x$ khi $x + 2 = 5$.",
      "options": {
        "A": "x = 1",
        "B": "x = 2",
        "C": "x = 3",
        "D": "x = 4"
      },
      "correct_answer": "C",
      "explanation": "Ta có $x + 2 = 5 \\Leftrightarrow x = 5 - 2 = 3$. Do đó C là câu trả lời đúng."
    }
  ]
}
```

---

## Example with a Figure

```json
{
  "chapter_id": "chuong-test-figure",
  "title": "Chương Test Đồ Thị",
  "source_file": "TEST-FIGURE.pdf",
  "language": "vi",
  "math_format": {
    "type": "latex",
    "inline_delimiter": "$",
    "block_delimiter": "$$"
  },
  "question_type": "single_choice",
  "questions": [
    {
      "id": "test-fig-001",
      "topic": "Đồ thị cung cầu",
      "difficulty": "medium",
      "source_pages": [1],
      "question": "Vùng thặng dư tiêu dùng ($CS$) nằm ở đâu?",
      "options": {
        "A": "Vùng dưới đường cầu và trên đường giá thực tế",
        "B": "Vùng dưới đường giá và trên đường cung",
        "C": "Vùng bên phải lượng cân bằng",
        "D": "Toàn bộ đồ thị"
      },
      "correct_answer": "A",
      "explanation": "Thặng dư tiêu dùng ($CS$) là phần diện tích dưới đường cầu, trên đường giá.",
      "figure": {
        "type": "econ_chart",
        "xLabel": "Q",
        "yLabel": "P",
        "domain": [0, 70],
        "range": [0, 70],
        "primitives": [
          { "kind": "line", "from": [0, 60], "to": [60, 0], "label": "D", "id": "demand" },
          { "kind": "line", "from": [0, 0],  "to": [60, 60], "label": "S", "id": "supply" },
          { "kind": "region", "vertices": [[0,60],[0,30],[30,30]], "semantic": "consumer_surplus" },
          { "kind": "point", "at": [30, 30], "label": "E", "labelPos": "ne", "dashed": true }
        ]
      }
    }
  ]
}
```

---

## How to Author a New Quiz File

1. **Naming the file**: Name files with the format `chuong-<id>-<slug>.json` under the `Json/` directory.
2. **Writing LaTeX Math**:
   - Math equations must be enclosed in single dollar signs `$...$` for inline math, and double dollar signs `$$...$$` for block math.
   - Do **NOT** use `$` as a currency symbol. Write "USD" or "đồng" instead to avoid breaking the math renderer.
   - When writing JSON backslashes for LaTeX (e.g., `\Delta` or `\frac`), escape them properly in JSON strings (e.g. `"\\Delta"`, `"\\frac"`).
3. **Strict Validation Constraints**:
   - Every question must have exactly 4 keys (`A`, `B`, `C`, `D`) inside its `options` object. No more, no less.
   - The `correct_answer` value must match one of the keys in `options` (i.e., `"A"`, `"B"`, `"C"`, or `"D"`).
   - Ensure the `id` is unique.
