import { Link } from 'react-router-dom';
import { Menu, Search, Bell, ChevronRight } from 'lucide-react';
import { navItems } from './Sidebar.jsx';
import { getInitials } from './ui.jsx';
import { useAuth } from '../auth.jsx';

export default function Topbar({ pathname, onMenu }) {
  const { user } = useAuth();
  const [root, id, action] = pathname.split('/').filter(Boolean);
  const section = navItems.find((n) => n.to === `/${root ?? ''}`);
  const page = action === 'compose' ? 'Compose email' : id ? 'Lead details' : null;
  const title = page ?? section?.label ?? 'Not found';
  const iconBtn = 'rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      <button onClick={onMenu} className={`${iconBtn} lg:hidden`} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      <div className="min-w-0 flex-1">
        <nav className="flex items-center gap-1 text-xs text-gray-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          {root && (
            <>
              <ChevronRight className="h-3 w-3" />
              {page ? <Link to={`/${root}`} className="hover:text-gray-900">{section?.label}</Link> : <span className="text-gray-700">{title}</span>}
            </>
          )}
          {page && (<><ChevronRight className="h-3 w-3" /><span className="text-gray-700">{page}</span></>)}
        </nav>
        <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
      </div>
      <Link to="/leads" className={iconBtn} aria-label="Search leads" title="Search leads"><Search className="h-4 w-4" /></Link>
      <Link to="/follow-ups" className={iconBtn} aria-label="Follow-ups" title="Follow-ups"><Bell className="h-4 w-4" /></Link>
      <Link to="/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700" aria-label="Account settings">
        {getInitials(user.name)}
      </Link>
    </header>
  );
}
