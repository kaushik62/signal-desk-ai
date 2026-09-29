import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';
import { Empty, panel, btnPrimary } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className={`${panel} max-w-lg mx-auto my-12 p-8 text-center`}>
      <Empty icon={SearchX} title="Page Not Found" text="The page or resource you are looking for doesn't exist or has been moved.">
        <Link to="/app" className={`${btnPrimary} inline-flex items-center gap-2 mt-4`}>
          <ArrowLeft className="h-4 w-4" /> Go to Dashboard
        </Link>
      </Empty>
    </div>
  );
}
