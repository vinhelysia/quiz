import { useEffect, useRef } from 'react';
import type { Quiz } from '../types/quiz';
import type { UseQuizSessionResult, QuizMode } from '../hooks/useQuizSession';
import { addScore } from '../lib/storage';
import MathText from './MathText';

interface ResultsScreenProps {
  quiz: Quiz;
  mode: QuizMode;
  session: UseQuizSessionResult;
  onRestart: () => void;
  onHome: () => void;
}

function ResultsScreen({
  quiz,
  mode,
  session,
  onRestart,
  onHome,
}: ResultsScreenProps) {
  const { questions, answers, score, total } = session;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Persist the score exactly once, even under React StrictMode double-invoke.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    addScore({
      chapterId: quiz.chapter_id,
      title: quiz.title,
      score,
      total,
      mode,
      timestamp: Date.now(),
    });
  }, [quiz, score, total, mode]);

  const headline =
    percent >= 80
      ? 'Xuất sắc!'
      : percent >= 50
        ? 'Khá tốt — hãy cố gắng thêm!'
        : 'Cần ôn lại bài nhé!';

  return (
    <div className="app">
      <div className="card score-hero">
        <h2>Kết quả</h2>
        <div style={{ marginTop: 12 }}>
          <span className="score">{score}</span>
          <span className="score-total"> / {total}</span>
        </div>
        <div className="percent">{percent}% đúng · {headline}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onRestart}>
          Làm lại
        </button>
        <button className="btn" onClick={onHome}>
          Về trang chủ
        </button>
      </div>

      <section className="card">
        <h2 className="section-title">Xem lại đáp án</h2>
        {questions.map((q, i) => {
          const yours = answers[q.id];
          const isCorrect = yours === q.correct_answer;
          return (
            <div key={q.id} className="review-item">
              <div className="review-q">
                <strong>Câu {i + 1}.</strong>{' '}
                <MathText>{q.question}</MathText>
              </div>
              <div className="review-line">
                <span>Bạn chọn:</span>
                {yours ? (
                  <span className={isCorrect ? 'ok' : 'bad'}>
                    {yours}. <MathText>{q.options[yours]}</MathText>
                  </span>
                ) : (
                  <span className="bad">(bỏ trống)</span>
                )}
              </div>
              <div className="review-line">
                <span>Đáp án đúng:</span>
                <span className="ok">
                  {q.correct_answer}.{' '}
                  <MathText>{q.options[q.correct_answer]}</MathText>
                </span>
              </div>
              <div className="review-line" style={{ marginTop: 6 }}>
                <MathText>{q.explanation}</MathText>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default ResultsScreen;
