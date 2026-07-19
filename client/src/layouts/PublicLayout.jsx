import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function PublicLayout() {
  const [settings, setSettings] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data)).catch(console.error);
  }, []);
  return (
    <div className="bg-surface text-on-surface antialiased flex flex-col min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm" style={{ backgroundColor: 'rgba(246, 249, 255, 0.85)' }}>
        <div className="flex justify-between items-center px-8 h-16 max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
            {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-8 object-contain" />}
            {settings?.platformName || 'PRAJA QUIZ'}
          </Link>
          <div className="hidden md:flex items-center gap-8 font-sans antialiased">
            <Link to="/join" className="text-slate-600 hover:text-blue-600 transition-colors">Join Quiz</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                  Hi, <span className="font-bold text-primary">{user.username}</span>
                </span>
                
                {(user.role === 'admin' || user.role === 'quiz_manager') && (
                  <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 hover:text-primary transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">dashboard</span>
                    Admin
                  </Link>
                )}

                <button onClick={logout} className="text-sm font-medium text-on-primary gradient-primary px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">logout</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium text-on-primary gradient-primary px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-slate-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="font-bold text-slate-900 mb-2 text-lg">{settings?.platformName || 'PRAJA QUIZ'}</div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              © {new Date().getFullYear()} {settings?.platformName || 'Praja Quiz Platform'}. National Excellence in Education.
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-xs uppercase tracking-widest">
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-opacity opacity-80 hover:opacity-100">Terms of Service</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-opacity opacity-80 hover:opacity-100">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 transition-opacity opacity-80 hover:opacity-100">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
