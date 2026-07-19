import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    teamName: '',
    participant1: '',
    participant2: '',
    institute: '',
    phone: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Please enter your email address first');
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return toast.error('Please enter a valid email address');
    }

    setSendingOtp(true);
    try {
      await api.post('/auth/send-signup-otp', { email: form.email });
      setOtpSent(true);
      setCountdown(60);
      toast.success('Verification code sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.username.length < 3) return toast.error('Username must be at least 3 characters');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    
    const hasLetter = /[a-zA-Z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);
    if (!hasLetter || !hasNumber) {
      return toast.error('Password must contain at least one letter and one number');
    }

    if (!form.otp) {
      return toast.error('Please enter the email verification code (OTP)');
    }

    setLoading(true);
    try {
      await api.post('/auth/register-participant', form);
      toast.success('Registration successful!');
      await login(form.email, form.password);
      navigate('/join');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-2xl bg-surface-container-lowest p-8 sm:p-12 rounded-xl ambient-shadow ghost-border">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">
            Participant Registration
          </h1>
          <p className="text-on-surface-variant">Create a persistent team profile to join quizzes instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Account Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary font-headline border-b pb-2 mb-4">Account Credentials</h3>
              
              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="e.g. team_alpha" />
              </div>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Email Address</label>
                <div className="flex gap-2">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={otpSent}
                    className="flex-grow bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow disabled:opacity-75" placeholder="leader@example.com" />
                  <button type="button" onClick={handleSendOtp} disabled={sendingOtp || countdown > 0}
                    className="px-4 py-2.5 text-xs font-bold text-on-primary gradient-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap min-w-[120px]">
                    {sendingOtp ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? 'Resend code' : 'Send code'}
                  </button>
                </div>
                {otpSent && (
                  <div className="text-right mt-1">
                    <button type="button" onClick={() => { setOtpSent(false); setForm({ ...form, otp: '' }); }} className="text-xs text-primary font-semibold hover:underline">
                      Change email address
                    </button>
                  </div>
                )}
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-label font-semibold text-on-surface mb-2">Verification Code (OTP)</label>
                  <input type="text" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required
                    className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow text-center font-bold tracking-widest text-lg" placeholder="123456" maxLength={6} />
                  <p className="text-xs text-on-surface-variant mt-1">Check your email for the 6-digit OTP code.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="At least 8 chars (1 letter + 1 number)" />
              </div>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Contact Phone (Optional)</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="e.g. +91 98765 43210" />
              </div>
            </div>

            {/* Right Column: Team & Institute details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary font-headline border-b pb-2 mb-4">Team Profile</h3>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Team Name</label>
                <input type="text" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="e.g. Code Wizards" />
              </div>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Participant 1 (Leader)</label>
                <input type="text" value={form.participant1} onChange={(e) => setForm({ ...form, participant1: e.target.value })} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="Firstname Lastname" />
              </div>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Participant 2 (Optional)</label>
                <input type="text" value={form.participant2} onChange={(e) => setForm({ ...form, participant2: e.target.value })}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="Firstname Lastname" />
              </div>

              <div>
                <label className="block text-sm font-label font-semibold text-on-surface mb-2">Institute Name</label>
                <input type="text" value={form.institute} onChange={(e) => setForm({ ...form, institute: e.target.value })} required
                  className="w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-2.5 text-on-surface placeholder:text-outline-variant input-focus-ring transition-shadow" placeholder="e.g. IIT Bombay" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-on-primary font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Register & Continue'}
            </button>
          </div>

          <div className="text-center text-sm text-on-surface-variant mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
