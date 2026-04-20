import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCompetitions(); }, []);

  const loadCompetitions = async () => {
    try {
      const res = await api.get('/competitions');
      setCompetitions(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/competitions', form);
      toast.success('Competition created!');
      setShowCreate(false);
      setForm({ name: '', description: '', startDate: '', endDate: '' });
      loadCompetitions();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleArchive = async (id) => {
    try {
      await api.patch(`/competitions/${id}/archive`);
      toast.success('Archive toggled');
      loadCompetitions();
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this competition?')) return;
    try {
      await api.delete(`/competitions/${id}`);
      toast.success('Deleted');
      loadCompetitions();
    } catch (err) { toast.error('Failed'); }
  };

  const downloadCSV = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/csv/competition/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `competition_${id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error('CSV download failed'); }
  };

  const filtered = competitions.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const active = filtered.filter(c => c.isActive && !c.isArchived);
  const totalParticipants = competitions.reduce((a, c) => a + (c.participantCount || 0), 0);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      {/* Header — Stitch Design 8 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight font-headline">National Competitions</h2>
          <p className="text-on-surface-variant mt-2 text-sm font-body">Manage active tournaments, regional rounds, and overall progress.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/40 w-64" placeholder="Search competitions..." />
          </div>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Active Now</span>
            <span className="material-symbols-outlined text-primary">play_circle</span>
          </div>
          <div className="text-4xl font-bold text-on-surface font-headline tracking-tight">{active.length}</div>
          <p className="text-sm text-on-surface-variant mt-1">Live national events</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest font-label">Total Participants</span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <div className="text-4xl font-bold text-on-surface font-headline tracking-tight">{totalParticipants.toLocaleString()}</div>
          <p className="text-sm text-on-surface-variant mt-1">Across all active rounds</p>
        </div>
        <div className="gradient-primary rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-widest font-label">Quick Action</span>
            <span className="material-symbols-outlined text-white">notification_important</span>
          </div>
          <button onClick={() => setShowCreate(true)} className="text-2xl font-bold font-headline text-left hover:underline">+ Create Competition</button>
          <p className="text-sm text-white/80 mt-1">Start a new tournament</p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-lg w-full ambient-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-on-surface mb-6">Create Competition</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Competition Name"
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface input-focus-ring" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description"
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface input-focus-ring resize-none h-20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                    className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2 text-on-surface input-focus-ring" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                    className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2 text-on-surface input-focus-ring" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold hover:bg-surface-variant transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 gradient-primary text-on-primary py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Competition Cards — Stitch Design 8 */}
      <div className="flex flex-col gap-6">
        {filtered.map((comp) => (
          <div key={comp._id} className="bg-surface-container-lowest rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative group ambient-shadow hover:bg-surface-container-low transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1 ${
                  comp.isArchived ? 'bg-surface-dim text-on-surface-variant' :
                  comp.liveQuizCount > 0 ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-primary-fixed text-on-primary-fixed'
                }`}>
                  {comp.liveQuizCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>}
                  {comp.isArchived ? 'Archived' : comp.liveQuizCount > 0 ? 'Live' : 'Active'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline mb-1">{comp.name}</h3>
              <p className="text-sm text-on-surface-variant">{comp.description}</p>
            </div>
            <div className="flex items-center gap-8 md:px-8">
              <div><p className="text-xs text-outline uppercase tracking-wider mb-1 font-label">Rounds</p><p className="font-semibold text-on-surface">{comp.roundCount}</p></div>
              <div><p className="text-xs text-outline uppercase tracking-wider mb-1 font-label">Started</p><p className="font-semibold text-on-surface">{new Date(comp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
              <div><p className="text-xs text-outline uppercase tracking-wider mb-1 font-label">Participants</p><p className="font-semibold text-on-surface">{(comp.participantCount || 0).toLocaleString()}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => downloadCSV(comp._id)} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">download</span>
              </button>
              <button onClick={() => handleArchive(comp._id)} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">archive</span>
              </button>
              <button onClick={() => handleDelete(comp._id)} className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
              <Link to={`/admin/rounds/${comp._id}`} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-secondary-container/80 transition-colors">
                Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
