// components/tutor/PaymentsHistory.tsx
'use client';

import { useEffect, useState } from 'react';
import { Wallet, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PayoutRow {
  _id: string; studentName: string; courseName: string;
  grossAmount: number; commissionAmount: number; netAmount: number;
  status: string; paidAt: string | null; createdAt: string;
  sourceModel?: string; // Add this field
}

const STATUS_STYLES: Record<string, { color: string; icon: any }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function PaymentsHistory() {
  const [payments, setPayments] = useState<PayoutRow[]>([]);
  const [totals, setTotals] = useState({ totalEarned: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tutor/payments')
      .then((r) => r.json())
      .then((d) => { 
        setPayments(d.payments || []); 
        setTotals({ 
          totalEarned: d.totalEarned || 0, 
          totalPending: d.totalPending || 0 
        }); 
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <Wallet size={16} className="text-green-500 mb-2" />
          <p className="text-lg font-bold text-gray-900">₦{totals.totalEarned.toLocaleString('en-NG')}</p>
          <p className="text-xs text-gray-500">Total earned</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <Clock size={16} className="text-yellow-500 mb-2" />
          <p className="text-lg font-bold text-gray-900">₦{totals.totalPending.toLocaleString('en-NG')}</p>
          <p className="text-xs text-gray-500">Pending payout</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {payments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No payment history yet.</p>
        ) : (
          payments.map((p) => {
            const s = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
            const Icon = s.icon;
            const sourceLabel = p.sourceModel === 'CoachingBooking' ? 'Coaching Session' : 'Course Enrollment';
            
            return (
              <div key={p._id} className="p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.courseName}</p>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                      {sourceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {p.studentName} · ₦{p.grossAmount.toLocaleString('en-NG')} gross
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">₦{p.netAmount.toLocaleString('en-NG')}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}