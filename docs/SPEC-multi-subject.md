# SPEC — Thêm lớp "Môn học" (multi-subject) + trang con cho web quiz

> Context handoff cho agent (Sonnet). Đọc kỹ toàn bộ trước khi sửa code.
> Repo: React 19 + TypeScript + Vite, deploy GitHub Pages (`base: /quiz/`).

## 1. Bối cảnh hiện tại (đã xác minh)

- App là SPA 1 trang, **không có router**. Điều hướng bằng state `screen: 'home' | 'quiz' | 'results'` trong `src/App.tsx`.
- Mỗi file trong `Json/*.json` là **một chương** (`Quiz`), được nạp tự động bằng `import.meta.glob('/Json/*.json')` trong `src/lib/quizLoader.ts`.
- Kiểu dữ liệu ở `src/types/quiz.ts`; được validate nghiêm ngặt bởi `src/lib/validateQuiz.ts` (KHÔNG nới lỏng validator).
- `src/components/HomeScreen.tsx` đang liệt kê **phẳng** tất cả chương dưới dạng lưới `.chapter-grid`, với tiêu đề hardcode "Trắc nghiệm Kinh tế học".
- **Chưa có khái niệm "Môn" (subject).** Tất cả file hiện tại đều là Kinh tế vi mô.

## 2. Mục tiêu

Thêm lớp phân cấp **Môn → Chương → Quiz** với 2 môn:
1. `kinh-te-vi-mo` — Kinh tế học vi mô (toàn bộ chương hiện có).
2. `kinh-te-chinh-tri-mln` — Kinh tế chính trị Mác – Lênin (file đề đã có sẵn, KHÔNG sửa nội dung).

Hai loại "trang con" cần làm (đã chốt với người dùng — chỉ làm đúng 2 cái này, không tự thêm trang khác):
- **Trang chọn môn** (landing): lưới các MÔN.
- **Trang chi tiết môn**: liệt kê các chương/đề của môn đó + giữ nguyên luồng tuỳ chọn/làm bài/kết quả hiện tại.

## 3. Tổ chức lại dữ liệu (folder theo môn)

Dùng cấu trúc thư mục con theo môn:

```
Json/
  kinh-te-vi-mo/            <- DI CHUYỂN 9 file vi mô vào đây
    chuong-1-...json
    ... (toàn bộ chuong-* hiện có)
    de-kiem-tra-qua-trinh-vi-mo.json
  kinh-te-chinh-tri-mln/
    de-on-tap-trac-nghiem-1.json   <- ĐÃ TẠO SẴN, GIỮ NGUYÊN
```

Việc cần làm:
- `git mv` (hoặc move) **tất cả** file `Json/*.json` đang ở gốc `Json/` vào `Json/kinh-te-vi-mo/`. Gồm 8 file `chuong-*.json` và `de-kiem-tra-qua-trinh-vi-mo.json`.
- KHÔNG di chuyển/sửa `Json/kinh-te-chinh-tri-mln/de-on-tap-trac-nghiem-1.json`.

Lưu ý: `chapter_id` không đổi và vẫn duy nhất trên toàn bộ (vi mô dùng `chuong-*`/`de-kiem-tra-qua-trinh`; KTCT dùng `ktct-*`). Đừng đổi `chapter_id`.

## 4. Subject registry — file mới `src/lib/subjects.ts`

```ts
export interface SubjectMeta {
  id: string;        // = tên thư mục con trong Json/
  title: string;     // tên đầy đủ hiển thị
  short: string;     // nhãn ngắn
  description: string;
  order: number;     // thứ tự hiển thị
}

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'kinh-te-vi-mo',
    title: 'Kinh tế học vi mô',
    short: 'Vi mô',
    description: 'Cung – cầu, hành vi người tiêu dùng, lý thuyết sản xuất, các cấu trúc thị trường.',
    order: 1,
  },
  {
    id: 'kinh-te-chinh-tri-mln',
    title: 'Kinh tế chính trị Mác – Lênin',
    short: 'KTCT',
    description: 'Hàng hóa, giá trị thặng dư, tích lũy tư bản, kinh tế thị trường định hướng XHCN.',
    order: 2,
  },
];

export function getSubjectMeta(id: string): SubjectMeta {
  return (
    SUBJECTS.find((s) => s.id === id) ?? {
      id, title: id, short: id, description: '', order: 999,
    }
  );
}
```

