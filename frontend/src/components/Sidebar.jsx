import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { getInitials } from './ui.jsx';
import { LayoutDashboard, Users, Mail, BarChart3, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';

export const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/follow-ups', label: 'Follow-ups', icon: Mail },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }) {
  const showLabels = !collapsed || mobileOpen;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-all duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'lg:w-16' : 'lg:w-60'}`}
    >
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        {showLabels && <span className="truncate text-sm font-semibold">Signal Desk AI</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabels && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onToggle}
          className="mb-2 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {showLabels && <span>Collapse</span>}
        </button>
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {getInitials(user.name)}
          </div>
          {showLabels && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                title="Log out"
                aria-label="Log out"
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
