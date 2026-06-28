import type { SubjectMeta } from '../lib/subjects';
import type { Quiz } from '../types/quiz';

interface SubjectsScreenProps {
  subjects: SubjectMeta[];
  quizzes: Quiz[];
  onSelectSubject: (id: string) => void;
  resume: { title: string } | null;
  onResume: () => void;
  onDiscardResume: () => void;
}

function SubjectsScreen({
  subjects,
  quizzes,
  onSelectSubject,
  resume,
  onResume,
  onDiscardResume,
}: SubjectsScreenProps) {
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Ngân hàng trắc nghiệm</h1>
          <p className="subtitle">Chọn môn học để bắt đầu luyện tập.</p>
        </div>
      </header>

      {resume && (
        <div className="alert alert-info" role="status">
          <span>
            Bạn có một bài làm đang dở ({resume.title}). Tiếp tục?
          </span>
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={onResume}>
              Tiếp tục
            </button>
            <button className="btn btn-sm" onClick={onDiscardResume}>
              Bỏ qua
            </button>
          </span>
        </div>
      )}

      <section className="card">
        <h2 className="section-title">Môn học</h2>
        <div className="chapter-grid">
          {subjects.map((s) => {
            const subjectQuizzes = quizzes.filter((q) => q.subjectId === s.id);
            const totalQuestions = subjectQuizzes.reduce(
              (sum, q) => sum + q.questions.length,
              0,
            );
            return (
              <button
                key={s.id}
                type="button"
                className="chapter-card subject-card"
                onClick={() => onSelectSubject(s.id)}
              >
                <span className="chapter-title">{s.title}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {s.description}
                </span>
                <span className="chapter-meta">
                  {subjectQuizzes.length} chương · {totalQuestions} câu hỏi
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default SubjectsScreen;
