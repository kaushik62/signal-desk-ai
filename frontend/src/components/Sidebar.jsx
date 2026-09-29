import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { getInitials } from './ui.jsx';
import {
  LayoutDashboard, Users, Mail, BarChart3, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, Sparkles,
} from 'lucide-react';

export const navItems = [
  { to: '/app',            label: 'Overview',    icon: LayoutDashboard },
  { to: '/app/leads',      label: 'Leads',       icon: Users           },
  { to: '/app/follow-ups', label: 'Follow-ups',  icon: Mail            },
  { to: '/app/analytics',  label: 'Analytics',   icon: BarChart3       },
  { to: '/app/settings',   label: 'Settings',    icon: Settings        },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }) {
  const showLabels = !collapsed || mobileOpen;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gray-950 border-r border-white/5
        transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${collapsed ? 'lg:w-16' : 'lg:w-60'} w-60`}
    >
      {/* Logo */}
      <div className={`flex h-[60px] shrink-0 items-center gap-3 border-b border-white/5 px-4 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {showLabels && (
          <div className="overflow-hidden">
            <span className="truncate text-sm font-bold text-white tracking-tight">SignalDesk AI</span>
            <p className="text-[10px] text-gray-500 -mt-0.5 truncate">Lead Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            onClick={onNavigate}
            title={label}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed && !mobileOpen ? 'justify-center' : ''}`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabels && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 space-y-1">
        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          className={`nav-item hidden w-full lg:flex ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed && !mobileOpen ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
          {showLabels && <span>Collapse</span>}
        </button>

        {/* User info */}
        <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600/30 text-xs font-bold text-brand-300 border border-brand-500/20">
            {getInitials(user?.name || '')}
          </div>
          {showLabels && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
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
