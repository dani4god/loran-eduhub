// components/student/MyCertificates.tsx
"use client";

import { useEffect, useState } from "react";
import { ScrollText, Download, Edit3, Loader2, CheckCircle } from "lucide-react";
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from "@/lib/certificate";

interface CertItem {
  _id: string;
  studentName: string;
  nameEdited: boolean;
  courseName: string;
  tutorName: string;
  classification: "distinction" | "credit" | "pass";
  averageScore: number;
  certificateNumber: string;
  issuedAt: string;
}

function EditNameInline({ cert, onSaved }: { cert: CertItem; onSaved: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cert.studentName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/student/certificates/${cert._id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: name.trim() }),
      });
      if (res.ok) { onSaved(name.trim()); setEditing(false); }
    } finally {
      setSaving(false);
    }
  };

  if (cert.nameEdited) return null;

  return editing ? (
    <div className="flex items-center gap-2 mt-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
      />
      <button onClick={save} disabled={saving} className="text-xs font-semibold text-blue-600 shrink-0">
        {saving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400 shrink-0">Cancel</button>
    </div>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-2"
    >
      <Edit3 size={12} /> Correct name (one-time)
    </button>
  );
}

export default function MyCertificates() {
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/certificates")
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <ScrollText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No certificates yet — complete a course to earn one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {certs.map((cert) => (
        <div key={cert._id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ScrollText size={18} className="text-blue-600" />
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
              style={{ backgroundColor: CLASSIFICATION_COLORS[cert.classification] }}
            >
              {CLASSIFICATION_LABELS[cert.classification]}
            </span>
          </div>

          <p className="font-semibold text-gray-900 text-sm">{cert.courseName}</p>
          <p className="text-xs text-gray-400 mt-0.5">with {cert.tutorName}</p>
          <p className="text-xs text-gray-400 mt-2">
            {cert.averageScore.toFixed(1)}% average ·{" "}
            {new Date(cert.issuedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className="text-[10px] text-gray-300 mt-1 font-mono">{cert.certificateNumber}</p>

          <EditNameInline
            cert={cert}
            onSaved={(name) =>
              setCerts((prev) => prev.map((c) => (c._id === cert._id ? { ...c, studentName: name, nameEdited: true } : c)))
            }
          />

          <button
            onClick={() => window.open(`/api/certificates/${cert._id}/pdf`, "_blank")}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
          >
            <Download size={14} /> Download
          </button>
        </div>
      ))}
    </div>
  );
}