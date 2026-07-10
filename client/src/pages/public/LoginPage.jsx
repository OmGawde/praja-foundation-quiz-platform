import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 sm:p-12 rounded-xl ambient-shadow ghost-border">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">
            Admin Login
          </h1>
          <p className="text-on-surface-variant">Access the competition management dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="admin@praja.gov" />
          </div>
          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-2">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
              className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
