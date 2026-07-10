import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function LandingPage() {
  const [joinCode, setJoinCode] = useState('');
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) navigate(`/register/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-12 py-16 lg:py-24">
        <div className="w-full md:w-1/2 space-y-8 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary text-sm font-bold tracking-wide uppercase mb-2">
            {settings?.platformName || 'PRAJA QUIZ'}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-on-surface leading-tight">
            {settings?.heroTitleLine1 || 'Compete.'}<br />
            <span className="text-primary">{settings?.heroTitleLine2 || 'Learn.'}</span><br />
            {settings?.heroTitleLine3 || 'Lead.'}
          </h1>
          <p className="text-lg lg:text-xl text-on-surface-variant max-w-lg font-medium leading-relaxed">
            {settings?.heroText || 'National Excellence in Education. Join the premier platform for national-level competitions.'}
          </p>

          {/* Join Code Card */}
          <form onSubmit={handleJoin} className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow ghost-border inline-block mt-4 w-full max-w-md">
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Enter National Join Code</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. PQ-2024-X"
                className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all placeholder:text-outline text-lg font-medium"
              />
              <button type="submit" className="gradient-primary text-on-primary px-6 py-3 rounded-lg font-semibold hover:opacity-95 transition-opacity flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined mr-2 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Right Side — Competition Showcase Box */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform scale-110 -z-10"></div>
          <div className="rounded-xl overflow-hidden ambient-shadow relative aspect-square md:aspect-[4/3] bg-gradient-to-br from-primary-fixed to-surface-container-low flex items-center justify-center">
            {/* Competition Image or Default */}
            {settings?.landingImageUrl ? (
              <img
                src={settings.landingImageUrl}
                alt="Competition"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-primary text-8xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                <p className="text-2xl font-bold text-on-surface">Real-Time Quizzes</p>
                <p className="text-on-surface-variant mt-2">Compete with teams across the nation</p>
              </div>
            )}

            {/* Floating Live Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-surface-container-lowest/90 glass-nav p-4 rounded-lg ghost-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">
                  {settings?.landingLiveText || 'Live National Finals'}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {settings?.landingLiveSubtext || 'Join competitions happening right now'}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-[#dcfce7] px-3 py-1 rounded-full border border-[#15803d]/20 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d]">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
