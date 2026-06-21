import { useMemo, useRef, useState } from 'react';
import type { Difficulty, Quiz } from '../types/quiz';
import { parseQuizFile } from '../lib/quizLoader';
import { clearScoreHistory, getScoreHistory } from '../lib/storage';
import type { QuizMode, SessionOptions } from '../hooks/useQuizSession';
import type { ScoreRecord } from '../lib/storage';

interface HomeScreenProps {
  quizzes: Quiz[];
  onStart: (quiz: Quiz, options: SessionOptions) => void;
  resume: { title: string } | null;
  onResume: () => void;
  onDiscardResume: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function HomeScreen({
  quizzes,
  onStart,
  resume,
  onResume,
  onDiscardResume,
}: HomeScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(
    quizzes[0]?.chapter_id ?? '',
  );
  const [mode, setMode] = useState<QuizMode>('practice');
  const [shuffle, setShuffle] = useState(true);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [timerMinutes, setTimerMinutes] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ScoreRecord[]>(() =>
    getScoreHistory(),
  );

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => q.chapter_id === selectedId) ?? quizzes[0],
    [quizzes, selectedId],
  );

  const availableTopics = useMemo(() => {
    if (!selectedQuiz) return [] as string[];
    const set = new Set<string>();
    for (const q of selectedQuiz.questions) set.add(q.topic);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [selectedQuiz]);

  const totalQuestions = selectedQuiz?.questions.length ?? 0;

  const toggleDifficulty = (d: Difficulty) => {
    setDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const buildOptions = (): SessionOptions => {
    const minutes = Number(timerMinutes);
    return {
      mode,
      shuffle,
      difficulties: difficulties.length > 0 ? difficulties : undefined,
      topics: topics.length > 0 ? topics : undefined,
      timerSeconds:
        Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : undefined,
    };
  };

  const handleStart = () => {
    if (!selectedQuiz) return;
    onStart(selectedQuiz, buildOptions());
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportError(null);
    try {
      const quiz = await parseQuizFile(file);
      onStart(quiz, buildOptions());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Không thể tải tệp: ${msg}`);
    } finally {
      setImporting(false);
      // Reset the input so the same file can be re-selected.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearHistory = () => {
    clearScoreHistory();
    setHistory([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Trắc nghiệm Kinh tế học</h1>
          <p className="subtitle">
            Luyện tập và kiểm tra kiến thức vi mô qua {quizzes.length} chương.
          </p>
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
        <h2 className="section-title">Chọn chương</h2>
        <div className="chapter-grid">
          {quizzes.map((q) => (
            <button
              key={q.chapter_id}
              type="button"
              className={
                'chapter-card' +
                (q.chapter_id === selectedId ? ' selected' : '')
              }
              onClick={() => setSelectedId(q.chapter_id)}
              aria-pressed={q.chapter_id === selectedId}
            >
              <span className="chapter-title">{q.title}</span>
              <span className="chapter-meta">
                {q.questions.length} câu hỏi
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Tuỳ chọn làm bài</h2>
        <div className="controls-grid">
          <div className="field">
            <span className="control-label">Chế độ</span>
            <div className="seg" role="radiogroup" aria-label="Chế độ làm bài">
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="practice"
                  checked={mode === 'practice'}
                  onChange={() => setMode('practice')}
                />
                <span>Luyện tập</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="exam"
                  checked={mode === 'exam'}
                  onChange={() => setMode('exam')}
                />
                <span>Kiểm tra</span>
              </label>
            </div>
          </div>

          <div className="field">
            <span className="control-label">Trộn đáp án</span>
            <label className="check">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              <span>Trộn thứ tự câu &amp; đáp án</span>
            </label>
          </div>

          <div className="field">
            <label htmlFor="timer-input">Giới hạn thời gian (phút)</label>
            <input
              id="timer-input"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="Không giới hạn"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="control-label">Độ khó</span>
            <div className="control-row">
              {DIFFICULTIES.map((d) => (
                <label key={d} className="check">
                  <input
                    type="checkbox"
                    checked={difficulties.includes(d)}
                    onChange={() => toggleDifficulty(d)}
                  />
                  <span>{DIFFICULTY_LABELS[d]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {availableTopics.length > 0 && (
          <div className="field" style={{ marginTop: 18 }}>
            <span className="control-label">
              Chủ đề ({topics.length}/{availableTopics.length} đã chọn)
            </span>
            <div className="option-group">
              {availableTopics.map((t) => (
                <label key={t} className="check">
                  <input
                    type="checkbox"
                    checked={topics.includes(t)}
                    onChange={() => toggleTopic(t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            disabled={!selectedQuiz || totalQuestions === 0}
          >
            Bắt đầu
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {totalQuestions} câu hỏi khả dụng
          </span>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Nhập tệp quiz</h2>
        <p style={{ marginBottom: 10, color: 'var(--text-muted)' }}>
          Tải lên một tệp <code>.json</code> theo đúng định dạng chương để làm
          bài.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
          }}
          aria-label="Chọn tệp JSON quiz"
          disabled={importing}
        />
        {importError && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            {importError}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Lịch sử điểm</h2>
        {history.length === 0 ? (
          <p className="empty-state">Chưa có kết quả nào.</p>
        ) : (
          <>
            <div className="history-list">
              {history.map((h, i) => (
                <div key={`${h.timestamp}-${i}`} className="history-row">
                  <div>
                    <div className="h-title">{h.title}</div>
                    <div className="h-meta">
                      {h.mode === 'practice' ? 'Luyện tập' : 'Kiểm tra'} ·{' '}
                      {formatDate(h.timestamp)}
                    </div>
                  </div>
                  <div className="h-title">
                    {h.score}/{h.total} ({Math.round((h.score / h.total) * 100)}
                    %)
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={clearHistory}
            >
              Xoá lịch sử
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default HomeScreen;
