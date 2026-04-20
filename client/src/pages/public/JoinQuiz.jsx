import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function JoinQuiz() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error('Please enter a join code');
    setLoading(true);
    try {
      await api.get(`/quizzes/join/${joinCode.trim().toUpperCase()}`);
      navigate(`/register/${joinCode.trim().toUpperCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid join code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 sm:p-12 rounded-xl ambient-shadow ghost-border">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">Join a Quiz</h1>
          <p className="text-on-surface-variant">Enter your unique join code to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 ghost-border flex flex-col items-center">
            <label className="text-sm font-label font-bold text-primary tracking-widest uppercase mb-3">Join Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="PQ-XXXX"
              className="w-full text-center text-3xl sm:text-4xl font-headline font-black text-accent bg-transparent border-none placeholder:text-outline-variant focus:ring-0"
              autoFocus
            />
            <div className="h-[2px] w-24 bg-primary/20 mt-2 rounded-full"></div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Continue'}
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
