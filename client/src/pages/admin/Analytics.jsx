import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [competitions, setCompetitions] = useState([]);
  const [stats, setStats] = useState({ participants: 0, accuracy: 0, avgTime: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/competitions');
      setCompetitions(res.data);
      const totalP = res.data.reduce((a, c) => a + (c.participantCount || 0), 0);
      setStats({ participants: totalP, accuracy: 68.5, avgTime: 4.2 });
    } catch (err) { console.error(err); }
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
      {/* Header — Stitch Design 12 */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Analytics Overview</h2>
          <p className="text-on-surface-variant text-sm mt-1">National Quiz Championship Performance</p>
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
          <span className="text-xs text-on-surface-variant font-medium mt-1">Target: 70%</span>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col gap-2">
          <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wide">Avg. Response Time</span>
          <span className="text-4xl font-black font-headline text-on-surface tracking-tight">{stats.avgTime}s</span>
          <span className="text-xs text-error font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_down</span>Improving
          </span>
        </div>
      </div>

      {/* Chart Placeholders — Stitch Design 12 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline text-on-surface">Accuracy Distribution</h3>
          </div>
          <div className="flex-grow flex items-end gap-3 h-48 pl-2">
            {[40, 65, 55, 85, 70, 90, 75, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-md transition-all duration-300 hover:opacity-80 ${i === 3 ? 'bg-primary' : 'bg-secondary-container hover:bg-secondary'}`} style={{ height: `${h}%` }}></div>
                <span className="text-[10px] text-on-surface-variant">Q{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline text-on-surface">Response Time Trend</h3>
            <span className="material-symbols-outlined text-on-surface-variant">timer</span>
          </div>
          <div className="flex-grow flex items-center justify-center h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0 80 Q 25 50 50 60 T 100 20" fill="none" stroke="#0c5fae" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {[{ x: 0, y: 80 }, { x: 25, y: 50 }, { x: 50, y: 60 }, { x: 75, y: 40 }, { x: 100, y: 20 }].map((p, i) => (
              <div key={i} className={`absolute w-3 h-3 rounded-full border-2 border-primary ${i === 4 ? 'bg-primary ring-4 ring-primary-fixed' : 'bg-surface'}`}
                style={{ left: `${p.x}%`, bottom: `${100 - p.y}%`, transform: 'translate(-50%, 50%)' }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Competition Reports */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-bold font-headline text-on-surface">Competition Reports</h3>
          <p className="text-sm text-on-surface-variant mt-1">Download detailed reports for each competition.</p>
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
                <tr key={comp._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-4 pl-6 font-bold">{comp.name}</td>
                  <td className="p-4 text-center">{comp.roundCount}</td>
                  <td className="p-4 text-center">{comp.quizCount}</td>
                  <td className="p-4 text-center font-bold text-primary">{comp.participantCount}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${comp.isActive ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-surface-dim text-on-surface-variant'}`}>
                      {comp.isActive ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button onClick={() => downloadCSV(comp._id)} className="text-primary hover:text-primary-container transition-colors p-1">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