## 5. Loader — sửa `src/lib/quizLoader.ts`

- Đổi glob sang `import.meta.glob('/Json/**/*.json', { eager: true })`.
- Với mỗi path (vd `/Json/kinh-te-vi-mo/chuong-1-....json`), trích **đoạn thư mục ngay sau `/Json/`** làm `subjectId`. File nằm trực tiếp trong `/Json/` (không có thư mục con) → `subjectId = 'khac'`.
- Sau khi `validateQuiz` ok, **gắn `subjectId`** vào object quiz trước khi push.
- Giữ nguyên sort theo `chapter_id` (numeric). Có thể thêm hàm tiện ích `groupBySubject(quizzes)` trả về map `subjectId -> Quiz[]`.
- `parseQuizFile` (import file ngoài): gắn `subjectId = 'khac'` (hoặc cho phép truyền vào subjectId hiện hành). Không bắt buộc nhưng tránh `undefined`.

## 6. Type — sửa `src/types/quiz.ts`

Thêm field vào interface `Quiz`:
```ts
export interface Quiz {
  // ... các field cũ giữ nguyên ...
  subjectId?: string;   // gắn bởi loader, không nằm trong file JSON
}
```
(Để optional để không phá `rebuildQuizFromSnapshot` trong App.tsx và `parseQuizFile`.)

## 7. Router tối giản (hash-based) trong `src/App.tsx`

Dùng **hash router tự viết** (không thêm dependency) để an toàn với GitHub Pages:
- Route `#/` → màn **chọn môn** (`SubjectsScreen`).
- Route `#/mon/:subjectId` → màn **chi tiết môn** (`HomeScreen` lọc theo môn đó).
- Quiz và Results **giữ nguyên dạng screen-state lồng bên trong** route môn (URL vẫn ở `#/mon/:subjectId` khi đang làm bài). KHÔNG đưa tiến trình làm bài vào URL.

Gợi ý hiện thực:
- Hook nhỏ đọc `window.location.hash`, lắng nghe `hashchange`, trả `{ route: 'subjects' } | { route: 'subject', subjectId }`.
- Hàm `navigate(hash)` set `window.location.hash`.
- App giữ thêm state `view: 'list' | 'quiz' | 'results'` cho luồng trong môn (đổi tên từ `screen` cũ cho gọn, hoặc giữ tên cũ — tuỳ, nhưng phải nhất quán).
- Khi bấm 1 môn ở SubjectsScreen → `navigate('#/mon/<id>')`.
- Nút "← Tất cả môn" ở HomeScreen → `navigate('#/')`.
- **Resume (bài đang làm dở):** banner resume hiện ở SubjectsScreen (toàn cục). Khi resume, tìm quiz theo `chapterId` trong toàn bộ quizzes (mọi môn), điều hướng vào đúng môn rồi vào quiz. Giữ logic `loadResumable/discardResumable` như cũ.

> Nếu hash routing phát sinh rắc rối ngoài dự kiến, fallback được chấp nhận: dùng thuần screen-state (`view: 'subjects' | 'subject' | 'quiz' | 'results'` + `selectedSubjectId`). Ưu tiên hash router trước.

## 8. Component mới `src/components/SubjectsScreen.tsx`

- Nhận props: danh sách môn đã có dữ liệu (lọc `SUBJECTS` giao với các `subjectId` thực sự nạp được), số chương & tổng số câu mỗi môn, callback `onSelectSubject(id)`, và (tuỳ) banner resume.
- Hiển thị tiêu đề chung (vd "Ngân hàng trắc nghiệm") + lưới các **thẻ MÔN**. Mỗi thẻ: `title`, `description`, meta "`N` chương · `M` câu hỏi".
- **Tái sử dụng** class CSS hiện có: bọc trong `.app`, dùng `.card`, `.section-title`, lưới kiểu `.chapter-grid` và thẻ kiểu `.chapter-card` (có thể thêm class phụ `.subject-card` nếu cần style nhẹ). Dùng biến màu `--accent`, `--bg-elev`, `--border`, `--text-h`, `--text-muted`, `--radius`. KHÔNG hardcode màu — chỉ dùng CSS variables (đã hỗ trợ dark mode qua `prefers-color-scheme`).

