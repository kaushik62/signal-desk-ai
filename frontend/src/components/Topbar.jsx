import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronRight, LogOut } from 'lucide-react';
import { navItems } from './Sidebar.jsx';
import { getInitials } from './ui.jsx';
import { useAuth } from '../auth.jsx';
import { useState } from 'react';

export default function Topbar({ pathname, onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // Strip /app prefix for breadcrumb parsing
  const stripped = pathname.replace(/^\/app\/?/, '');
  const [root, id, action] = stripped.split('/').filter(Boolean);
  const section = navItems.find((n) => n.to === `/app/${root ?? ''}` || (!root && n.to === '/app'));
  const page = action === 'compose' ? 'Compose email' : id ? 'Lead details' : null;
  const title = page ?? section?.label ?? 'Not found';

  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900';

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Hamburger (mobile) */}
      <button id="topbar-menu-btn" onClick={onMenu} className={`${iconBtn} lg:hidden`} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb + Title */}
      <div className="min-w-0 flex-1">
        <nav className="flex items-center gap-1 text-xs text-gray-400" aria-label="Breadcrumb">
          <Link to="/app" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          {root && (
            <>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              {page
                ? <Link to={`/app/${root}`} className="hover:text-gray-700 transition-colors">{section?.label}</Link>
                : <span className="text-gray-600">{title}</span>
              }
            </>
          )}
          {page && (
            <>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <span className="text-gray-600">{page}</span>
            </>
          )}
        </nav>
        <h1 className="truncate text-base font-semibold leading-tight text-gray-900">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link to="/app/leads" id="topbar-search-btn" className={iconBtn} aria-label="Search leads" title="Search leads">
          <Search className="h-4 w-4" />
        </Link>
        <Link to="/app/follow-ups" id="topbar-notifications-btn" className={`${iconBtn} relative`} aria-label="Follow-ups" title="Follow-ups">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 border-2 border-white" />
        </Link>

        {/* Avatar + dropdown */}
        <div className="relative ml-1">
          <button
            id="topbar-avatar-btn"
            onClick={() => setShowProfile(!showProfile)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/10 text-xs font-bold text-brand-700 border border-brand-200/50 transition-all hover:bg-brand-600/20"
            aria-label="Account options"
          >
            {getInitials(user?.name || '')}
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-gray-100 bg-white shadow-float py-1.5">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link to="/app/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Settings
                </Link>
                <button
                  onClick={async () => { setShowProfile(false); await logout(); navigate('/'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
