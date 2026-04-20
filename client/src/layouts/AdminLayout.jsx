import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/competitions', label: 'Competitions', icon: 'emoji_events' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="bg-surface text-on-surface antialiased h-screen overflow-hidden flex">
      {/* SideNavBar — Stitch Design 7 */}
      <aside className="bg-slate-50 h-screen w-64 border-r border-slate-200/50 flex-col p-4 gap-2 flex-shrink-0 z-10 hidden md:flex">
        <div className="mb-8 px-2 mt-4">
          <h1 className="text-lg font-bold text-blue-900 font-headline tracking-tight">Admin Panel</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">National Competition Command</p>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-transform duration-200 ${
                isActive(item.path)
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:translate-x-1'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <Link
            to="/admin/competitions"
            className="w-full gradient-primary text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-4"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create New Competition
          </Link>

          <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer" onClick={logout}>
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{user?.username || 'Admin'}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
