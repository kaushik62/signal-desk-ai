import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import Overview from './pages/Overview.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Compose from './pages/Compose.jsx';
import FollowUps from './pages/FollowUps.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<HomePage />} />

      {/* Auth pages */}
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="register" element={<AuthPage mode="register" />} />

      {/* Protected dashboard routes under /app */}
      <Route path="app" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="leads/:id/compose" element={<Compose />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
