import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Dashboard } from '../components/admin/Dashboard';
import { UserManagement } from '../components/admin/UserManagement';
import { TripModeration } from '../components/admin/TripModeration';
import { Analytics } from '../components/admin/Analytics';
import { SystemHealth } from '../components/admin/SystemHealth';
import { FeatureFlags } from '../components/admin/FeatureFlags';
import { SystemThemeConfig } from '../components/admin/SystemThemeConfig';

export function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/trips" element={<TripModeration />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/system" element={<SystemHealth />} />
        <Route path="/features" element={<FeatureFlags />} />
        <Route path="/theme" element={<SystemThemeConfig />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}