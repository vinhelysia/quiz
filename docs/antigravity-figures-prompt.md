# PROMPT CHO ANTIGRAVITY — Vẽ biểu đồ kinh tế học trực tiếp trong câu hỏi

> Paste toàn bộ nội dung dưới đây vào Antigravity (agent prompt) để triển khai tính năng.
> Mục tiêu: **hiện biểu đồ/đồ thị thật** thay vì mô tả bằng chữ như "cho hình như sau", "trên đồ thị cung-cầu...".

---

## 1. Bối cảnh dự án (đọc kỹ trước khi code)

- Repo: app trắc nghiệm Kinh tế học vi mô, **single-page app**, không có backend.
- Stack: **React 19 + TypeScript + Vite + KaTeX** (đã cài `katex`). Không dùng router, không dùng state library ngoài.
- Câu hỏi được nạp từ các file JSON trong thư mục `Json/` thông qua `import.meta.glob` (xem `src/lib/quizLoader.ts`). Mỗi JSON là một chương, mảng `questions[]`.
- Toán học được render qua component `src/components/MathText.tsx` (phân tích `$...$` inline và `$$...$$` block rồi gọi `katex.renderToString`).
- Validation nghiêm ngặt ở `src/lib/validateQuiz.ts` — **bất kỳ field nào mới cũng phải được thêm vào validator** kèm rule "optional, không phá vỡ file cũ".
- Schema hiện hành được tài liệu hoá ở `docs/json-schema.md` — phải cập nhật cùng lúc với code.
- Phong cách code: function components, TypeScript strict, comment tiếng Anh ngắn gọn, đặt `file_path:line` khi tham chiếu. **Phải khớp mật độ comment/đặt tên của code đang có.**

## 2. Vấn đề cần giải quyết

Hiện tại nhiều câu hỏi mô tả đồ thị bằng chữ, ví dụ:

- `Json/chuong-2c-...json` câu 2c-004: *"Trên đồ thị cung - cầu, thặng dư tiêu dùng của thị trường là vùng nào?"*
- `Json/chuong-3-...json` câu 3-032: *"Với $P_X=1$, $P_Y=2$, $I=80$, hai điểm chặn của đường ngân sách là gì?"*
- `Json/chuong-3-...json` câu 3-027: *"Trên đồ thị bài giảng, $MRS_{XY}$ giữa $AB$ là $6$, giữa $DE$ là $2$..."*
- `Json/chuong-5-...json`: đường cầu ngang của doanh nghiệp cạnh tranh hoàn hảo, hình chữ nhật lỗ/lãi.
- `Json/chuong-6-...json`: đồ thị cầu tuyến tính độc quyền, đường $MR$, đồ thị $TR$/$TC$.

Sinh viên phải **tự tưởng tượng** đồ thị → hiểu sai đề, không công bằng. Cần vẽ đồ thị thật ngay trong câu hỏi.

## 3. Quyết định kiến trúc (đã chốt)

**Dùng SVG renderer tự viết trong React, KHÔNG thêm thư viện chart nặng** (Chart.js/Recharts/Plotly/D3). Lý do:

- Đồ thị kinh tế là **sơ đồ giản lược** (đường thẳng cung/cầu, tam giác tô màu thặng dư, điểm cân bằng, tiếp tuyến) — không phải biểu đồ dữ liệu. Cần kiểm soát annotation: điểm cân bằng, vùng tô màu, mũi tên dịch chuyển, tiếp tuyến.
- Không thêm dependency, tích hợp sạch với Vite + React 19, ghép tốt với KaTeX.
- Nhẹ, render tức thì, dễ Responsive.

**Mô hình dữ liệu: khái quát hoá thành "primitives"** (line, curve, region, point, arrow) vẽ trên mặt phẳng toạ độ Cartesian, **cộng thêm `preset`** là lối tắt cho các đồ thị chuẩn. Tác giả có thể dùng `preset` (nhanh) hoặc liệt kê `primitives` (linh hoạt) hoặc cả hai (preset + primitive phụ để chú thích).

> Lưu ý: nhãn trong SVG dùng **plain text / unicode** (P, Q, E, E*, Q*, MR, MC, X, Y...). **Không** nhúng KaTeX vào SVG (cần `foreignObject`, phức tạp và dễ lỗi). Trục/đơn vị dùng ký hiệu unicode: Δ, →, ≤, ≥.

## 4. Mô hình dữ liệu (TypeScript)

