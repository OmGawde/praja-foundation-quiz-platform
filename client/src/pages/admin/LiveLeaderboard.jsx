import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function LiveLeaderboard() {
  const { quizId } = useParams();
  const socket = useSocket();
  const [quiz, setQuiz] = useState(null);
  const [teams, setTeams] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => { loadData(); }, [quizId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
      setTeams(res.data.teams || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!socket || !quizId) return;
    socket.emit('adminJoinQuiz', { quizId });

    socket.on('teamJoined', (data) => setTeams(data.teams));
    socket.on('leaderboardUpdate', (data) => setTeams(data.leaderboard));
    socket.on('quizStarted', (data) => {
      setCurrentQuestion(data.question);
      loadData();
    });
    socket.on('nextQuestion', (data) => {
      setCurrentQuestion(data.question);
      loadData();
    });
    socket.on('quizEnded', () => {
      toast.success('Quiz ended!');
      loadData();
    });

    return () => {
      socket.off('teamJoined');
      socket.off('leaderboardUpdate');
      socket.off('quizStarted');
      socket.off('nextQuestion');
      socket.off('quizEnded');
    };
  }, [socket, quizId]);

  const handleStart = () => {
    if (!socket) return;
    socket.emit('startQuiz', { quizId });
  };

  const handleEnd = () => {
    if (!confirm('End this quiz?')) return;
    if (!socket) return;
    socket.emit('forceEndQuiz', { quizId });
  };

  const removeTeam = async (teamId) => {
    try {
      await api.patch(`/teams/${teamId}/remove`);
      toast.success('Team removed');
      loadData();
    } catch (err) { toast.error('Failed'); }
  };

  const downloadCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/csv/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `quiz_${quizId}.csv`; a.click();
    } catch (err) { toast.error('CSV download failed'); }
  };

  const totalCorrect = teams.reduce((a, t) => a + (t.correctAnswers || 0), 0);
  const totalTime = teams.reduce((a, t) => a + (t.totalResponseTime || 0), 0);
  const avgTime = teams.length > 0 && totalCorrect > 0 ? (totalTime / totalCorrect / 1000).toFixed(1) : '0';

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">{quiz?.title || 'Quiz'}</h1>
            <p className="text-on-surface-variant mt-1 text-sm flex items-center gap-2">
              Join Code: <span className="font-bold text-accent">{quiz?.joinCode}</span>
              {quiz?.status === 'live' && (
                <span className="ml-2 px-2 py-0.5 bg-[#dcfce7] text-[#15803d] text-xs font-bold rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>Live
                </span>
              )}
              {quiz?.status === 'ended' && <span className="ml-2 px-2 py-0.5 bg-surface-dim text-on-surface-variant text-xs font-bold rounded-full">Ended</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadCSV} className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-surface-dim transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>CSV
          </button>
          {quiz?.status === 'lobby' && (
            <button onClick={handleStart} className="px-6 py-2 gradient-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90">
              <span className="material-symbols-outlined">play_arrow</span>Start Quiz
            </button>
          )}
          {quiz?.status === 'live' && (
              <button onClick={handleEnd} className="px-4 py-2 bg-error-container text-error rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-error/10">
                <span className="material-symbols-outlined text-[18px]">stop</span>End
              </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Teams</span>
          <div className="text-3xl font-black text-on-surface mt-1">{teams.length}</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Questions</span>
          <div className="text-3xl font-black text-on-surface mt-1">{quiz?.questionCount || 0}</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Avg Response</span>
          <div className="text-3xl font-black text-on-surface mt-1">{avgTime}s</div>
        </div>
      </div>

      {/* Leaderboard Table — Stitch Design 5 */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow">
        <div className="p-6 pb-4 flex justify-between items-center">
          <h3 className="text-lg font-bold font-headline text-on-surface">
            {quiz?.status === 'ended' ? 'Final Results' : 'Live Leaderboard'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium w-16">Rank</th>
                <th className="p-4 font-medium">Team Name</th>
                <th className="p-4 font-medium">Institute</th>
                <th className="p-4 font-medium text-center">Score</th>
                <th className="p-4 font-medium text-center">Correct</th>
                <th className="p-4 font-medium text-center">Time (ms)</th>
                <th className="p-4 pr-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface font-medium divide-y divide-surface-container-low">
              {teams.map((team, idx) => (
                <tr key={team._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-primary-container text-on-primary' : idx === 1 ? 'bg-secondary-container text-on-secondary-container' : idx === 2 ? 'bg-tertiary-container text-on-tertiary' : 'bg-surface-variant text-on-surface'
                    }`}>{idx + 1}</div>
                  </td>
                  <td className="p-4 font-bold text-on-surface">{team.teamName}</td>
                  <td className="p-4 text-on-surface-variant">{team.institute}</td>
                  <td className="p-4 text-center font-bold text-primary">{team.score || 0}</td>
                  <td className="p-4 text-center text-[#15803d] font-bold">{team.correctAnswers || 0}</td>
                  <td className="p-4 text-center text-on-surface-variant">{(team.totalResponseTime || 0).toLocaleString()}</td>
                  <td className="p-4 pr-6 text-right">
                    {quiz?.status !== 'ended' && (
                      <button onClick={() => removeTeam(team._id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-on-surface-variant">No teams registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
