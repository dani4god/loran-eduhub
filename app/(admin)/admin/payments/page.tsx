'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentRow {
  _id: string; studentName: string; tutors: string[]; courses: string[];
  amount: number; plan: string; status: string; paidAt: string | null; createdAt: string;
}

const STATUS_STYLES: Record<string, { color: string; icon: any }> = {
  success: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/payments?page=${page}&status=${status}`)
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments || []); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Every payment made on the platform.</p>
        </div>

        <div className="flex gap-1.5">
          {['all', 'success', 'pending', 'failed'].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${status === s ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {payments.map((p) => {
              const s = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
              const Icon = s.icon;
              return (
                <div key={p._id} className="p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}><Icon size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.studentName}</p>
                    <p className="text-xs text-gray-400 truncate">{p.courses.join(', ')} · {p.tutors.join(', ')}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">₦{p.amount.toLocaleString('en-NG')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="text-xs text-gray-500">Page {page} of {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}