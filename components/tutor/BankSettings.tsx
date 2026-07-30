// components/tutor/BankSettings.tsx
'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

interface Bank { name: string; code: string }
interface BankDetails { bankName: string; accountNumber: string; accountName: string }

export default function BankSettings() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [current, setCurrent] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/tutor/bank')
      .then((r) => r.json())
      .then((d) => { setCurrent(d.bankDetails); setBanks(d.banks || []); })
      .finally(() => setLoading(false));
  }, []);

  const requestOtp = async () => {
    setSendingOtp(true);
    setError('');
    try {
      const res = await fetch('/api/tutor/bank/request-otp', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setOtpSent(true);
      else setError(data.error || 'Failed to send code');
    } finally {
      setSendingOtp(false);
    }
  };

  const save = async () => {
    setError(''); setSuccess(false); setSaving(true);
    try {
      const bank = banks.find((b) => b.code === bankCode);
      const res = await fetch('/api/tutor/bank', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, bankName: bank?.name, bankCode, accountNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrent(data.bankDetails);
        setSuccess(true);
        setEditing(false);
        setOtpSent(false);
        setOtp('');
      } else {
        setError(data.error || 'Failed to update bank details');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={18} className="text-blue-600" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payout Bank Details</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">This is where your payouts are sent. Changing it requires email verification.</p>

      {current && !editing && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-w-sm">
          <p className="text-sm font-semibold text-gray-900">{current.accountName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{current.bankName} · {current.accountNumber}</p>
        </div>
      )}

      {success && (
        <p className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-3"><CheckCircle size={13} /> Bank details updated</p>
      )}

      {!editing ? (
        <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
          {current ? 'Change Bank Details' : 'Add Bank Details'}
        </button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
            <option value="">Select your bank...</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />

          {!otpSent ? (
            <button onClick={requestOtp} disabled={sendingOtp || !bankCode || !accountNumber} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {sendingOtp && <Loader2 size={14} className="animate-spin" />} Send Verification Code
            </button>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><ShieldCheck size={11} /> Enter the 8-digit code sent to your email</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={8} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm tracking-widest" />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setOtpSent(false); setOtp(''); }} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold">Cancel</button>
                <button onClick={save} disabled={saving || otp.length !== 8} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving && <Loader2 size={13} className="animate-spin" />} Confirm & Save
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}