// app/(tutor)/dashboard/grades/upload/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileText, X } from "lucide-react";

interface Exam {
  _id: string;
  title: string;
  course?: {
    name?: string;
  };
}

export default function BulkGradeUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [examId, setExamId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);

  // ✅ FIX: useEffect instead of useState
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch("/api/exams");
        const data = await res.json();
        setExams(data || []);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      }
    };

    fetchExams();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!examId || !file) {
      alert("Please select an exam and a CSV file");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("examId", examId);

    try {
      const response = await fetch("/api/grades/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Grades uploaded successfully!");
        router.push("/dashboard/grades");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to upload grades");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setUploading(false);
  };

  const downloadTemplate = () => {
    const template =
      "studentEmail,score,feedback\nstudent@example.com,85,Great work!\n";

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "grade-upload-template.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bulk Upload Grades
        </h1>
        <p className="text-gray-600 mt-2">
          Upload grades for multiple students at once using a CSV file
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam *
            </label>

            <select
              required
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an exam</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} - {exam.course?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />

            <p className="text-gray-600 mb-2">
              {file ? file.name : "Click or drag and drop CSV file here"}
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />

            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              Select File
            </label>

            {file && (
              <button
                onClick={() => setFile(null)}
                className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              CSV Format Instructions
            </h3>

            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>studentEmail - The email address of the student</li>
              <li>score - The score obtained (number)</li>
              <li>feedback - Optional feedback for the student</li>
            </ul>

            <button
              onClick={downloadTemplate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV Template
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleUpload}
              disabled={uploading || !examId || !file}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Grades"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}