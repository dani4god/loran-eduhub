import AdminLayout from '@/components/admin/AdminLayout';
import SiteSettingsPanel from '@/components/admin/SiteSettingsPanel';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Site-wide configuration.</p>
        </div>
        <SiteSettingsPanel />
      </div>
    </AdminLayout>
  );
}