Thêm vào `src/types/quiz.ts`:

```ts
// Thêm field `figure?` (OPTIONAL) vào Question hiện có — không phá file cũ.
export interface Question {
  id: string;
  topic: string;
  difficulty: Difficulty;
  source_pages: number[];
  question: string;
  options: Record<OptionKey, string>;
  correct_answer: OptionKey;
  explanation: string;
  figure?: FigureSpec;            // ← MỚI, optional
}

// ---- Figure primitives ----
export interface FigureLine {
  kind: 'line';                   // đường thẳng qua 2 điểm (x, y)
  from: [number, number];
  to: [number, number];
  label?: string;
  color?: string;                 // hex hoặc tên lớp; nếu bỏ qua dùng màu mặc định
  dash?: 'solid' | 'dashed';
  id?: string;                    // 'demand' | 'supply' | 'budget'... (tuỳ chọn)
}

export interface FigureCurve {
  kind: 'curve';
  preset?: 'ppf' | 'indifference' | 'isoquant_l' | 'isocost'; // sinh tự động
  points?: [number, number][];    // HOẶC tự cho polyline
  label?: string;
  color?: string;
  id?: string;
}

export interface FigureRegion {
  kind: 'region';                 // đa giác kín (tự đóng), tô màu
  vertices: [number, number][];
  label?: string;
  semantic?: 'consumer_surplus' | 'producer_surplus' | 'deadweight_loss'
           | 'profit' | 'loss' | 'welfare';   // quyết định màu theo ngữ nghĩa
}

export interface FigurePoint {
  kind: 'point';
  at: [number, number];
  label?: string;                 // 'E', 'E*', 'T'
  labelPos?: 'ne' | 'nw' | 'se' | 'sw';
  dashed?: boolean;               // vẽ đường gióng tới 2 trục
}

export interface FigureArrow {
  kind: 'arrow';                  // mũi tên dịch chuyển đường
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
  domain?: [number, number];      // giới hạn trục x, ví dụ [0, 100]
  range?: [number, number];       // giới hạn trục y,  ví dụ [0, 100]
  // Lối tắt: sinh nguyên một đồ thị chuẩn từ vài tham số
  preset?: 'supply_demand' | 'ppf' | 'indifference_budget'
         | 'cost_curves' | 'monopoly';
  presetParams?: Record<string, number>; // ví dụ { demandA: 60, demandB: 1, supplyA: 0, supplyB: 1 }
  primitives?: FigurePrimitive[];        // vẽ tuỳ ý; có thể đi kèm preset để thêm chú thích
}
```

## 5. Component renderer

Tạo file mới **`src/components/FigureView.tsx`**:

- Props: `{ spec: FigureSpec; className?: string }`.
- Bên trong:
  1. Tính linear scale `x → svgX`, `y → svgY` từ `domain`/`range` (mặc định `[0,100]`). **Đảo chiều y** vì gốc SVG ở trên-trái.
  2. Vẽ khung: nền trắng, 2 trục (x, y) nét mảnh, mũi tên đầu trục, nhãn `xLabel`/`yLabel`. Chỉ đánh số các điểm chặn quan trọng (tick tối giản — kinh tế học thường ẩn số trên trục, chỉ hiện tại các điểm mấu).
  3. Duyệt `primitives` theo thứ tự: region (tô trước, ở dưới) → line/curve → arrow → point (trên cùng).
  4. Màu:
     - Mặc định: demand = xanh dương, supply = đỏ, curve = tím/đen.
     - Region theo `semantic`: consumer_surplus = xanh nhạt, producer_surplus = cam nhạt, deadweight_loss = xám gạch chéo, profit = xanh lá nhạt, loss = đỏ nhạt. Dùng biến CSS trong `App.css` (ví dụ `var(--cs-fill)`) để hỗ trợ dark mode.
  5. `viewBox` responsive, đặt `preserveAspectRatio`, chiều rộng 100%, max-width ~ 420–520px, căn giữa.
- Hỗ trợ `preset`: tạo hàm `expandPreset(spec): FigurePrimitive[]` trong file riêng **`src/lib/figurePresets.ts`**, trả về primitives tương đương (ví dụ `supply_demand` sinh 2 đường + điểm cân bằng từ `presetParams`). Gộp kết quả của preset và `primitives` của tác giả.
- **Không bao giờ crash**: nếu spec sai/thiếu, render khung trục + `<text>` báo "Đồ thị không hợp lệ" thay vì văng lỗi.

