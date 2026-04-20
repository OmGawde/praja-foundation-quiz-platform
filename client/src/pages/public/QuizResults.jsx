import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function QuizResults() {
  const { quizId, teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data)).catch(() => {});
    api.get(`/teams?quizId=${quizId}`).then(r => setTeams(r.data)).catch(() => {});
    api.get(`/quizzes/${quizId}`).then(r => setQuiz(r.data)).catch(() => {});
  }, [quizId, teamId]);

  const rank = teams.findIndex(t => t._id === teamId) + 1;
  const totalQ = (team?.correctAnswers || 0) + (team?.incorrectAnswers || 0) + (team?.unattempted || 0);
  const accuracy = totalQ > 0 ? Math.round((team?.correctAnswers / totalQ) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body antialiased">
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-30">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary-fixed to-transparent blur-[100px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-12 mt-16 md:mt-0">
          {/* Header */}
          <header className="text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center ambient-shadow mb-2 relative ghost-border">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <span className="material-symbols-outlined absolute -top-2 -right-2 text-2xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline">Quiz Complete!</h1>
              <p className="text-lg md:text-xl text-on-surface-variant font-medium">{quiz?.title || 'Quiz Session'}</p>
            </div>
          </header>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Score */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center justify-between ambient-shadow ghost-border relative overflow-hidden group">
              <div className="relative z-10 flex flex-col space-y-1 mb-6 md:mb-0 text-center md:text-left">
                <span className="text-sm uppercase tracking-widest text-on-surface-variant font-bold font-label">Final Score</span>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-6xl md:text-8xl font-black tracking-tighter text-primary font-headline">{team?.score || 0}</span>
                  <span className="text-2xl text-on-surface-variant font-medium">pts</span>
                </div>
              </div>
              <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl min-w-[160px] ghost-border">
                <span className="text-sm uppercase tracking-widest text-on-surface-variant font-bold font-label mb-2">Rank</span>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-secondary font-headline">#{rank || '—'}</span>
                  {rank <= 3 && <span className="material-symbols-outlined text-green-600 text-2xl">trending_up</span>}
                </div>
              </div>
            </div>

            {/* Accuracy */}
            <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center justify-center ambient-shadow ghost-border relative">
              <span className="text-sm uppercase tracking-widest text-on-surface-variant font-bold font-label mb-6">Accuracy</span>
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-surface-container-high mb-6 ghost-border">
                <div className="absolute inset-3 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center z-10 ghost-border">
                  <span className="text-2xl font-bold text-on-surface font-headline">{accuracy}%</span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="md:col-span-3 bg-surface-container-low rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-around ghost-border">
              <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg flex-1 ambient-shadow ghost-border">
                <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#15803d]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-on-surface font-headline">{team?.correctAnswers || 0}</span>
                  <span className="text-sm uppercase tracking-wider text-on-surface-variant font-medium font-label">Correct</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg flex-1 ambient-shadow ghost-border">
                <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-on-surface font-headline">{team?.incorrectAnswers || 0}</span>
                  <span className="text-sm uppercase tracking-wider text-on-surface-variant font-medium font-label">Incorrect</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg flex-1 ambient-shadow ghost-border">
                <div className="w-12 h-12 rounded-full bg-surface-dim flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>remove</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-on-surface font-headline">{team?.unattempted || 0}</span>
                  <span className="text-sm uppercase tracking-wider text-on-surface-variant font-medium font-label">Unattempted</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full mt-4">
            <button onClick={() => navigate(`/results/${quizId}/${teamId}/review`)} className="bg-surface-container-high text-on-surface py-4 px-8 font-bold text-lg rounded-xl w-full sm:w-auto shadow-sm hover:bg-surface-dim transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">plagiarism</span>Review Answers
            </button>
            <button onClick={() => navigate('/')} className="gradient-primary text-white py-4 px-8 font-bold text-lg rounded-xl w-full sm:w-auto shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">home</span>Return to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
