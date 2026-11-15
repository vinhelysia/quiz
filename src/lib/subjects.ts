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
  {
    id: 'nguyen-tac-quan-ly-csdl',
    title: 'Nguyên tắc quản lý cơ sở dữ liệu',
    short: 'CSDL',
    description: 'Tổng quan CSDL, ER, mô hình quan hệ, đại số quan hệ, SQL, ràng buộc toàn vẹn, phụ thuộc hàm và chuẩn hóa.',
    order: 3,
  },
  {
    id: 'nhap-mon-ai',
    title: 'Nhập môn Trí tuệ nhân tạo',
    short: 'AI',
    description: '200 câu theo 10 buổi: tác tử, tìm kiếm, CSP, logic, Bayes, MDP/RL, Machine Learning, Neural Networks và AI có trách nhiệm.',
    order: 4,
  },
  {
    id: 'chu-nghia-xa-hoi-khoa-hoc',
    title: 'Chủ nghĩa xã hội khoa học',
    short: 'CNXHKH',
    description: '200 câu theo 7 chương: nhập môn, giai cấp công nhân, thời kỳ quá độ, dân chủ và nhà nước, liên minh giai cấp, dân tộc - tôn giáo và gia đình.',
    order: 5,
  },
  {
    id: 'quan-tri-hoc',
    title: 'Quản trị học',
    short: 'QTH',
    description: '377 câu trong 8 bộ theo số gốc; có đáp án và giải thích từ file cung cấp, đã tạm loại 13 câu mơ hồ được chỉ định.',
    order: 6,
  },
];

export function getSubjectMeta(id: string): SubjectMeta {
  return (
    SUBJECTS.find((s) => s.id === id) ?? {
      id, title: id, short: id, description: '', order: 999,
    }
  );
}
