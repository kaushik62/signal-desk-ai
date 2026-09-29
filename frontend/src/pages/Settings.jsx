import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { panel, btnGhost } from '../components/ui.jsx';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className={`${panel} max-w-lg space-y-4 p-5`}>
      <h2 className="text-sm font-semibold">Account</h2>
      <dl className="space-y-3 text-sm">
        <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{user.name}</dd></div>
        <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
      </dl>
      <button className={btnGhost} onClick={async () => { await logout(); navigate('/login'); }}><LogOut className="h-4 w-4" /> Log out</button>
    </div>
  );
}