## 6. Gắn vào giao diện — `src/components/QuizScreen.tsx`

- Import `FigureView`. Ngay **dưới** khối `question-text` (sau dòng `<MathText>{current.question}</MathText>`, khoảng dòng 117) và **trên** khối `options`:
  ```tsx
  {current.figure && (
    <div className="question-figure">
      <FigureView spec={current.figure} />
    </div>
  )}
  ```
- (Tuỳ chọn, bonus) Trong khối giải thích (`explanation`) ở practice mode, nếu có `current.figure` cũng render lại — có thể tô sáng vùng/điểm theo đáp án đúng. Nếu làm, truyền thêm prop `highlightAnswer?: OptionKey` vào `FigureView` và ưu tiên thấp, làm sau khi MVP xong.
- Thêm CSS cho `.question-figure` vào `App.css`: margin, padding nhẹ, bo góc, nền card phụ, căn giữa, có viền mảnh.

## 7. Cập nhật validation — `src/lib/validateQuiz.ts`

Trong khối kiểm tra từng question (bắt đầu khoảng dòng 56), **thêm khối kiểm tra `figure` optional**:

- Nếu `q.figure` tồn tại:
  - Phải là object (không phải array/primitive).
  - `domain`/`range` (nếu có): mảng đúng 2 số, `domain[0] < domain[1]`, `range[0] < range[1]`.
  - Mỗi `primitives[i]` phải có `kind` hợp lệ (`line|curve|region|point|arrow`); kiểm tra các trường bắt buộc theo kind (line cần `from`/`to` là `[number,number]`; region cần `vertices` mảng ≥3 điểm; point cần `at`; arrow cần `from`/`to`).
  - Nếu có `preset`, phải thuộc danh sách cho phép; nếu có `presetParams` phải là object các số.
- **Quan trọng**: `figure` là OPTIONAL → các file JSON cũ không có field này vẫn phải pass validation (đảm bảo không regression).

## 8. Cập nhật tài liệu — `docs/json-schema.md`

- Thêm mục "Figure (optional)" vào "Question Object Fields", mô tả `figure?`, các primitive kinds, `preset`, bảng màu ngữ nghĩa.
- Thêm ví dụ JSON hoàn chỉnh (lấy 1 trong các ví dụ ở Mục 10).

## 9. Thứ tự triển khai (checklist theo bước)

1. **Types**: thêm `FigureSpec` + primitives + field `figure?` vào `src/types/quiz.ts`.
2. **Renderer**: tạo `src/components/FigureView.tsx` + `src/lib/figurePresets.ts`. Test bằng cách hardcode 1 spec tạm trong `QuizScreen` để xem hiển thị.
3. **Validator**: mở rộng `validateQuiz.ts` cho `figure` (optional, an toàn).
4. **UI**: gắn `FigureView` vào `QuizScreen` (và tuỳ chọn explanation). Thêm CSS.
5. **Migration dữ liệu**: sửa các câu hỏi trong `Json/` có mô tả đồ thị (xem danh sách Mục 11) — thêm `figure`. Ưu tiên: 2c-004, 3-027, 3-032, rồi 2a (cung-cầu/dịch chuyển), 5 (cạnh tranh hoàn hảo), 6 (độc quyền).
6. **Build & kiểm tra**: `npm run build` (chạy `tsc -b` → phải không lỗi type), rồi `npm run dev` xem từng câu đã thêm figure.
7. **Commit**: message rõ ràng, ví dụ `Add inline econ figure rendering to quiz questions`.

## 10. Ví dụ JSON (paste thẳng để tham khảo)

**Ví dụ A — Cân bằng cung cầu + thặng dư** (áp dụng cho câu 2c-004):

```json
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
    { "kind": "region", "vertices": [[0,0],[0,30],[30,30]],  "semantic": "producer_surplus" },
    { "kind": "point", "at": [30, 30], "label": "E", "labelPos": "ne", "dashed": true }
  ]
}
```

**Ví dụ B — Đường ngân sách** (áp dụng cho câu 3-032, $P_X=1, P_Y=2, I=80$):

```json
"figure": {
  "type": "econ_chart",
  "title": "Đường ngân sách",
  "xLabel": "X",
  "yLabel": "Y",
  "domain": [0, 90],
  "range": [0, 50],
  "primitives": [
    { "kind": "line", "from": [0, 40], "to": [80, 0], "label": "Ngân sách", "id": "budget" },
    { "kind": "point", "at": [80, 0], "label": "x_max = 80", "labelPos": "se", "dashed": true },
    { "kind": "point", "at": [0, 40], "label": "y_max = 40", "labelPos": "nw", "dashed": true }
  ]
}
```

