import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Archives() {
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadArchives(); }, []);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competitions?archived=true');
      setArchives(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/competitions/${id}/archive`);
      toast.success('Competition restored to active');
      loadArchives();
    } catch (err) { toast.error('Restore failed'); }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await api.delete(`/competitions/${id}`);
      toast.success('Competition permanently deleted');
      setDeleteTarget(null);
      loadArchives();
    } catch (err) { toast.error('Delete failed'); }
  };

  const downloadCSV = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/csv/competition/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `archive_${id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error('CSV download failed'); }
  };

  const getDaysRemaining = (completedAt) => {
    if (!completedAt) return null;
    const deleteDate = new Date(completedAt);
    deleteDate.setFullYear(deleteDate.getFullYear() + 1);
    const remaining = Math.ceil((deleteDate - new Date()) / (1000 * 60 * 60 * 24));
    return remaining;
  };

  const filtered = archives.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight font-headline">Archives</h2>
          <p className="text-on-surface-variant mt-2 text-sm font-body">Past competitions preserved for records. Auto-deleted after 1 year.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/40 w-64" placeholder="Search archives..." />
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-5 mb-8 flex items-start gap-4">
        <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <div>
          <p className="text-sm font-semibold text-on-surface mb-1">Automatic Cleanup Policy</p>
          <p className="text-sm text-on-surface-variant">Archived competitions are automatically deleted <strong className="text-on-surface">1 year</strong> after their completion date. You can also delete them permanently at any time, or restore them back to active competitions.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Archived</span>
            <span className="material-symbols-outlined text-on-surface-variant">inventory_2</span>
          </div>
          <div className="text-4xl font-bold text-on-surface font-headline tracking-tight">{archives.length}</div>
          <p className="text-sm text-on-surface-variant mt-1">Total archived competitions</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Participants</span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <div className="text-4xl font-bold text-on-surface font-headline tracking-tight">
            {archives.reduce((a, c) => a + (c.participantCount || 0), 0).toLocaleString()}
          </div>
          <p className="text-sm text-on-surface-variant mt-1">Across all archived events</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Quizzes Played</span>
            <span className="material-symbols-outlined text-primary">quiz</span>
          </div>
          <div className="text-4xl font-bold text-on-surface font-headline tracking-tight">
            {archives.reduce((a, c) => a + (c.quizCount || 0), 0)}
          </div>
          <p className="text-sm text-on-surface-variant mt-1">Total completed quizzes</p>
        </div>
      </div>

      {/* Archives Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-primary text-lg font-semibold animate-pulse">Loading archives...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/15 border-dashed">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">inventory_2</span>
          <h4 className="text-xl font-bold text-on-surface mb-2">No archived competitions</h4>
          <p className="text-on-surface-variant">
            {search ? 'No results match your search.' : 'Completed competitions will appear here once archived.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6 font-medium">Competition</th>
                  <th className="p-4 font-medium text-center">Dates</th>
                  <th className="p-4 font-medium text-center">Rounds</th>
                  <th className="p-4 font-medium text-center">Quizzes</th>
                  <th className="p-4 font-medium text-center">Participants</th>
                  <th className="p-4 font-medium text-center">Auto-Delete In</th>
                  <th className="p-4 pr-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface font-medium divide-y divide-surface-container-low">
                {filtered.map((comp) => {
                  const daysLeft = getDaysRemaining(comp.completedAt);
                  return (
                    <tr key={comp._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-on-surface">{comp.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{comp.description}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs">
                        <div>{new Date(comp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-on-surface-variant">to {new Date(comp.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>
                      <td className="p-4 text-center">{comp.roundCount}</td>
                      <td className="p-4 text-center">{comp.quizCount}</td>
                      <td className="p-4 text-center font-bold text-primary">{comp.participantCount}</td>
                      <td className="p-4 text-center">
                        {daysLeft !== null ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            daysLeft <= 30 ? 'bg-[#fee2e2] text-[#dc2626]' :
                            daysLeft <= 90 ? 'bg-[#fef3c7] text-[#d97706]' :
                            'bg-surface-dim text-on-surface-variant'
                          }`}>
                            {daysLeft <= 0 ? 'Pending cleanup' : `${daysLeft} days`}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => downloadCSV(comp._id)} title="Download CSV"
                            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">download</span>
                          </button>
                          <button onClick={() => handleRestore(comp._id)} title="Restore to Active"
                            className="p-2 text-on-surface-variant hover:bg-primary-fixed hover:text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">unarchive</span>
                          </button>
                          <button onClick={() => setDeleteTarget(comp)} title="Delete Permanently"
                            className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">delete_forever</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-md w-full ambient-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Permanent Deletion</h3>
            </div>
            <p className="text-on-surface-variant mb-2">
              You are about to permanently delete <strong className="text-on-surface">{deleteTarget.name}</strong>.
            </p>
            <p className="text-sm text-on-surface-variant mb-6">
              This will remove all related rounds, quizzes, questions, teams, and answers from the database. <strong className="text-error">This action cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold hover:bg-surface-variant transition-colors">
                Cancel
              </button>
              <button onClick={() => handlePermanentDelete(deleteTarget._id)}
                className="flex-1 py-3 bg-error text-white rounded-xl font-semibold hover:bg-error/90 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
