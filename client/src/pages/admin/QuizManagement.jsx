import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function QuizManagement() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [dupModal, setDupModal] = useState({ open: false, quizId: null, title: '' });

  useEffect(() => { loadData(); }, [roundId]);

  const loadData = async () => {
    try {
      const roundRes = await api.get(`/rounds/${roundId}`);
      setRound(roundRes.data);
      const quizRes = await api.get(`/quizzes?roundId=${roundId}`);
      setQuizzes(quizRes.data);
    } catch (err) { console.error(err); }
  };

  const createQuiz = async () => {
    navigate(`/admin/quiz/new/${roundId}`);
  };

  const openDuplicateModal = (quiz) => {
    setDupModal({ open: true, quizId: quiz._id, title: `${quiz.title} (Copy)` });
  };

  const confirmDuplicate = async () => {
    try {
      await api.post(`/quizzes/${dupModal.quizId}/duplicate`, { title: dupModal.title });
      toast.success('Quiz duplicated!');
      setDupModal({ open: false, quizId: null, title: '' });
      loadData();
    } catch (err) {
      console.error('Duplicate error:', err.response?.data || err);
      toast.error(err.response?.data?.error || 'Duplicate failed');
    }
  };

  const statusConfig = {
    lobby: { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed', label: 'Lobby', dot: 'bg-primary', dotAnimate: true },
    live: { bg: 'bg-[#dcfce7]', text: 'text-[#15803d]', label: 'Live Now', dot: 'bg-[#15803d]', dotAnimate: true, ring: 'ring-2 ring-[#15803d]/20' },
    ended: { bg: 'bg-surface-dim', text: 'text-on-surface-variant', label: 'Ended', icon: 'done_all' }
  };

  return (
    <div className="p-8 md:p-12 max-w-[1400px] mx-auto w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-medium text-on-surface-variant mb-4 uppercase tracking-wider">
        <Link to="/admin/competitions" className="hover:text-primary transition-colors">Competitions</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link to={`/admin/rounds/${round?.competitionId?._id || round?.competitionId}`} className="hover:text-primary transition-colors">{round?.competitionId?.name || 'Competition'}</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-primary font-bold">Round {round?.order}: {round?.name || '...'}</span>
      </nav>

      {/* Header — Stitch Design 10 */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black font-headline text-on-surface tracking-tight mb-2">Quiz Management</h2>
          <p className="text-lg text-on-surface-variant max-w-2xl">Oversee live sessions, manage lobbies, and prepare content for {round?.name}.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={createQuiz} className="px-6 py-3 gradient-primary text-on-primary rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">add</span>New Quiz
          </button>
        </div>
      </header>

      {/* Duplicate Rename Modal */}
      {dupModal.open && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setDupModal({ open: false, quizId: null, title: '' })}>
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-md w-full ambient-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>content_copy</span>
              <h3 className="text-xl font-bold text-on-surface">Duplicate Quiz</h3>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">New Quiz Name</label>
              <input
                value={dupModal.title}
                onChange={(e) => setDupModal({ ...dupModal, title: e.target.value })}
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface input-focus-ring text-lg font-medium"
                placeholder="Enter quiz name"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDupModal({ open: false, quizId: null, title: '' })}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold hover:bg-surface-variant transition-colors">Cancel</button>
              <button onClick={confirmDuplicate} disabled={!dupModal.title.trim()}
                className="flex-1 gradient-primary text-on-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">content_copy</span>Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Grid — Stitch Design 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {quizzes.map((quiz) => {
          const sc = statusConfig[quiz.status];
          return (
            <article key={quiz._id} className={`bg-surface-container-lowest rounded-xl p-8 flex flex-col ghost-border ambient-shadow hover:shadow-lg transition-all duration-300 relative ${quiz.status === 'ended' ? 'opacity-80 hover:opacity-100' : ''} overflow-hidden`}>
              {quiz.status === 'live' && <div className="absolute top-0 right-0 w-32 h-32 bg-[#dcfce7] rounded-full blur-[50px] -mr-16 -mt-16 opacity-50"></div>}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className={`${sc.bg} ${sc.text} rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.05em] flex items-center gap-1.5 ${sc.ring || ''}`}>
                  {sc.dot && <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.dotAnimate ? 'animate-pulse' : ''}`}></span>}
                  {sc.icon && <span className="material-symbols-outlined text-[14px]">{sc.icon}</span>}
                  {sc.label}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Join Code</span>
                  <span className={`text-2xl font-black font-headline tracking-tight bg-surface-container-low px-3 py-1 rounded-lg ${quiz.status === 'ended' ? 'text-on-surface-variant' : 'text-primary'}`}>{quiz.joinCode}</span>
                </div>
              </div>

              <div className="mb-8 flex-grow relative z-10">
                <h3 className="text-2xl font-bold text-on-surface font-headline leading-tight mb-3">{quiz.title}</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-on-surface-variant text-sm font-medium">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span>{quiz.questionCount || 0} Questions</span>
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">groups</span>{quiz.teamCount || 0} Teams</span>
                </div>
              </div>

              <div className="border-t border-surface-container-high pt-6 flex flex-col gap-3 relative z-10">
                {quiz.status === 'lobby' && (
                  <>
                    <Link to={`/admin/quiz/${quiz._id}/live`} className="w-full py-3 gradient-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
                      <span className="material-symbols-outlined">play_arrow</span>Start Quiz
                    </Link>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => openDuplicateModal(quiz)} className="py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-opacity-80 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>Duplicate
                      </button>
                      <Link to={`/admin/quiz/edit/${quiz._id}`} className="py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                      </Link>
                    </div>
                  </>
                )}
                {quiz.status === 'live' && (
                  <Link to={`/admin/quiz/${quiz._id}/live`} className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-opacity-80 transition-colors">
                    <span className="material-symbols-outlined">dashboard_customize</span>Live Dashboard
                  </Link>
                )}
                {quiz.status === 'ended' && (
                  <>
                    <Link to={`/admin/quiz/${quiz._id}/live`} className="w-full py-3 text-primary bg-surface-container-high rounded-xl font-bold hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                      <span className="material-symbols-outlined">bar_chart</span>View Results
                    </Link>
                    <button onClick={() => openDuplicateModal(quiz)} className="py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-opacity-80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>Duplicate for New Round
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="mt-12 bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/15 border-dashed">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">quiz</span>
          <h4 className="text-xl font-bold text-on-surface mb-2">No quizzes yet</h4>
          <p className="text-on-surface-variant mb-6">Create quizzes to populate this round.</p>
          <button onClick={createQuiz} className="px-6 py-2 gradient-primary text-white rounded-lg font-semibold">Create Quiz</button>
        </div>
      )}
    </div>
  );
}
