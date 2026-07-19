import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
    } else {
      toast.error('Invalid password reset link parameters.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) return toast.error('Reset token or email is missing.');
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');

    // Password requirements: at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(form.newPassword);
    const hasNumber = /[0-9]/.test(form.newPassword);
    if (!hasLetter || !hasNumber) {
      return toast.error('Password must contain at least one letter and one number');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: form.newPassword
      });
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 sm:p-12 rounded-xl ambient-shadow ghost-border">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">
            Confirm Reset
          </h1>
          <p className="text-on-surface-variant">Enter your new secure password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-2">New Password</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required
              className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="At least 8 characters (1 letter + 1 number)" />
          </div>

          <div>
            <label className="block text-sm font-label font-semibold text-on-surface mb-2">Confirm New Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required
              className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="Confirm password" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
            {loading ? 'Resetting Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="text-center text-sm text-on-surface-variant mt-8">
          Back to{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
