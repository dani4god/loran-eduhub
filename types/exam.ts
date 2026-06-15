export interface ExamCourseDTO {
  _id: string;
  name: string;
}

export interface ExamDTO {
  _id: string;
  title: string;
  instructions: string;
  course: ExamCourseDTO;
  duration: number;
  isPublished: boolean;
  scheduledDate: string | null;
  totalQuestions: number;
  totalMarks: number;
  submissions: number;
}

export interface ExamToGrade {
  _id: string;
  title: string;
  course: {
    _id: string;
    name: string;
  };
  submissions: {
    studentId: string;
    studentName: string;
    submittedAt: string | null; // ✅ KEEP STRING
    isGraded: boolean;
  }[];
}



