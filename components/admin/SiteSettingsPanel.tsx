// components/admin/SiteSettingsPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Upload, AlertTriangle, Loader2 } from 'lucide-react'

export default function SiteSettingsPanel() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((d) => { setLogoUrl(d.logoUrl); setMaintenanceMode(d.maintenanceMode); })
      .finally(() => setLoading(false));
  }, []);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const patchRes = await fetch('/api/admin/settings/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: data.url }),
      });
      const patchData = await patchRes.json();
      setLogoUrl(patchData.logoUrl);
      toast.success('Logo updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleMaintenance = async () => {
    const next = !maintenanceMode;
    if (next && !confirm('This will block all students and tutors from accessing the site until you turn it off. Continue?')) return;
    const res = await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenanceMode: next }),
    });
    if (res.ok) { setMaintenanceMode(next); toast.success(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled'); }
    else toast.error('Failed to update');
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={18} className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Site Logo</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Appears in the navbar and footer across the whole site.</p>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-white font-bold">L</span>}
          </div>
          <label className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload New Logo'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 p-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-orange-600" />
          <h2 className="text-base font-semibold text-gray-900">Maintenance Mode</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Blocks all student and tutor access site-wide and shows a maintenance page. Admin access is unaffected.
        </p>
        <button
          onClick={toggleMaintenance}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            maintenanceMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
        </button>
        {maintenanceMode && (
          <p className="text-xs text-orange-600 font-semibold mt-2">⚠ Maintenance mode is currently ON.</p>
        )}
      </div>
    </div>
  );
}