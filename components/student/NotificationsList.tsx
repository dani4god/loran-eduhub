// components/student/NotificationsList.tsx
"use client";

import { useEffect, useState } from "react";
import { Megaphone, Calendar, ExternalLink, CheckCircle2, BookOpen } from "lucide-react";

interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  links: { label: string; url: string }[];
  scheduledAt: string | null;
  courseName: string;
  tutorName: string;
  createdAt: string;
  acknowledged: boolean;
}

export default function NotificationsList() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((a) => (
        <div key={a._id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Megaphone size={13} className="text-blue-500 shrink-0" />
              <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
            </div>
            {a.acknowledged ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 shrink-0">
                <CheckCircle2 size={11} /> Read
              </span>
            ) : (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full shrink-0">
                New
              </span>
            )}
          </div>

          <p className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
            <BookOpen size={10} /> {a.courseName} · {a.tutorName} ·{" "}
            {new Date(a.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>

          <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{a.message}</p>

          {a.scheduledAt && (
            <p className="flex items-center gap-1 text-xs font-semibold text-blue-600 mb-2">
              <Calendar size={12} />
              {new Date(a.scheduledAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}

          {a.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {a.links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <ExternalLink size={11} /> {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}