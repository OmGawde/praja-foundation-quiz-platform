import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset link dispatched!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 sm:p-12 rounded-xl ambient-shadow ghost-border">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">
            Reset Password
          </h1>
          <p className="text-on-surface-variant">We'll dispatch a link to securely recover your account.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-label font-semibold text-on-surface mb-2">Registered Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="you@example.com" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-emerald-50 text-emerald-800 p-6 rounded-xl border border-emerald-100">
              <p className="font-medium">
                A password reset request has been processed. If an account matches <strong>{email}</strong>, a recovery link will arrive shortly.
              </p>
            </div>
            <p className="text-sm text-on-surface-variant">
              Check your inbox (or server console logs if testing locally/staging without SMTP configurations).
            </p>
          </div>
        )}

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
