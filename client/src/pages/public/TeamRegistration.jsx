import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TeamRegistration() {
  const { joinCode } = useParams();
  const navigate = useNavigate();
  const [quizInfo, setQuizInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    teamName: '', participant1: '', participant2: '',
    institute: '', email: '', phone: ''
  });

  useEffect(() => {
    api.get(`/quizzes/join/${joinCode}`)
      .then(res => setQuizInfo(res.data))
      .catch(err => { toast.error(err.response?.data?.error || 'Invalid join code'); navigate('/join'); });
  }, [joinCode]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teamName || !form.participant1 || !form.institute || !form.email) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      const res = await api.post('/teams/register', { ...form, joinCode });
      toast.success('Registration successful!');
      navigate(`/lobby/${res.data.quiz._id}/${res.data.team._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-surface-container-low rounded-xl p-8 sm:p-12 ghost-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Team Registration</h1>
          <p className="text-lg text-on-surface-variant">Enter your details to join the competition.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Join Code Display */}
          <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex flex-col items-center justify-center border border-outline-variant/15">
            <label className="text-sm font-label font-bold text-primary tracking-widest uppercase mb-3">Join Code</label>
            <div className="text-3xl sm:text-4xl font-headline font-black text-accent">{joinCode}</div>
            {quizInfo && <p className="text-xs text-on-surface-variant mt-3">{quizInfo.competitionName} — {quizInfo.roundName}</p>}
            <div className="h-[2px] w-24 bg-primary/20 mt-2 rounded-full"></div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-label font-semibold text-on-surface mb-2">Team Name *</label>
              <input name="teamName" value={form.teamName} onChange={handleChange} required
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                placeholder="e.g. The Innovators" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Participant 1 Name *</label>
                <input name="participant1" value={form.participant1} onChange={handleChange} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                  placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Participant 2 Name</label>
                <input name="participant2" value={form.participant2} onChange={handleChange}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                  placeholder="Full Name (Optional)" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-label font-semibold text-on-surface mb-2">Institution / Organization *</label>
              <input name="institute" value={form.institute} onChange={handleChange} required
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                placeholder="School or Company Name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                  placeholder="team@email.com" />
              </div>
              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                  placeholder="Optional" />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
              <span>{loading ? 'Submitting...' : 'Submit Registration'}</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
