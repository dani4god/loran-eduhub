// components/admin/CourseManagement.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, Edit3, BookOpen, Loader2 } from 'lucide-react';
import { CATEGORY_TO_ROLE_GROUP } from '@/lib/discordRoleMap';

interface Course {
  _id: string;
  name: string;
  description: string;
  category: string;
  discordRoleGroup: string;
  syllabus: string[];
  isActive: boolean;
}

const emptyForm = { name: '', description: '', category: '', syllabus: [''], isActive: true };

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/courses').then((r) => r.json()).then((d) => setCourses(d.courses || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const startEdit = (c: Course) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      description: c.description,
      category: c.category,
      syllabus: c.syllabus.length ? c.syllabus : [''],
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const updateSyllabusItem = (i: number, val: string) => {
    const next = [...form.syllabus]; next[i] = val; setForm({ ...form, syllabus: next });
  };
  const addSyllabusItem = () => setForm({ ...form, syllabus: [...form.syllabus, ''] });
  const removeSyllabusItem = (i: number) => setForm({ ...form, syllabus: form.syllabus.filter((_, idx) => idx !== i) });

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      toast.error('Name and category are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/courses/${editingId}` : '/api/admin/courses';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          syllabus: form.syllabus.filter((s: string) => s.trim()),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? 'Course updated' : 'Course created');
        setShowForm(false);
        load();
      } else {
        toast.error(data.error || 'Failed to save course');
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course: Course) => {
    if (!confirm(`Delete "${course.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/courses/${course._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Course deleted'); load(); }
    else toast.error(data.error || 'Failed to delete');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Update Courses</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add, edit, or remove courses offered on the platform.</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          <Plus size={15} /> New Course
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-red-100 p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Course name"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a category...</option>
                {Object.keys(CATEGORY_TO_ROLE_GROUP).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {form.category && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Discord role group: <span className="font-medium text-gray-600">{CATEGORY_TO_ROLE_GROUP[form.category as keyof typeof CATEGORY_TO_ROLE_GROUP]}</span> (auto-assigned)
                </p>
              )}
            </div>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Description"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Syllabus</label>
            <div className="space-y-1.5">
              {form.syllabus.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) => updateSyllabusItem(i, e.target.value)}
                    placeholder={`Topic ${i + 1}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  />
                  {form.syllabus.length > 1 && (
                    <button onClick={() => removeSyllabusItem(i)} className="text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSyllabusItem} className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
              <Plus size={12} /> Add topic
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (visible to tutors/students)
          </label>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} {editingId ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                </div>
                {!c.isActive && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">Inactive</span>}
              </div>
              <p className="text-xs text-gray-400 mb-2">{c.category} · {c.discordRoleGroup}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.description}</p>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(c)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => remove(c)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}