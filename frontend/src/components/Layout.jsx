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

  if (user === undefined) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Spinner className="py-0" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className="layout-content flex flex-col min-h-screen transition-[padding] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ paddingLeft: `${collapsed ? 64 : 240}px` }}
      >
        <style>{`@media (max-width: 1023px) { .layout-content { padding-left: 0 !important; } }`}</style>
        <Topbar pathname={pathname} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
