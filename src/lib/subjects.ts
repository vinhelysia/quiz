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
];

export function getSubjectMeta(id: string): SubjectMeta {
  return (
    SUBJECTS.find((s) => s.id === id) ?? {
      id, title: id, short: id, description: '', order: 999,
    }
  );
}
