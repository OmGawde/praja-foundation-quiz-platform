import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      const from = location.state?.from?.pathname || (data.user.role === 'admin' || data.user.role === 'quiz_manager' ? '/admin/dashboard' : '/join');
      navigate(from, { replace: true });
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
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">
            Sign In
          </h1>
          <p className="text-on-surface-variant">Sign in to your administrator or participant account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-label font-semibold text-on-surface">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-surface-container-highest border-transparent rounded-lg pl-4 pr-11 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-on-surface-variant mt-8 border-t pt-6">
          Don't have a participant account?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Sign Up Here
          </Link>
        </div>
      </div>
    </div>
  );
}
