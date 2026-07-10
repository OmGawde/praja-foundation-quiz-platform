import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [competitions, setCompetitions] = useState([]);
  const [stats, setStats] = useState({ participants: 0, accuracy: 0, avgTime: 0 });
  const [overallAnalytics, setOverallAnalytics] = useState({ accuracyTrend: [], avgAccuracy: 0, avgResponseTime: 0 });
  const [expandedCompId, setExpandedCompId] = useState(null);
  const [compAnalytics, setCompAnalytics] = useState(null);
  const [loadingComp, setLoadingComp] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/competitions');
      setCompetitions(res.data);
      const totalP = res.data.reduce((a, c) => a + (c.participantCount || 0), 0);

      // Fetch dynamic overall analytics from backend
      const overallRes = await api.get('/competitions/overall/analytics');
      setOverallAnalytics(overallRes.data);

      setStats({
        participants: totalP,
        accuracy: overallRes.data.avgAccuracy,
        avgTime: overallRes.data.avgResponseTime
      });
    } catch (err) { console.error(err); }
  };

  const handleRowClick = async (compId) => {
    if (expandedCompId === compId) {
      setExpandedCompId(null);
      setCompAnalytics(null);
      return;
    }
    setExpandedCompId(compId);
    setLoadingComp(true);
    try {
      const res = await api.get(`/competitions/${compId}/analytics`);
      setCompAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to load competition metrics');
    } finally {
      setLoadingComp(false);
    }
  };

  const downloadCSV = async (compId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/csv/competition/${compId}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `analytics_${compId}.csv`; a.click();
    } catch (err) { toast.error('Download failed'); }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Dashboard</h2>
          <p className="text-on-surface-variant text-sm mt-1">National Quiz Championship Overview</p>
        </div>
        {competitions.length > 0 && (
          <button onClick={() => downloadCSV(competitions[0]._id)} className="px-6 py-3 bg-surface-container-highest hover:bg-surface-dim text-on-surface rounded-xl font-medium flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>Download CSV
          </button>
        )}
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wide">Total Participants</span>
          <span className="text-4xl font-black font-headline text-on-surface tracking-tight">{stats.participants.toLocaleString()}</span>
          <span className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>Across all events
          </span>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wide">Avg. Accuracy</span>
          <span className="text-4xl font-black font-headline text-on-surface tracking-tight">{stats.accuracy}%</span>
          <span className="text-xs text-on-surface-variant font-medium mt-1">Real-time statistics</span>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wide">Avg. Response Time</span>
          <span className="text-4xl font-black font-headline text-on-surface tracking-tight">{stats.avgTime}s</span>
          <span className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">timer</span>Speed of answers
          </span>
        </div>
      </div>

      {/* Main Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Dynamic Question-Wise Accuracy */}
        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline text-on-surface">Question-Wise Accuracy</h3>
              <p className="text-xs text-on-surface-variant">Overall average success rate across all rounds</p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">query_stats</span>
          </div>
          <div className="flex-grow flex items-end gap-3 h-48 pl-2">
            {overallAnalytics.accuracyTrend.length === 0 ? (
              <div className="w-full text-center text-sm text-on-surface-variant/60 py-12">No accuracy data recorded yet</div>
            ) : (
              overallAnalytics.accuracyTrend.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative">
                  {/* Tooltip */}
                  <span className="absolute -top-8 bg-surface-container-highest text-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">{item.accuracy}%</span>
                  <div className="w-full bg-surface-container-highest rounded-t-md h-36 flex items-end overflow-hidden relative shadow-inner">
                    <div className="w-full bg-primary rounded-t-md transition-all duration-300 group-hover:opacity-80" style={{ height: `${item.accuracy}%` }}></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-semibold mt-1">{item.label}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Teams Participated */}
        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-headline text-on-surface">Teams Participated</h3>
              <p className="text-xs text-on-surface-variant">Top events by active registration</p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
          </div>
          <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-48 pr-2">
            {competitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60">
                <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                <p className="text-sm font-medium">No competition data available yet</p>
              </div>
            ) : (
              competitions.slice(0, 4).map((comp, idx) => {
                const maxVal = Math.max(...competitions.map(c => c.participantCount || 0), 1);
                const percent = Math.min(100, Math.max(10, Math.round(((comp.participantCount || 0) / maxVal) * 100)));
                const gradients = [
                  'from-blue-500 to-indigo-600',
                  'from-emerald-400 to-teal-600',
                  'from-amber-400 to-orange-500',
                  'from-pink-500 to-rose-600'
                ];
                const gradientClass = gradients[idx % gradients.length];
                
                return (
                  <div key={comp._id} className="flex flex-col gap-1.5 group">
                    <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                      <span className="truncate max-w-[240px] text-on-surface">{comp.name}</span>
                      <span className="font-bold text-primary">{comp.participantCount || 0} teams</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden shadow-inner relative">
                      <div 
                        className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Advanced Data Insights */}
      <div className="bg-surface-container-low rounded-xl p-6 mb-8 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>System Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-4 rounded-lg ghost-border flex items-center justify-between">
            <div>
              <span className="text-xs text-on-surface-variant font-medium uppercase">Active Competitions</span>
              <p className="text-2xl font-bold text-on-surface mt-1">{competitions.filter(c => c.isActive).length}</p>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">local_fire_department</span>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-lg ghost-border flex items-center justify-between">
            <div>
              <span className="text-xs text-on-surface-variant font-medium uppercase">Total Quizzes Hosted</span>
              <p className="text-2xl font-bold text-on-surface mt-1">{competitions.reduce((a, c) => a + (c.quizCount || 0), 0)}</p>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-lg ghost-border flex items-center justify-between">
            <div>
              <span className="text-xs text-on-surface-variant font-medium uppercase">Quiz Completion Rate</span>
              <p className="text-2xl font-bold text-[#15803d] mt-1">94.2%</p>
            </div>
            <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
          </div>
        </div>
      </div>

      {/* Competition Reports with dropdown analytics */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-bold font-headline text-on-surface">Competition Reports</h3>
          <p className="text-sm text-on-surface-variant mt-1">Click on a competition to view its dynamic graphical analytics (accuracy, response times, teams).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-sm font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Competition</th>
                <th className="p-4 font-medium text-center">Rounds</th>
                <th className="p-4 font-medium text-center">Quizzes</th>
                <th className="p-4 font-medium text-center">Participants</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 pr-6 font-medium text-right">Export</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface font-medium divide-y divide-surface-container-low">
              {competitions.map((comp) => (
                <tr key={comp._id} className="contents">
                  <tr 
                    onClick={() => handleRowClick(comp._id)} 
                    className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer border-b border-surface-container-low ${expandedCompId === comp._id ? 'bg-surface-container-low/30' : ''}`}
                  >
                    <td className="p-4 pl-6 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: expandedCompId === comp._id ? 'rotate(90deg)' : 'rotate(0)' }}>
                        chevron_right
                      </span>
                      {comp.name}
                    </td>
                    <td className="p-4 text-center">{comp.roundCount}</td>
                    <td className="p-4 text-center">{comp.quizCount}</td>
                    <td className="p-4 text-center font-bold text-primary">{comp.participantCount}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${comp.isActive ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-surface-dim text-on-surface-variant'}`}>
                        {comp.isActive ? 'Active' : 'Ended'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => downloadCSV(comp._id)} className="text-primary hover:text-primary-container transition-colors p-1">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Specific Graphics Drop section */}
                  {expandedCompId === comp._id && (
                    <tr className="bg-surface-container-low/20">
                      <td colSpan="6" className="p-6 border-b border-surface-container-low">
                        {loadingComp ? (
                          <div className="flex justify-center py-6 text-primary font-bold">Loading competition metrics...</div>
                        ) : !compAnalytics || compAnalytics.questions?.length === 0 ? (
                          <div className="text-center py-6 text-on-surface-variant/75 font-semibold">No questions or quiz entries found for this competition. Make sure quizzes are active and answers have been recorded.</div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                            
                            {/* Graphic 1: Specific Question Accuracy */}
                            <div className="bg-surface-container-lowest rounded-lg p-5 ghost-border">
                              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-primary text-base">query_stats</span>Question-wise Accuracy
                              </h4>
                              <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                                {compAnalytics.questions.map((q, idx) => (
                                  <div key={q._id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                                      <span className="truncate max-w-[180px] text-on-surface">Q{idx + 1}: {q.questionText}</span>
                                      <span className="text-primary font-bold">{q.accuracy}%</span>
                                    </div>
                                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${q.accuracy}%` }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Graphic 2: Specific Question Average Time */}
                            <div className="bg-surface-container-lowest rounded-lg p-5 ghost-border">
                              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-primary text-base">timer</span>Avg. Time per Question
                              </h4>
                              <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                                {compAnalytics.questions.map((q, idx) => (
                                  <div key={q._id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                                      <span className="truncate max-w-[180px] text-on-surface">Q{idx + 1}: {q.questionText}</span>
                                      <span className="text-amber-600 font-bold">{q.avgTime}s</span>
                                    </div>
                                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                      {/* Scaled compared to a default 30s limit */}
                                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, Math.round((q.avgTime / 30) * 100))}%` }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Graphic 3: Teams leaderboard */}
                            <div className="bg-surface-container-lowest rounded-lg p-5 ghost-border">
                              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-primary text-base">emoji_events</span>Participating Teams
                              </h4>
                              <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-1">
                                {compAnalytics.teams.length === 0 ? (
                                  <div className="text-center text-xs text-on-surface-variant py-8">No registered teams yet</div>
                                ) : (
                                  compAnalytics.teams.map((t, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-surface-container-low rounded-md">
                                      <div className="truncate max-w-[140px] font-bold text-on-surface">{idx + 1}. {t.teamName}</div>
                                      <div className="flex gap-2 text-[10px] text-on-surface-variant font-medium">
                                        <span className="text-emerald-600 font-bold">{t.correctAnswers} Correct</span>
                                        <span>&bull;</span>
                                        <span className="font-bold text-primary">{t.score} pts</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
