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
      {/* Hero Section — Stitch Design 1 */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-12 py-16 lg:py-24">
        <div className="w-full md:w-1/2 space-y-8 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-surface-container-high text-primary text-sm font-bold tracking-wide uppercase mb-2">
            {settings?.platformName || 'National Excellence in Education'}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-on-surface leading-tight">
            Compete.<br />
            <span className="text-primary">Learn.</span><br />
            Lead.
          </h1>
          <p className="text-lg lg:text-xl text-on-surface-variant max-w-lg font-medium leading-relaxed">
            {settings?.heroText || 'The ultimate platform for high-stakes intellectual battles. Join the national arena, test your knowledge, and rise to the top.'}
          </p>

          {/* National Join Code Card */}
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

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button onClick={() => navigate('/login')} className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-semibold hover:bg-secondary-container/80 transition-colors flex items-center">
              <span className="material-symbols-outlined mr-2">add_circle</span>
              Host Quiz
            </button>
            <button className="text-on-surface-variant px-6 py-3 rounded-xl font-medium hover:bg-surface-container-high transition-colors">
              Explore Public Quizzes
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform scale-110 -z-10"></div>
          <div className="rounded-xl overflow-hidden ambient-shadow relative aspect-square md:aspect-[4/3] bg-gradient-to-br from-primary-fixed to-surface-container-low flex items-center justify-center">
            <div className="text-center p-8">
              <span className="material-symbols-outlined text-primary text-8xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
              <p className="text-2xl font-bold text-on-surface">Real-Time Quizzes</p>
              <p className="text-on-surface-variant mt-2">Compete with teams across the nation</p>
            </div>
            {/* Floating Overlay Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-surface-container-lowest/90 glass-nav p-4 rounded-lg ghost-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Live National Finals</p>
                <p className="text-xs text-on-surface-variant">Join competitions happening right now</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-[#dcfce7] px-3 py-1 rounded-full border border-[#15803d]/20">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d]">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section — Bento Grid */}
      <section className="py-16 lg:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface mb-4">Platform Capabilities</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">Designed for high-performance assessments and engaging competitive learning environments.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Feature 1: Real-Time Leaderboards */}
          <div className="md:col-span-2 bg-surface-container-low rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 flex flex-col justify-between group">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-lg bg-surface-container-lowest flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">leaderboard</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-3">Real-Time Leaderboards</h3>
              <p className="text-on-surface-variant leading-relaxed max-w-md">
                Experience the thrill of live competition. Watch rankings shift instantly as participants submit answers.
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-lg p-4 shadow-sm border border-outline-variant/20 mt-auto">
              <div className="flex items-center justify-between py-2 border-b border-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary w-4">1</span>
                  <div className="w-8 h-8 rounded-full bg-secondary-container"></div>
                  <span className="font-medium text-sm text-on-surface">Team Alpha</span>
                </div>
                <span className="font-bold text-sm text-on-surface">9,450 pts</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-on-surface-variant w-4">2</span>
                  <div className="w-8 h-8 rounded-full bg-surface-variant"></div>
                  <span className="font-medium text-sm text-on-surface">Team Beta</span>
                </div>
                <span className="font-bold text-sm text-on-surface">8,920 pts</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Multimedia */}
          <div className="bg-surface-container-low rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 flex flex-col group">
            <div className="w-14 h-14 rounded-lg bg-surface-container-lowest flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl">perm_media</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Multimedia Questions</h3>
            <p className="text-on-surface-variant leading-relaxed mb-6 flex-grow">
              Go beyond text. Embed images, audio clips, and video into your quiz rounds.
            </p>
          </div>

          {/* Feature 3: Team-Based */}
          <div className="bg-surface-container-low rounded-xl p-8 hover:bg-surface-container-high transition-colors duration-300 flex flex-col group">
            <div className="w-14 h-14 rounded-lg bg-surface-container-lowest flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl">groups</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Team-Based Competition</h3>
            <p className="text-on-surface-variant leading-relaxed flex-grow">
              Foster collaboration. Create teams, pool scores, and manage multi-stage tournaments.
            </p>
          </div>

          {/* Feature 4: Enterprise */}
          <div className="md:col-span-2 bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-3xl font-extrabold mb-4 text-white">Enterprise-Grade Reliability</h3>
              <p className="text-on-primary-container text-lg mb-8">
                Built to handle thousands of concurrent connections without breaking a sweat.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
