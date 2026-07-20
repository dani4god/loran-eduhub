// components/tutor/CreateCertificatePanel.tsx
"use client";

import { useEffect, useState } from "react";
import {
  ScrollText, Upload, User, CheckCircle2, XCircle, Award,
  Loader2, Image as ImageIcon, PenTool,
} from "lucide-react";
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from "@/lib/certificate";

interface EligibleStudent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  averageScore: number;
  classification: "distinction" | "credit" | "pass" | "fail";
  hasGrades: boolean;
  hasCertificate: boolean;
  certificateId: string | null;
}

export default function CreateCertificatePanel() {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSettings = () => {
    fetch("/api/tutor/certificate-settings")
      .then((r) => r.json())
      .then((d) => { setSignatureUrl(d.signatureUrl); setLogoUrl(d.logoUrl); });
  };

  const loadStudents = () => {
    setLoading(true);
    fetch("/api/tutor/certificates/eligible")
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSettings(); loadStudents(); }, []);

  const uploadFile = async (file: File, field: "signature" | "logo") => {
    field === "signature" ? setUploadingSig(true) : setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const patchBody = field === "signature" ? { signatureUrl: data.url } : { logoUrl: data.url };
      const patchRes = await fetch("/api/tutor/certificate-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const patchData = await patchRes.json();
      setSignatureUrl(patchData.signatureUrl);
      setLogoUrl(patchData.logoUrl);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Upload failed" });
    } finally {
      field === "signature" ? setUploadingSig(false) : setUploadingLogo(false);
    }
  };

  const issueCertificate = async (enrollmentId: string) => {
    setIssuingId(enrollmentId);
    setMessage(null);
    try {
      const res = await fetch("/api/tutor/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Certificate issued successfully." });
        loadStudents();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to issue certificate" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setIssuingId(null);
    }
  };

  const settingsReady = !!signatureUrl && !!logoUrl;

  return (
    <div className="space-y-5">
      {/* Certificate settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <ScrollText size={18} className="text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Certificate Settings</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Set your signature and the Loran EduHub logo once — every certificate you issue will use these.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <PenTool size={12} /> Your Signature
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" className="h-14 mx-auto object-contain mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              )}
              <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                {uploadingSig ? "Uploading..." : signatureUrl ? "Change signature" : "Upload signature"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingSig}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "signature")}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon size={12} /> Certificate Logo
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-14 mx-auto object-contain mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              )}
              <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                {uploadingLogo ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logo")}
                />
              </label>
            </div>
          </div>
        </div>

        {!settingsReady && (
          <p className="text-xs text-orange-600 mt-3">
            Set both your signature and logo before you can issue certificates.
          </p>
        )}
      </div>

      {/* Eligible students */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Award size={18} className="text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Issue a Certificate</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Based on each student's average graded score for the course.
        </p>

        {message && (
          <div
            className={`text-xs rounded-xl p-3 mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No enrolled students found.</p>
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.enrollmentId} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.studentName}</p>
                  <p className="text-xs text-gray-400 truncate">{s.courseName}</p>
                </div>

                {s.hasGrades ? (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                    style={{ backgroundColor: CLASSIFICATION_COLORS[s.classification] }}
                  >
                    {s.averageScore.toFixed(1)}% · {CLASSIFICATION_LABELS[s.classification]}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 shrink-0">No grades yet</span>
                )}

                {s.hasCertificate ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 shrink-0">
                    <CheckCircle2 size={14} /> Issued
                  </span>
                ) : s.classification === "fail" ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-500 shrink-0">
                    <XCircle size={14} /> Not eligible
                  </span>
                ) : (
                  <button
                    onClick={() => issueCertificate(s.enrollmentId)}
                    disabled={!settingsReady || issuingId === s.enrollmentId || !s.hasGrades}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                  >
                    {issuingId === s.enrollmentId && <Loader2 size={12} className="animate-spin" />}
                    {issuingId === s.enrollmentId ? "Issuing..." : "Issue Certificate"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}