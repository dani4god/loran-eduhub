// components/student/AnnouncementPopup.tsx
"use client";

import { useEffect, useState } from "react";
import { Megaphone, Calendar, ExternalLink, X } from "lucide-react";

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

export default function AnnouncementPopup() {
  const [queue, setQueue] = useState<AnnouncementItem[]>([]);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    fetch("/api/student/announcements")
      .then((r) => r.json())
      .then((d) => {
        const unseen = (d.announcements || []).filter((a: AnnouncementItem) => !a.acknowledged);
        setQueue(unseen);
      });
  }, []);

  const current = queue[0];

  const acknowledge = async () => {
    if (!current) return;
    setAcking(true);
    try {
      await fetch(`/api/student/announcements/${current._id}/acknowledge`, { method: "POST" });
      setQueue((q) => q.slice(1));
    } finally {
      setAcking(false);
    }
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 text-center relative">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">{current.title}</h2>
          <p className="text-blue-100 text-xs mt-1">
            {current.courseName} · {current.tutorName}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700 whitespace-pre-line">{current.message}</p>

          {current.scheduledAt && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Calendar size={14} className="text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-blue-700">
                {new Date(current.scheduledAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          )}

          {current.links.length > 0 && (
            <div className="flex flex-col gap-2">
              {current.links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100"
                >
                  <ExternalLink size={14} /> {l.label}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={acknowledge}
            disabled={acking}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {acking ? "..." : "OK, Got It"}
          </button>

          {queue.length > 1 && (
            <p className="text-[11px] text-gray-400 text-center">
              {queue.length - 1} more announcement{queue.length - 1 !== 1 ? "s" : ""} waiting
            </p>
          )}
        </div>
      </div>
    </div>
  );
}