import type { Quiz, OptionKey, Question } from '../types/quiz';
import type { UseQuizSessionResult } from '../hooks/useQuizSession';
import MathText from './MathText';

interface QuizScreenProps {
  quiz: Quiz;
  session: UseQuizSessionResult;
  /** When true (practice mode), reveal correctness + explanation on select. */
  revealImmediately: boolean;
  onQuit: () => void;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'badge badge-easy',
  medium: 'badge badge-medium',
  hard: 'badge badge-hard',
};

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function QuizScreen({
  session,
  revealImmediately,
  onQuit,
}: QuizScreenProps) {
  const {
    questions,
    currentIndex,
    current,
    answers,
    total,
    remainingSeconds,
    selectAnswer,
    next,
    prev,
    finish,
  } = session;

  if (!current) {
    return (
      <div className="app">
        <div className="card">
          <p>
            Chương này không có câu hỏi nào khớp với bộ lọc bạn chọn. Vui lòng
            quay lại và mở rộng bộ lọc.
          </p>
          <button className="btn" style={{ marginTop: 12 }} onClick={onQuit}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const selected = answers[current.id];
  const answered = selected != null;
  const isLast = currentIndex >= total - 1;
  // In practice mode we reveal feedback once an answer is chosen.
  const showFeedback = revealImmediately && answered;

  return (
    <div className="app">
      <div className="quiz-topbar">
        <button className="btn btn-ghost btn-sm" onClick={onQuit}>
          ← Thoát
        </button>
        {remainingSeconds != null && (
          <span
            className={'timer' + (remainingSeconds <= 30 ? ' warn' : '')}
            aria-label="Thời gian còn lại"
          >
            ⏱ {formatTime(remainingSeconds)}
          </span>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="badge">
            Câu {currentIndex + 1} / {total}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {questions.filter((q) => answers[q.id] != null).length}/{total} đã
            trả lời
          </span>
        </div>
        <div className="progress-track" style={{ marginTop: 10 }}>
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="card question-card">
        <div className="question-meta">
          <span className={DIFFICULTY_BADGE[current.difficulty]}>
            {current.difficulty}
          </span>
          <span className="badge">{current.topic}</span>
        </div>

        <div className="question-text">
          <MathText>{current.question}</MathText>
        </div>

        <div className="options" role="radiogroup" aria-label="Các đáp án">
          {OPTION_KEYS.map((k) => (
            <OptionButton
              key={k}
              optionKey={k}
              question={current}
              selected={selected}
              showFeedback={showFeedback}
              onChoose={() => selectAnswer(current.id, k)}
            />
          ))}
        </div>

        {showFeedback && (
          <div className="explanation">
            <span className="label">Giải thích</span>
            <MathText>{current.explanation}</MathText>
          </div>
        )}
      </div>

      <div className="quiz-nav">
        <button className="btn" onClick={prev} disabled={currentIndex === 0}>
          ← Câu trước
        </button>
        {isLast ? (
          <button className="btn btn-primary" onClick={finish}>
            Nộp bài
          </button>
        ) : (
          <button className="btn btn-primary" onClick={next}>
            Câu sau →
          </button>
        )}
      </div>
    </div>
  );
}

interface OptionButtonProps {
  optionKey: OptionKey;
  question: Question;
  selected: OptionKey | undefined;
  showFeedback: boolean;
  onChoose: () => void;
}

function OptionButton({
  optionKey,
  question,
  selected,
  showFeedback,
  onChoose,
}: OptionButtonProps) {
  const isSelected = selected === optionKey;
  const isCorrect = optionKey === question.correct_answer;

  let className = 'option';
  if (isSelected) className += ' selected';
  if (showFeedback) {
    if (isCorrect) className += ' correct';
    else if (isSelected) className += ' wrong';
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onChoose}
      aria-pressed={isSelected}
    >
      <span className="option-key">{optionKey}</span>
      <span>
        <MathText>{question.options[optionKey]}</MathText>
      </span>
    </button>
  );
}

export default QuizScreen;
