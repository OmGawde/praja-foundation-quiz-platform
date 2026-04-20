import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

export default function QuizLobby() {
  const { quizId, teamId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get(`/quizzes/${quizId}`).then(r => setQuiz(r.data)).catch(() => {});
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data)).catch(() => {});
  }, [quizId, teamId]);

  useEffect(() => {
    if (!socket || !quizId || !teamId) return;
    socket.emit('joinQuiz', { quizId, teamId });

    socket.on('teamJoined', (data) => setTeams(data.teams));
    socket.on('quizStarted', () => navigate(`/play/${quizId}/${teamId}`));
    socket.on('teamRemoved', (data) => {
      if (data.teamId === teamId) navigate('/');
      else setTeams(prev => prev.filter(t => t._id !== data.teamId));
    });

    return () => {
      socket.off('teamJoined');
      socket.off('quizStarted');
      socket.off('teamRemoved');
    };
  }, [socket, quizId, teamId]);

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col">
      {/* Minimal Nav */}
      <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm" style={{ backgroundColor: 'rgba(246, 249, 255, 0.85)' }}>
        <div className="flex justify-between items-center px-8 h-16 max-w-full mx-auto">
          <div className="text-xl font-black tracking-tight text-primary">PRAJA QUIZ</div>
          <div className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>Lobby
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Status */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] ambient-shadow">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-fixed rounded-full blur-3xl opacity-40 pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary-container rounded-full blur-3xl opacity-20 pointer-events-none"></div>

            <div className="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase mb-8 z-10 shadow-sm inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>Lobby
            </div>
            <div className="text-center z-10">
              <h2 className="text-outline font-medium tracking-wide uppercase text-sm mb-2">Team Name</h2>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-8 tracking-tight">{team?.teamName || '...'}</h1>
            </div>
            <div className="flex items-baseline justify-center gap-4 z-10">
              <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
            </div>
            <div className="mt-8 text-center z-10">
              <p className="text-lg font-medium text-on-surface-variant flex items-center gap-2 justify-center">
                Waiting for host to start...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-surface-container-low rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">{quiz?.title || 'Loading...'}</h3>
                <p className="text-sm text-on-surface-variant">Quiz Session</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">{teams.length} Teams Connected</h3>
                <p className="text-sm text-on-surface-variant">Waiting in lobby</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Instructions & Code */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 ambient-shadow">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              <h2 className="text-xl font-bold text-on-surface">Quiz Instructions</h2>
            </div>
            <div className="flex flex-col gap-5">
              {['Ensure a stable internet connection.', 'Each question has a strict time limit.', 'No external devices or multiple tabs.', 'Only one answer per question allowed.'].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-primary font-bold w-6 shrink-0">{i + 1}.</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-8 flex flex-col items-center justify-center border border-outline-variant/15 ambient-shadow">
            <span className="text-xs font-bold uppercase tracking-widest text-outline mb-3">Your Join Code</span>
            <div className="text-4xl font-black text-accent tracking-wider font-mono">{quiz?.joinCode || '...'}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
