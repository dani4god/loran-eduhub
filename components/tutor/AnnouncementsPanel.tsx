// components/tutor/AnnouncementsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Link as LinkIcon, X, Calendar, Loader2 } from "lucide-react";

interface Course { _id: string; name: string }
interface LinkItem { label: string; url: string }
interface AnnouncementItem {
  _id: string;
  courseName: string;
  title: string;
  message: string;
  links: LinkItem[];
  scheduledAt: string | null;
  createdAt: string;
}

export default function AnnouncementsPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/tutor/courses").then((r) => r.json()),
      fetch("/api/tutor/announcements").then((r) => r.json()),
    ])
      .then(([coursesData, annData]) => {
        setCourses(coursesData.courses || []);
        setAnnouncements(annData.announcements || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setLinks([...links, { label: linkLabel.trim(), url: linkUrl.trim() }]);
    setLinkLabel("");
    setLinkUrl("");
  };

  const resetForm = () => {
    setCourseId("");
    setTitle("");
    setMessage("");
    setScheduledAt("");
    setLinks([]);
    setLinkLabel("");
    setLinkUrl("");
    setShowForm(false);
    setError("");
  };

  const submit = async () => {
    if (!courseId || !title.trim() || !message.trim()) {
      setError("Course, title, and message are required");
      return;
    }
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          message,
          links,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        resetForm();
        load();
      } else {
        setError(data.error || "Failed to post announcement");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-blue-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Announcements</h2>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              <Plus size={14} /> New
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Students on this course see this as a pop-up on their dashboard until they acknowledge it.
        </p>

        {showForm && (
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write your announcement..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={11} /> Class date/time (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Links (e.g. "Join Class Here")
              </label>
              {links.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 text-xs">
                      <LinkIcon size={12} className="text-blue-500 shrink-0" />
                      <span className="font-medium truncate">{l.label}</span>
                      <span className="text-gray-400 truncate flex-1">{l.url}</span>
                      <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Label (e.g. Join Class Here)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                />
                <button onClick={addLink} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0">
                  Add
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={posting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {posting && <Loader2 size={13} className="animate-spin" />}
                Post Announcement
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No announcements posted yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(a.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{a.courseName}</p>
              <p className="text-sm text-gray-600 mb-2">{a.message}</p>
              {a.scheduledAt && (
                <p className="flex items-center gap-1 text-xs font-semibold text-blue-600 mb-1.5">
                  <Calendar size={12} />
                  {new Date(a.scheduledAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {a.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {a.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {l.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}