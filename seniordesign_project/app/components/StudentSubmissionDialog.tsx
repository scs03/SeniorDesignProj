"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, CheckCircle, File, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SubmissionMeta = {
  submission_id: number;
  student_name: string;
  submission_date: string;
  submission_file: string | null;
  ai_grade: number | null;
  human_grade: number | null;
  feedback: string | null;
};

export default function StudentSubmissionDialog({
  open,
  onClose,
  submission,
}: {
  open: boolean;
  onClose: () => void;
  submission: SubmissionMeta | null;
}) {
  if (!submission) return null;

  console.log("Full submission object:", submission);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-5xl bg-white border-blue-200">
        <DialogHeader className="border-b border-blue-100 pb-4">
          <DialogTitle className="text-xl text-blue-800 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Submission #{submission.submission_id}
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            {submission.student_name} • {new Date(submission.submission_date).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Submission Preview */}
          <div className="border border-blue-100 rounded-md h-[70vh] overflow-y-auto bg-white">
          {submission.submission_file ? (
  <>
    {console.log("iframe src:", `http://localhost:8000${submission.submission_file}?t=${Date.now()}`)}
    <iframe
      src={`http://localhost:8000${submission.submission_file}?t=${Date.now()}`}
      className="w-full h-full border-0"
      title="Student Submission Preview"
    />
  </>
) : (
  <div className="flex flex-col items-center justify-center h-full">
    <File className="h-16 w-16 text-blue-300 mb-3" />
    <p className="text-blue-600 font-medium">No file submitted</p>
  </div>
)}
          </div>

          {/* Grades & Feedback */}
          <div className="space-y-5">
            {/* AI Grade */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                AI Assessment
              </h3>
              {submission.ai_grade !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 text-sm">AI Grade:</span>
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-lg font-bold py-1 px-3">
                    {submission.ai_grade}
                  </Badge>
                </div>
              ) : (
                <p className="text-blue-500 text-sm italic">No AI grading available</p>
              )}
            </div>

            {/* Human Grade + Feedback */}
            <div className="space-y-4">
              <h3 className="text-blue-700 font-medium flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                Teacher Feedback
              </h3>
              <div className="text-blue-700 font-medium">
                Grade:
                <span className="ml-2 text-blue-900">{submission.human_grade ?? "—"}</span>
              </div>
              <div>
                <p className="text-blue-700 font-medium mb-1">Feedback:</p>
                <div className="text-blue-800 whitespace-pre-wrap border border-blue-100 bg-blue-50 rounded-md p-3 h-80 overflow-y-auto">
                    {submission.feedback || (
                    <span className="italic text-blue-500">No feedback provided</span>
                    )}
                </div>
            </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
