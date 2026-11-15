# Quản trị học - ngân hàng câu hỏi đã lọc

File nguồn `Pasted text.txt` có 390 mục, mang số câu gốc từ 1 đến 400. Sau khi bỏ 13 câu người dùng chỉ định, còn **377 câu**, chia 8 bộ theo khoảng số câu gốc.

## Các câu tạm loại

Lọc theo trường **source_number**, không lọc theo `id`:

**7, 53, 54, 89, 102, 104, 106, 110, 115, 136, 137, 140, 151.**

Câu 102 có lựa chọn A và D trùng hệt nhau. Các câu trên đều không có trong 8 bộ học. Bản gốc và các ghi chú không bị sửa; bản làm việc có lưu riêng danh sách 13 câu để sau này xem xét bổ sung.

## Phân bố bộ đề

| Bộ | Khoảng số câu gốc | Số câu còn lại |
|---|---|---:|
| 01 | 001–050 | 49 |
| 02 | 051–100 | 47 |
| 03 | 101–150 | 42 |
| 04 | 151–200 | 49 |
| 05 | 201–250 | 50 |
| 06 | 251–300 | 50 |
| 07 | 301–350 | 40 |
| 08 | 351–400 | 50 |
| **Tổng** | | **377** |

File gốc không có câu số 13 và 330–339. Có hai mục cùng mang số gốc 36 (ID 35 và ID 130); cả hai được giữ vì ghi chú chỉ phản ánh trùng số, không thuộc 13 câu yêu cầu loại. Giao diện hiển thị thêm ID để phân biệt hai mục này.

## Nội dung và cách dùng

- Giữ nguyên nội dung câu hỏi, 4 lựa chọn và đáp án trong file người dùng cung cấp. Không tự sửa đáp án, bổ sung câu còn thiếu hoặc gộp các câu lặp.
- Giữ giải thích của nguồn. Riêng các giải thích tham chiếu chữ cái ở câu gốc 98, 157 và 182 được đổi sang trích nội dung lựa chọn để không sai khi website trộn A/B/C/D.
- Tiền tố `[Câu gốc N]` và thông tin nguồn trong giải thích giúp tra lại bản gốc. `source_pages` để trống vì nguồn là text, không có số trang PDF/slide.
- Chủ đề “Ôn tập tổng hợp” và difficulty “medium” là metadata mặc định để tương thích website; không phải phân loại độ khó đã được giảng viên thẩm định.
- Vào môn **Quản trị học**, chọn bộ và dùng **Luyện tập** để hiện giải thích sau khi chọn, hoặc **Kiểm tra** để xem sau khi nộp.
- Import thủ công: giải nén và chọn từng JSON trong `Json/quan-tri-hoc`. Không upload ZIP trực tiếp vào chức năng import.

Đáp án và lý do được giữ theo file cung cấp, chưa được đối chiếu độc lập với giáo trình hoặc đáp án chính thức. Việc bỏ 13 câu là theo danh sách đã chỉ định, không phải chứng nhận mọi câu còn lại đều không có cách hiểu khác.
