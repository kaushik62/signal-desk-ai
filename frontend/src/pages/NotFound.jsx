import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Empty, panel, btnPrimary } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className={panel}>
      <Empty icon={SearchX} title="Page not found" text="The page you opened does not exist.">
        <Link to="/" className={btnPrimary}>Go to overview</Link>
      </Empty>
    </div>
  );
}
