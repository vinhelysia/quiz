# Bộ ôn tập Nhập môn Trí tuệ nhân tạo

200 câu single-choice, 10 bộ × 20 câu; mỗi câu có 4 lựa chọn và giải thích riêng từng lựa chọn đúng/sai. Có câu lý thuyết, nhận diện tình huống, tính toán và mô phỏng thuật toán. Đây là bộ tự luyện được biên soạn theo tài liệu, không phải đề thi chính thức hoặc cam kết bao phủ mọi nội dung có thể thi.

## Nguồn và số trang

| Bộ | PDF nguồn | Số trang |
|---|---|---:|
| 01 | NhapMonAI_Buoi01_TongQuan_AI_TacTuThongMinh.pdf | 83 |
| 02 | NhapMonAI_Buoi02_GiaiQuyetVanDe_BangTimKiem.pdf | 102 |
| 03 | NhapMonAI_Buoi03_TimKiemHeuristic_TimKiemDoiKhang.pdf | 112 |
| 04 | NhapMonAI_Buoi04_ToiUu_Va_CSP.pdf | 137 |
| 05 | NhapMonAI_Buoi05_BieuDienTriThuc_SuyLuanLogic.pdf | 121 |
| 06 | NhapMonAI_Buoi06_BatDinh_SuyLuanXacSuat.pdf | 115 |
| 07 | NhapMonAI_Buoi07_MDP_HocTangCuong.pdf | 114 |
| 08 | NhapMonAI_Buoi08_MachineLearning_CoBan.pdf | 134 |
| 09 | NhapMonAI_Buoi09_NeuralNetworks_DeepLearning.pdf | 134 |
| 10 | NhapMonAI_Buoi10_AI_HienDai_AI_CoTrachNhiem.pdf | 68 |

`source_pages` dùng số thứ tự trang thực trong PDF, bắt đầu từ 1, kể cả trang bìa. Số slide in trên một số tài liệu khác số trang PDF. Câu hỏi áp dụng có thể thay số hoặc tình huống để kiểm tra cùng phương pháp; không mặc định mọi đề bài là trích nguyên văn. Các ví dụ xác suất bệnh/cảnh báo là mô hình số giả định trong bài học.

## Dùng trên website

Các file `Json/nhap-mon-ai/ai-01.json` đến `ai-10.json` tuân theo schema có sẵn của website `vinhelysia/quiz`. Giữ nguyên các trường `chapter_id`, `source_file`, `math_format`, `question_type`, `questions`; mỗi câu có `source_pages`, `correct_answer`, `explanation`.

- Đã tích hợp: vào môn **Nhập môn Trí tuệ nhân tạo**, chọn Buổi 01–10, chọn **Luyện tập** để xem giải thích sau khi chọn đáp án; **Kiểm tra** để xem khi nộp bài.
- Import thủ công: giải nén, dùng chức năng tải JSON của website và chọn từng file JSON (không chọn file ZIP).
- Đáp án đúng được phân bố đều 5 câu A, 5 B, 5 C, 5 D trong mỗi bộ, thứ tự đã xáo trộn.
- Giải thích ghi rõ nội dung lựa chọn trong dấu «…», thay vì tham chiếu chữ cái A/B/C/D, để vẫn đúng khi website trộn đáp án.
- Chỉ bộ câu hỏi và tham chiếu nguồn được đưa lên website; PDF gốc giữ ở máy.
