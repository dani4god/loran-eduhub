// components/tutor/ExamEditForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Trash2, Plus, X, AlertCircle,
  Eye, EyeOff, Calendar, Clock, FileQuestion,
  Award, BookOpen, ChevronDown, ChevronUp,
  Copy, CheckCircle, AlertTriangle
} from "lucide-react";

interface Question {
  _id?: string;
  type: "mcq" | "fill-in-the-gap" | "true-or-false";
  questionText: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
  order: number;
}

interface ExamData {
  _id: string;
  title: string;
  instructions: string;
  courseId: {
    _id: string;
    name: string;
  };
  duration: number;
  scheduledDate: string;
  isPublished: boolean;
}

export default function ExamEditForm({ examId }: { examId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!examId) return;
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    if (!examId) return;

    try {
      const response = await fetch(`/api/exams/${examId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch exam");
      }

      const data = await response.json();

      setExamData(data.exam);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examData?.title,
          instructions: examData?.instructions,
          duration: examData?.duration,
          scheduledDate: examData?.scheduledDate,
          questions,
        }),
      });

      if (response.ok) {
        alert("Exam updated successfully!");
        router.push("/dashboard/tutor/exams");
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update exam");
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      type: "mcq",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
    // Auto-expand the new question
    setExpandedQuestions(new Set([...expandedQuestions, questions.length]));
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (confirm("Are you sure you want to remove this question?")) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion = {
      ...questionToDuplicate,
      _id: undefined,
      order: questions.length,
      questionText: `${questionToDuplicate.questionText} (Copy)`
    };
    setQuestions([...questions, duplicatedQuestion]);
  };

  const toggleQuestionExpand = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "mcq": return "Multiple Choice";
      case "true-or-false": return "True or False";
      case "fill-in-the-gap": return "Fill in the Gap";
      default: return type;
    }
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  };

  if (!examId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-800">Invalid Exam ID</h3>
        <p className="text-red-600 mt-2">The exam ID provided is invalid.</p>
        <button
          onClick={() => router.push("/dashboard/tutor/exams")}
          className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tutor border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading exam data...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-800">Exam Not Found</h3>
        <p className="text-red-600 mt-2">The exam you're trying to edit doesn't exist.</p>
        <button
          onClick={() => router.push("/dashboard/tutor/exams")}
          className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdateExam} className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tutor via-tutor/90 to-brand-primary rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm mb-4">
                
                <span>Edit Exam</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-heading">
                {examData.title}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Update your exam details, questions, and settings
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? "Hide Preview" : "Preview"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-white text-tutor rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-tutor border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Exam Information</h2>
          <p className="text-sm text-gray-500 mt-0.5">Basic details and settings</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                required
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all"
                placeholder="Enter exam title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <BookOpen className="w-4 h-4 text-tutor" />
                <span className="text-gray-700">{examData.courseId?.name || "N/A"}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="1"
                  value={examData.duration}
                  onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={examData.scheduledDate ? new Date(examData.scheduledDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setExamData({ ...examData, scheduledDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all"
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                required
                rows={4}
                value={examData.instructions}
                onChange={(e) => setExamData({ ...examData, instructions: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all resize-none"
                placeholder="Provide clear instructions for students..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {questions.length} question{questions.length !== 1 ? "s" : ""} • Total {getTotalMarks()} marks
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-tutor/10 text-tutor rounded-xl hover:bg-tutor/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No questions added yet</p>
            <p className="text-sm text-gray-400 mt-1">Click the button above to add your first question</p>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="mt-4 text-tutor hover:text-tutor/80 font-medium"
            >
              + Add your first question
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(index);
              return (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-tutor/10 text-tutor flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <select
                        value={question.type}
                        onChange={(e) => handleUpdateQuestion(index, "type", e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-tutor/20"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="true-or-false">True or False</option>
                        <option value="fill-in-the-gap">Fill in the Gap</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(e) => handleUpdateQuestion(index, "marks", parseInt(e.target.value))}
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                        />
                        <span className="text-sm text-gray-500">marks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuestionExpand(index)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(index)}
                        className="p-1.5 text-gray-400 hover:text-tutor rounded-lg transition"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Body - Always visible */}
                  <textarea
                    value={question.questionText}
                    onChange={(e) => handleUpdateQuestion(index, "questionText", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tutor/20 focus:border-tutor transition-all resize-none"
                    rows={2}
                    placeholder="Enter your question here..."
                  />

                  {/* Expanded Content - Options for MCQ */}
                  {isExpanded && question.type === "mcq" && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700">Options</label>
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[optIndex] = e.target.value;
                              handleUpdateQuestion(index, "options", newOptions);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tutor/20"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          {option === question.correctAnswer && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer - Always visible */}
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                    {question.type === "true-or-false" ? (
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={question.correctAnswer === "true"}
                            onChange={() => handleUpdateQuestion(index, "correctAnswer", "true")}
                            className="w-4 h-4 text-tutor"
                          />
                          <span>True</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={question.correctAnswer === "false"}
                            onChange={() => handleUpdateQuestion(index, "correctAnswer", "false")}
                            className="w-4 h-4 text-tutor"
                          />
                          <span>False</span>
                        </label>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(index, "correctAnswer", e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-tutor/20"
                        placeholder="Enter the correct answer"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Exam Preview</h3>
                <p className="text-sm text-gray-500 mt-0.5">This is how students will see the exam</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{examData.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {examData.duration} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <FileQuestion className="w-4 h-4" />
                    {questions.length} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {getTotalMarks()} total marks
                  </span>
                </div>
                <p className="text-gray-700 mt-4 p-4 bg-gray-50 rounded-xl">{examData.instructions}</p>
              </div>
              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {idx + 1}. {question.questionText || "Untitled Question"}
                    </p>
                    {question.type === "mcq" && question.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="ml-4 mb-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`preview_q${idx}`} disabled />
                          <span className="text-gray-700">{opt || `Option ${optIdx + 1}`}</span>
                        </label>
                      </div>
                    ))}
                    {question.type === "true-or-false" && (
                      <div className="ml-4 space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`preview_q${idx}`} disabled />
                          <span>True</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`preview_q${idx}`} disabled />
                          <span>False</span>
                        </label>
                      </div>
                    )}
                    {question.type === "fill-in-the-gap" && (
                      <input
                        type="text"
                        placeholder="Your answer"
                        disabled
                        className="ml-4 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 w-64"
                      />
                    )}
                    <p className="text-sm text-gray-500 mt-2 ml-4">Marks: {question.marks}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-2xl p-4 -mx-4 px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Total marks: <span className="font-semibold text-gray-900">{getTotalMarks()}</span>
          </div>
          <button
            type="submit"
            disabled={saving || questions.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-tutor to-brand-primary text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}