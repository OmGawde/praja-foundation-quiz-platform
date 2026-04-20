import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Rounds() {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');

  useEffect(() => { loadData(); }, [competitionId]);

  const loadData = async () => {
    try {
      const compRes = await api.get(`/competitions/${competitionId}`);
      setCompetition(compRes.data);
      const roundRes = await api.get(`/rounds?competitionId=${competitionId}`);
      setRounds(roundRes.data);
    } catch (err) { console.error(err); }
  };

  const createRound = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rounds', { competitionId, name: newRoundName });
      toast.success('Round created!');
      setShowCreate(false);
      setNewRoundName('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteRound = async (id) => {
    if (!confirm('Delete this round?')) return;
    try {
      await api.delete(`/rounds/${id}`);
      toast.success('Deleted');
      loadData();
    } catch (err) { toast.error('Failed'); }
  };

  const statusColors = { live: 'bg-[#dcfce7] text-[#15803d]', completed: 'bg-surface-dim text-on-surface-variant', draft: 'bg-surface-variant text-on-surface-variant' };
  const edgeColors = { live: 'bg-green-500', completed: 'bg-secondary', draft: 'bg-outline-variant' };

  const getRoundStatus = (r) => {
    if (r.liveQuizCount > 0) return 'live';
    if (r.quizCount > 0 && r.participantCount > 0) return 'completed';
    return 'draft';
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto w-full">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-on-surface-variant mb-6 font-medium">
        <Link to="/admin/competitions" className="hover:text-primary transition-colors">Competitions</Link>
        <span className="material-symbols-outlined text-sm mx-1 text-outline">chevron_right</span>
        <span className="text-on-surface font-semibold">{competition?.name || '...'}</span>
        <span className="material-symbols-outlined text-sm mx-1 text-outline">chevron_right</span>
        <span className="text-on-surface font-semibold">Rounds</span>
      </nav>

      {/* Header — Stitch Design 9 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-headline font-black tracking-tight text-on-surface mb-2">Round Management</h2>
          <p className="text-lg text-on-surface-variant max-w-2xl">Configure the progression stages for {competition?.name}.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">add</span>Add Round
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-md w-full ambient-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-on-surface mb-6">Create New Round</h3>
            <form onSubmit={createRound} className="space-y-4">
              <input value={newRoundName} onChange={(e) => setNewRoundName(e.target.value)} required placeholder="Round Name (e.g., Regional Qualifiers)"
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface input-focus-ring" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 gradient-primary text-on-primary py-3 rounded-xl font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rounds List — Stitch Design 9 */}
      <div className="space-y-6">
        {rounds.map((round) => {
          const status = getRoundStatus(round);
          return (
            <div key={round._id} className="bg-surface-container-lowest rounded-xl p-6 transition-all duration-300 hover:bg-surface-container-low group relative overflow-hidden" style={{ boxShadow: '0 12px 32px -4px rgba(11, 54, 130, 0.04)' }}>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${edgeColors[status]}`}></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ml-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-label font-bold tracking-widest text-primary bg-primary-fixed px-3 py-1 rounded-full uppercase">Round {round.order}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[status]} flex items-center gap-2`}>
                      {status === 'live' && <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>}
                      {status === 'live' ? 'Live' : status === 'completed' ? 'Completed' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface mb-1">{round.name}</h3>
                </div>
                <div className="flex items-center gap-8 bg-surface-container-low py-4 px-6 rounded-lg w-full md:w-auto">
                  <div className="text-center">
                    <span className="block text-3xl font-black text-on-surface">{round.quizCount || 0}</span>
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Quizzes</span>
                  </div>
                  <div className="w-px h-10 bg-outline-variant opacity-30"></div>
                  <div className="text-center">
                    <span className="block text-3xl font-black text-on-surface">{round.participantCount || 0}</span>
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Participants</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteRound(round._id)} className="p-3 text-on-surface-variant hover:bg-error-container hover:text-error rounded-full transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  <Link to={`/admin/quizzes/${round._id}`} className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {rounds.length === 0 && (
        <div className="mt-12 bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/15 border-dashed">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">post_add</span>
          <h4 className="text-xl font-bold text-on-surface mb-2">No rounds yet</h4>
          <p className="text-on-surface-variant mb-6">Create rounds to organize your competition stages.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2 rounded-lg bg-surface-container-lowest text-primary font-semibold hover:bg-primary-fixed-dim transition-colors shadow-sm">Add Round</button>
        </div>
      )}
    </div>
  );
}