## 9. Sửa `src/components/HomeScreen.tsx` → trang chi tiết môn

- Thêm props: `subject: SubjectMeta` và `onBack: () => void`.
- `quizzes` truyền vào HomeScreen phải **đã được lọc theo môn** (App lọc trước, hoặc HomeScreen tự lọc theo `subject.id`). Chỉ hiển thị chương của môn đang chọn.
- Header: hiển thị `subject.title` + subtitle theo môn (vd "Luyện tập và kiểm tra theo từng chương."). Thêm nút/link "← Tất cả môn" gọi `onBack`.
- Giữ NGUYÊN: phần Tuỳ chọn làm bài, Nhập tệp quiz, Lịch sử điểm. (Lịch sử có thể để toàn cục như hiện tại — không bắt buộc lọc theo môn.)
- `selectedId` mặc định = chương đầu của môn (không phải `quizzes[0]` toàn cục).

## 10. Ràng buộc & không được phá

- KHÔNG sửa `validateQuiz.ts` theo hướng nới lỏng. `subjectId` được gắn SAU validate, không cần validator biết.
- KHÔNG đổi schema file JSON (không thêm field vào file). `subjectId` suy ra từ thư mục.
- KHÔNG sửa nội dung file đề KTCT đã tạo.
- Giữ nguyên hành vi: `useQuizSession`, `QuizScreen`, `ResultsScreen`, `storage`, figure rendering, resume/timer/shuffle.
- Tái sử dụng tối đa CSS sẵn có; chỉ thêm CSS mới khi thật cần và phải dùng CSS variables.
- TypeScript phải sạch (`tsc -b` không lỗi).

## 11. Kiểm thử bắt buộc trước khi báo xong

1. `npm run build` (chạy `tsc -b && vite build`) — phải PASS, không lỗi type, không lỗi build.
2. (Khuyến nghị) `npm run lint`.
3. Tự rà: vào `#/` thấy 2 thẻ môn; bấm KTCT → `#/mon/kinh-te-chinh-tri-mln` thấy đề "Đề ôn tập trắc nghiệm số 1 (60 câu)"; bấm Bắt đầu làm được bài, chọn đáp án, nộp, ra kết quả; nút "← Tất cả môn" quay lại danh sách môn; bấm Vi mô thấy đủ các chương cũ.

## 12. Tiêu chí hoàn thành (acceptance)

- [ ] 9 file vi mô đã nằm trong `Json/kinh-te-vi-mo/`; KTCT trong `Json/kinh-te-chinh-tri-mln/`.
- [ ] `src/lib/subjects.ts` tồn tại với 2 môn.
- [ ] Loader nạp được cả 2 môn, gắn đúng `subjectId`.
- [ ] `#/` = trang chọn môn (2 thẻ); `#/mon/:id` = chi tiết môn (đúng chương của môn).
- [ ] Luồng làm bài + kết quả + resume + timer + shuffle vẫn hoạt động.
- [ ] `npm run build` PASS.
- [ ] Giao diện đồng nhất với phần còn lại (dùng class/biến CSS sẵn có, hỗ trợ dark mode).

## 13. File liên quan (để khỏi tìm)

- `src/App.tsx` — router + điều phối màn hình.
- `src/components/HomeScreen.tsx` — thành trang chi tiết môn.
- `src/components/SubjectsScreen.tsx` — MỚI.
- `src/lib/subjects.ts` — MỚI.
- `src/lib/quizLoader.ts` — glob + gắn subjectId.
- `src/types/quiz.ts` — thêm `subjectId?`.
- `src/App.css`, `src/index.css` — tham chiếu class & biến CSS (xem `.app`, `.card`, `.section-title`, `.chapter-grid`, `.chapter-card`, `.btn`, biến `--accent`...).
