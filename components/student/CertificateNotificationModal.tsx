// components/student/CertificateNotificationModal.tsx
"use client";

import { useEffect, useState } from "react";
import { ScrollText, Download, Edit3, X, Loader2, CheckCircle } from "lucide-react";
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from "@/lib/certificate";

interface CertItem {
  _id: string;
  studentName: string;
  nameEdited: boolean;
  courseName: string;
  classification: "distinction" | "credit" | "pass";
  averageScore: number;
  viewedByStudent: boolean;
}

export default function CertificateNotificationModal() {
  const [queue, setQueue] = useState<CertItem[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState(false);

  useEffect(() => {
    fetch("/api/student/certificates")
      .then((r) => r.json())
      .then((d) => {
        const unseen = (d.certificates || []).filter((c: CertItem) => !c.viewedByStudent);
        setQueue(unseen);
      });
  }, []);

  const current = queue[0];

  useEffect(() => {
    if (current) setNameInput(current.studentName);
    setReviewing(false);
    setSavedName(false);
  }, [current?._id]);

  const dismiss = async () => {
    if (!current) return;
    fetch(`/api/student/certificates/${current._id}/acknowledge`, { method: "POST" }).catch(() => {});
    setQueue((q) => q.slice(1));
  };

  const saveName = async () => {
    if (!current || !nameInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/student/certificates/${current._id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: nameInput.trim() }),
      });
      if (res.ok) {
        setSavedName(true);
        setReviewing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    if (!current) return;
    window.open(`/api/certificates/${current._id}/pdf`, "_blank");
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center relative">
          <button onClick={dismiss} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={18} />
          </button>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ScrollText className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Your Certificate is Ready!</h2>
          <p className="text-blue-100 text-xs mt-1">Congratulations on completing {current.courseName}</p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-sm font-semibold text-gray-900">{current.studentName}</p>
            <p className="text-xs text-gray-500">{current.courseName}</p>
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white mt-1"
              style={{ backgroundColor: CLASSIFICATION_COLORS[current.classification] }}
            >
              {current.averageScore.toFixed(1)}% · {CLASSIFICATION_LABELS[current.classification]}
            </span>
          </div>

          {reviewing ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Correct your name (one-time only)
              </label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewing(false)}
                  className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={saveName}
                  disabled={saving || !nameInput.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {savedName && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                  <CheckCircle size={13} /> Name updated
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {!current.nameEdited && !savedName && (
                  <button
                    onClick={() => setReviewing(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                  >
                    <Edit3 size={14} /> Review Certificate
                  </button>
                )}
                <button
                  onClick={download}
                  className={`flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 ${
                    current.nameEdited || savedName ? "col-span-2" : ""
                  }`}
                >
                  <Download size={14} /> Download Certificate
                </button>
              </div>
            </>
          )}

          <p className="text-[11px] text-gray-400 text-center">
            This certificate is also saved under "My Certificates" in your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}