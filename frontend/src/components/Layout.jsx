import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { Spinner } from './ui.jsx';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  if (user === undefined) return <Spinner className="py-40" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <Topbar pathname={pathname} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
