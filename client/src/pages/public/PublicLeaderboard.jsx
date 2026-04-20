import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

export default function PublicLeaderboard() {
  const { quizId } = useParams();
  const socket = useSocket();
  const [quiz, setQuiz] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [quizId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
      if (res.data.status !== 'lobby') {
         // fetch teams via API if needed, but quiz returns teams? Wait, our /quizzes/:id currently doesn't populate teams for public. 
         // Actually LiveLeaderboard calls `/quizzes/${quizId}` which might include teams if it's an admin endpoint?
         // Let's use the public teams endpoint
         const tRes = await api.get(`/teams?quizId=${quizId}`);
         setTeams(tRes.data || []);
      }
      setLoading(false);
    } catch (err) { 
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !quizId) return;
    socket.emit('adminJoinQuiz', { quizId }); // Using this to just join the socket room

    socket.on('teamJoined', (data) => setTeams(data.teams));
    socket.on('leaderboardUpdate', (data) => setTeams(data.leaderboard));
    socket.on('quizStarted', () => loadData());
    socket.on('nextQuestion', () => loadData());
    socket.on('quizEnded', () => loadData());

    return () => {
      socket.off('teamJoined');
      socket.off('leaderboardUpdate');
      socket.off('quizStarted');
      socket.off('nextQuestion');
      socket.off('quizEnded');
    };
  }, [socket, quizId]);

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center p-8"><p className="text-xl font-bold">Loading Leaderboard...</p></div>;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body">
      <nav className="w-full z-50 glass-nav shadow-sm bg-surface/85">
        <div className="flex justify-between items-center px-8 h-16 max-w-7xl mx-auto w-full">
          <Link to="/" className="text-xl font-black tracking-tight text-primary">PRAJA QUIZ</Link>
          <div className="flex items-center gap-2 bg-surface-container-high text-on-surface px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase">
             Leaderboard
          </div>
        </div>
      </nav>

      <div className="p-8 md:p-12 max-w-5xl mx-auto w-full flex-grow">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">{quiz?.title || 'Quiz Session'}</h1>
            <p className="text-on-surface-variant mt-1 text-sm flex items-center gap-2">
              Status: 
              {quiz?.status === 'lobby' && <span className="font-bold text-primary">Lobby</span>}
              {quiz?.status === 'live' && (
                <span className="px-2 py-0.5 bg-[#dcfce7] text-[#15803d] text-xs font-bold rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>Live
                </span>
              )}
              {quiz?.status === 'ended' && <span className="px-2 py-0.5 bg-surface-dim text-on-surface-variant text-xs font-bold rounded-full">Ended</span>}
            </p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow border border-outline-variant/30">
          <div className="p-6 pb-4 flex justify-between items-center">
            <h3 className="text-lg font-bold font-headline text-on-surface">
              {quiz?.status === 'ended' ? 'Final Standings' : 'Current Standings'}
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
                  <th className="p-4 font-medium text-center">Time (ms)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface font-medium divide-y divide-surface-container-low">
                {teams.map((team, idx) => (
                  <tr key={team._id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-primary-container text-on-primary' : idx === 1 ? 'bg-secondary-container text-on-secondary-container' : idx === 2 ? 'bg-tertiary-container text-on-tertiary' : 'bg-surface-variant text-on-surface'
                      }`}>{idx + 1}</div>
                    </td>
                    <td className="p-4 font-bold text-on-surface">{team.teamName}</td>
                    <td className="p-4 text-on-surface-variant">{team.institute}</td>
                    <td className="p-4 text-center font-bold text-primary">{team.score || 0}</td>
                    <td className="p-4 text-center text-on-surface-variant">{(team.totalResponseTime || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No teams registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
