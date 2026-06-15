"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Upload, FileText, BookOpen, ClipboardList,
  CheckCircle, ToggleLeft, AlignLeft, ChevronRight, Send
} from "lucide-react";

interface Course {
  _id: string;
  name: string;
}

type QuestionType = "mcq" | "fill-in-the-gap" | "true-or-false";

interface Question {
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: "mcq",           label: "MCQ",        icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { value: "true-or-false", label: "True / False", icon: <ToggleLeft className="w-3.5 h-3.5" /> },
  { value: "fill-in-the-gap", label: "Fill Gap",  icon: <AlignLeft className="w-3.5 h-3.5" /> },
];

const TYPE_COLORS: Record<QuestionType, string> = {
  "mcq":             "bg-blue-50 text-blue-700",
  "true-or-false":   "bg-emerald-50 text-emerald-700",
  "fill-in-the-gap": "bg-amber-50 text-amber-700",
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function ExamForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [examData, setExamData] = useState({
    title: "",
    instructions: "",
    courseId: "",
    duration: 60,
    scheduledDate: "",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: "mcq",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
  });

  // ── Derived ──────────────────────────────────────────────
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const step =
    !examData.title || !examData.courseId ? 1
    : questions.length === 0 ? 2
    : 3;

  // ── Handlers ─────────────────────────────────────────────
  const handleAddQuestion = () => {
    if (!currentQuestion.questionText || !currentQuestion.correctAnswer) return;
    setQuestions((prev) => [...prev, currentQuestion]);
    setCurrentQuestion({ type: "mcq", questionText: "", options: ["", "", "", ""], correctAnswer: "", marks: 1 });
    setShowQuestionForm(false);
  };

  const handleRemoveQuestion = (index: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const parsed: Question[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length < 3) continue;
        const type = values[0] as QuestionType;
        const q: Question = {
          type,
          questionText: values[1] ?? "",
          correctAnswer: values[2] ?? "",
          marks: Number(values[3]) || 1,
          options: [],
        };
        if (type === "mcq") {
          q.options = values.slice(4, 8).filter(Boolean);
          while (q.options.length < 4) q.options.push("");
        }
        parsed.push(q);
      }
      setQuestions(parsed);
      setBulkUploadMode(false);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...examData, questions }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create exam");
        return;
      }
      router.push("/dashboard/tutor/exams");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Create New Exam</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details, then add your questions.</p>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: "Details" },
          { n: 2, label: "Questions" },
          { n: 3, label: "Review" },
        ].map(({ n, label }, idx) => (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${step > n ? "bg-tutor text-white" : step === n ? "bg-tutor text-white ring-4 ring-tutor/20" : "bg-slate-100 text-slate-400"}`}
              >
                {step > n ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <span className={`text-[11px] font-medium ${step >= n ? "text-tutor" : "text-slate-400"}`}>{label}</span>
            </div>
            {idx < 2 && (
              <div className={`h-0.5 flex-1 mb-5 mx-1 rounded transition-all ${step > n ? "bg-tutor" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Card: Exam Details ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-tutor-light">
          <div className="w-8 h-8 rounded-lg bg-tutor/10 flex items-center justify-center text-tutor">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-brand-dark">Exam Details</p>
            <p className="text-xs text-slate-500">Basic info and scheduling</p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Title */}
          <Field label="Exam Title" required>
            <input
              type="text"
              placeholder="e.g. Mid-Term Mathematics Exam"
              value={examData.title}
              onChange={(e) => setExamData({ ...examData, title: e.target.value })}
              className={inputCls}
              required
            />
          </Field>

          {/* Course */}
          <Field label="Course" required>
            <select
              value={examData.courseId}
              onChange={(e) => setExamData({ ...examData, courseId: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">— Select a course —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* Duration + Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Duration (minutes)" required>
              <input
                type="number"
                min={1}
                value={examData.duration}
                onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Scheduled Date & Time">
              <input
                type="datetime-local"
                value={examData.scheduledDate}
                onChange={(e) => setExamData({ ...examData, scheduledDate: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Instructions */}
          <Field label="Instructions" required>
            <textarea
              value={examData.instructions}
              onChange={(e) => setExamData({ ...examData, instructions: e.target.value })}
              className={`${inputCls} min-h-[88px] resize-y`}
              placeholder="e.g. Answer all questions. No calculators allowed. Write legibly…"
              required
            />
          </Field>
        </div>
      </div>

      {/* ── Card: Questions ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-tutor-light">
          <div className="w-8 h-8 rounded-lg bg-tutor/10 flex items-center justify-center text-tutor">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-heading text-sm font-semibold text-brand-dark">Questions</p>
            <p className="text-xs text-slate-500">Add manually or import via CSV</p>
          </div>
          {questions.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-tutor/10 text-tutor text-xs font-semibold px-2.5 py-1 rounded-full">
              <ClipboardList className="w-3 h-3" />
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setBulkUploadMode((p) => !p); setShowQuestionForm(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              type="button"
              onClick={() => { setShowQuestionForm((p) => !p); setBulkUploadMode(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-tutor text-white text-sm font-medium hover:bg-tutor/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {/* CSV Upload zone */}
          {bulkUploadMode && (
            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-tutor/30 rounded-xl bg-tutor-light px-4 py-8 cursor-pointer hover:border-tutor/50 transition-all">
              <FileText className="w-8 h-8 text-tutor/60" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Click to upload a CSV file</p>
                <p className="text-xs text-slate-400 mt-0.5">Format: type, question, answer, marks, opt1, opt2, opt3, opt4</p>
              </div>
              <span className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg">
                Choose file
              </span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          )}

          {/* Add Question inline form */}
          {showQuestionForm && (
            <div className="border border-tutor/20 bg-tutor-light/60 rounded-xl p-4 space-y-3">
              {/* Type tabs */}
              <div className="flex gap-2">
                {QUESTION_TYPES.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        type: value,
                        options: value === "mcq" ? ["", "", "", ""] : [],
                        correctAnswer: value === "true-or-false" ? "True" : "",
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all
                      ${currentQuestion.type === value
                        ? "bg-tutor text-white border-tutor"
                        : "bg-white text-slate-500 border-slate-200 hover:border-tutor/40"}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Question text */}
              <textarea
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                className={`${inputCls} min-h-[70px] resize-y`}
                placeholder="Type your question here…"
              />

              {/* MCQ options */}
              {currentQuestion.type === "mcq" && (
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-tutor/20 text-tutor text-[10px] font-bold flex items-center justify-center shrink-0">
                        {OPTION_LETTERS[i]}
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[i] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOpts });
                        }}
                        className={inputCls}
                        placeholder={`Option ${OPTION_LETTERS[i]}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Correct answer row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Correct Answer" required>
                  {currentQuestion.type === "true-or-false" ? (
                    <select
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                      className={inputCls}
                    >
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : (
                    <input
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Option A"
                    />
                  )}
                </Field>
                <Field label="Marks">
                  <input
                    type="number"
                    min={1}
                    value={currentQuestion.marks}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-3 py-2 text-sm text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Add Question
                </button>
              </div>
            </div>
          )}

          {/* Question list */}
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-tutor-light text-tutor text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">{q.questionText}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[q.type]}`}>
                        {QUESTION_TYPES.find((t) => t.value === q.type)?.label}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        {q.marks} mark{q.marks !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(i)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                    aria-label="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : !showQuestionForm && !bulkUploadMode ? (
            <div className="text-center py-10 text-slate-400">
              <ClipboardList className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No questions yet. Add manually or import a CSV file.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm text-slate-400">
          Total marks: <span className="font-semibold text-tutor">{totalMarks}</span>
        </p>
        <button
          type="submit"
          disabled={loading || questions.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tutor text-white font-semibold text-sm hover:bg-tutor/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
          {loading ? "Creating…" : "Create Exam"}
        </button>
      </div>
    </form>
  );
}

// ── Helpers ────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tutor/25 focus:border-tutor focus:bg-white transition-all";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}