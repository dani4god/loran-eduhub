'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Wallet, CheckCircle2, Clock, Loader2, Percent, Sparkles } from 'lucide-react';

interface PayoutRow {
  _id: string; tutorName: string; bankName: string | null; accountNumber: string | null;
  studentName: string; courseName: string;
  grossAmount: number; commissionAmount: number; netAmount: number;
  status: string; paidAt: string | null; createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
};

function CommissionRateControl() {
  const [percent, setPercent] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/commission')
      .then((r) => r.json())
      .then((d) => setPercent(Math.round((d.commissionRate ?? 0.15) * 100)))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent }),
      });
      if (res.ok) toast.success(`Commission rate set to ${percent}%`);
      else toast.error('Failed to update rate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-1">
        <Percent size={16} className="text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Platform Commission Rate</p>
          <p className="text-xs text-gray-400">Applies to all new payments going forward.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" min={0} max={100} value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center"
        />
        <span className="text-sm text-gray-500">%</span>
        <button onClick={save} disabled={saving} className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, paid: 0, failed: 0 });
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/payouts?status=${status}`)
      .then((r) => r.json())
      .then((d) => { setPayouts(d.payouts || []); setCounts(d.statusCounts || counts); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const markPaid = async (payout: PayoutRow) => {
    if (!confirm(`Confirm you've paid ${payout.tutorName} ₦${payout.netAmount.toLocaleString('en-NG')} manually?`)) return;
    setPayingId(payout._id);
    try {
      const res = await fetch(`/api/admin/payouts/${payout._id}/pay`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { toast.success('Marked as paid'); load(); }
      else toast.error(data.error || 'Failed');
    } finally {
      setPayingId(null);
    }
  };

  const runCleanup = async () => {
    if (!confirm('Remove duplicate payout entries? This only removes exact duplicates, keeping the original.')) return;
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/payouts/dedupe', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Removed ${data.removed} duplicate(s), reset ${data.resetToPending} to pending`);
        load();
      } else {
        toast.error(data.error || 'Cleanup failed');
      }
    } finally {
      setCleaning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payouts</h1>
            <p className="text-gray-500 text-sm mt-0.5">Tutor earnings after platform commission — confirmed manually.</p>
          </div>
          <button onClick={runCleanup} disabled={cleaning} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 disabled:opacity-50">
            {cleaning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Clean Up Duplicates
          </button>
        </div>

        <CommissionRateControl />

        <div className="flex gap-1.5">
          {(['pending', 'paid', 'failed'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${status === s ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {s} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status === s ? 'bg-white/20' : 'bg-gray-100'}`}>{counts[s]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No {status} payouts.</div>
        ) : (
          <div className="space-y-2.5">
            {payouts.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.tutorName}</p>
                    <p className="text-xs text-gray-400 truncate">{p.courseName} · {p.studentName}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                </div>

                {p.bankName ? (
                  <p className="text-[11px] text-gray-500 mb-2">{p.bankName} · {p.accountNumber}</p>
                ) : (
                  <p className="text-[11px] text-orange-600 font-semibold mb-2">No bank details on file for this tutor yet</p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500 space-x-3">
                    <span>Gross: ₦{p.grossAmount.toLocaleString('en-NG')}</span>
                    <span>Commission: ₦{p.commissionAmount.toLocaleString('en-NG')}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₦{p.netAmount.toLocaleString('en-NG')}</p>
                </div>

                {p.status === 'pending' && (
                  <button
                    onClick={() => markPaid(p)}
                    disabled={payingId === p._id}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {payingId === p._id ? <Loader2 size={13} className="animate-spin" /> : <Wallet size={13} />}
                    {payingId === p._id ? 'Saving...' : 'Mark as Paid'}
                  </button>
                )}
                {p.status === 'paid' && p.paidAt && (
                  <p className="flex items-center gap-1 text-[11px] text-green-600 font-semibold mt-2">
                    <CheckCircle2 size={11} /> Paid {new Date(p.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}