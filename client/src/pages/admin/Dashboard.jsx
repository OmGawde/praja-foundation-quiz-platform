import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ competitions: 0, rounds: 0, quizzes: 0, teams: 0, liveQuizzes: 0 });
  const [competitions, setCompetitions] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const compRes = await api.get('/competitions');
      setCompetitions(compRes.data);
      const totalRounds = compRes.data.reduce((a, c) => a + (c.roundCount || 0), 0);
      const totalQuizzes = compRes.data.reduce((a, c) => a + (c.quizCount || 0), 0);
      const totalParticipants = compRes.data.reduce((a, c) => a + (c.participantCount || 0), 0);
      const totalLive = compRes.data.reduce((a, c) => a + (c.liveQuizCount || 0), 0);
      setStats({ competitions: compRes.data.length, rounds: totalRounds, quizzes: totalQuizzes, teams: totalParticipants, liveQuizzes: totalLive });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Welcome Back, Commander</h1>
          <p className="text-on-surface-variant mt-2 text-sm">National Quiz Championship Dashboard</p>
        </div>
        <Link to="/admin/competitions" className="gradient-primary text-on-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>New Competition
        </Link>
      </div>

      {/* Stats Bento Grid — Stitch Design 7 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow group hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Competitions</span>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          </div>
          <div className="text-4xl font-black text-on-surface font-headline tracking-tight">{stats.competitions}</div>
          <p className="text-sm text-on-surface-variant mt-1">Total tournaments</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow group hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Total Participants</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <div className="text-4xl font-black text-on-surface font-headline tracking-tight">{stats.teams.toLocaleString()}</div>
          <p className="text-sm text-on-surface-variant mt-1">Across all quizzes</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow group hover:bg-surface-container-low transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Quizzes</span>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
          </div>
          <div className="text-4xl font-black text-on-surface font-headline tracking-tight">{stats.quizzes}</div>
          <p className="text-sm text-on-surface-variant mt-1">Total quiz sessions</p>
        </div>
        <div className="gradient-primary rounded-xl p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-widest font-label">Live Now</span>
            <span className="material-symbols-outlined text-white">play_circle</span>
          </div>
          <div className="text-4xl font-black font-headline tracking-tight">{stats.liveQuizzes}</div>
          <p className="text-sm text-white/80 mt-1">Active quiz sessions</p>
        </div>
      </div>

      {/* Quick Actions — Stitch Design 7 */}
      <h2 className="text-xl font-bold text-on-surface mb-6 font-headline">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: 'add_circle', label: 'Create Competition', desc: 'Start a new national event', link: '/admin/competitions', color: 'text-primary' },
          { icon: 'upload_file', label: 'Upload Questions', desc: 'Import via Excel/CSV', link: '/admin/competitions', color: 'text-secondary' },
          { icon: 'leaderboard', label: 'View Analytics', desc: 'Performance reports', link: '/admin/analytics', color: 'text-tertiary' },
          { icon: 'settings', label: 'Settings', desc: 'Platform configuration', link: '/admin/settings', color: 'text-on-surface-variant' },
        ].map((action) => (
          <Link key={action.label} to={action.link} className="bg-surface-container-lowest rounded-xl p-6 ghost-border hover:bg-surface-container-low transition-all group cursor-pointer flex items-start gap-4">
            <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-surface-container-highest transition-colors">
              <span className={`material-symbols-outlined ${action.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">{action.label}</h3>
              <p className="text-sm text-on-surface-variant">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Competitions List */}
      <h2 className="text-xl font-bold text-on-surface mb-6 font-headline">Recent Competitions</h2>
      <div className="flex flex-col gap-4">
        {competitions.slice(0, 5).map((comp) => (
          <Link key={comp._id} to={`/admin/rounds/${comp._id}`}
            className="bg-surface-container-lowest rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ambient-shadow hover:bg-surface-container-low transition-colors group relative">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${comp.isActive ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-surface-dim text-on-surface-variant'} flex items-center gap-1`}>
                  {comp.isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>}
                  {comp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline">{comp.name}</h3>
              <p className="text-sm text-on-surface-variant">{comp.description}</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center"><p className="text-xs text-outline uppercase tracking-wider mb-1 font-label">Rounds</p><p className="font-semibold text-on-surface">{comp.roundCount}</p></div>
              <div className="text-center"><p className="text-xs text-outline uppercase tracking-wider mb-1 font-label">Teams</p><p className="font-semibold text-on-surface">{comp.participantCount}</p></div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
            </div>
          </Link>
        ))}
        {competitions.length === 0 && (
          <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/15 border-dashed">
            <span className="material-symbols-outlined text-4xl text-secondary mb-4">emoji_events</span>
            <h4 className="text-xl font-bold text-on-surface mb-2">No competitions yet</h4>
            <p className="text-on-surface-variant mb-6">Create your first competition to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