**Ví dụ C — Dùng preset (đường cong đẳng ích + ngân sách, tiếp tuyến)**:

```json
"figure": {
  "type": "econ_chart",
  "xLabel": "X",
  "yLabel": "Y",
  "domain": [0, 90],
  "range": [0, 50],
  "primitives": [
    { "kind": "curve", "preset": "indifference", "label": "U₁" },
    { "kind": "line", "from": [0, 40], "to": [80, 0], "label": "Ngân sách", "id": "budget" },
    { "kind": "point", "at": [30, 25], "label": "T (tối ưu)", "labelPos": "ne", "dashed": true }
  ]
}
```

## 11. Danh sách câu hỏi cần thêm figure (migration)

Lần lượt bổ sung `figure` cho (tìm trong file tương ứng):

| File | Câu | Nội dung đồ thị |
|------|-----|-----------------|
| `chuong-2c-thang-du-va-chinh-sach.json` | 2c-004 (+ các câu surplus/DWL) | cung-cầu + vùng thặng dư/DWL |
| `chuong-2a-cau-cung-can-bang-thi-truong.json` | câu dịch chuyển cung/cầu, cân bằng | 2 đường + điểm cân bằng + mũi tên dịch chuyển |
| `chuong-3-ly-thuyet-hanh-vi-nguoi-tieu-dung.json` | 3-027 (MRS), 3-032 (ngân sách), câu đường đẳng ích/chữ L | indifference + budget + tiếp tuyến |
| `chuong-4-ly-thuyet-san-xuat-chi-phi.json` | câu đẳng lượng-đẳng phí, chi phí TC/TVC/TFC/MC/ATC | isoquant (chữ L) + isocost; đường chi phí |
| `chuong-5-thi-truong-canh-tranh-hoan-hao.json` | đường cầu ngang P=MR, hình chữ nhật lỗ/lãi | đường ngang + vùng profit/loss |
| `chuong-6-thi-truong-doc-quyen-hoan-toan.json` | cầu tuyến tính + MR, TR/TC | đường D + MR (dốc gấp đôi), đường TR & TC |

## 12. Tiêu chí chấp nhận (Acceptance criteria)

- [ ] Các câu có `figure` hiển thị **biểu đồ SVG thật** ngay dưới đề bài, trên các đáp án.
- [ ] Câu **không** có `figure` vẫn hiển thị bình thường (không thay đổi gì).
- [ ] Tất cả file JSON cũ vẫn pass `validateQuiz` (không regression). File mới có `figure` cũng pass.
- [ ] `npm run build` chạy `tsc -b` **không lỗi type**.
- [ ] Đồ thị responsive, không tràn khung trên màn hẹp; nhãn không đè lên nhau ở ví dụ A/B.
- [ ] Region `semantic` tô đúng màu (CS xanh, PS cam, DWL xám chéo, profit/loss xanh/đỏ).
- [ ] `docs/json-schema.md` đã cập nhật mô tả `figure` + 1 ví dụ.
- [ ] Không thêm dependency ngoài (KaTeX đã có).

## 13. Ràng buộc

- **Giữ nguyên hành vi hiện tại**: scoring, shuffle, timer, resume localStorage, import file — không động tới trừ khi cần.
- **Code style**: function components, TS strict, comment tiếng Anh ngắn, khớp mật độ comment hiện tại. TypeScript types cho mọi prop.
- **i18n**: nhãn mặc định tiếng Việt khi cần (ví dụ "Đường ngân sách"), còn ký hiệu toán giữ nguyên (P, Q, E...).
- **Hiệu năng**: renderer phải thuần xác định (deterministic), có thể `useMemo` theo `spec`. Không vẽ lại khi không cần.
- **Không over-engineer**: làm MVP primitives + 2–3 preset trước. Thêm preset khác sau khi MVP chạy được.

## 14. Khung mở rộng (sau này, KHÔNG làm trong PR này)

- `highlightAnswer`: tô sáng vùng tương ứng đáp án đúng trong phần giải thích.
- Thêm preset: Engel, PPF lồi + điểm không hiệu quả, độc quyền tự nhiên (LRAC dốc xuống).
- Cho phép nhúng SVG tĩnh (base64) cho đồ thị phức tạp hiếm gặp.
