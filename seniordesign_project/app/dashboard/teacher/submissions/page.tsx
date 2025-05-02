"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, File, Clock, User } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALL_SUBMISSIONS } from "@/services/user_queries";
import { UPDATE_SUBMISSION } from "@/services/user_mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TeacherSubmissions = () => {
  const { data, loading, error, refetch } = useQuery(GET_ALL_SUBMISSIONS);
  console.log("GET_ALL_SUBMISSIONS → data:", data);
  const [updateSubmission] = useMutation(UPDATE_SUBMISSION);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [grade, setGrade] = useState<string>("");

  const groupedByClass = useMemo(() => {
    if (!data?.all_submissions) return {};

    const classMap: Record<number, {
      class_name: string;
      assignments: Record<number, {
        assignment_name: string;
        students: any[];
      }>;
    }> = {};

    data.all_submissions.forEach((sub: any) => {
      const classId = sub.class_id;
      const assignmentId = sub.assignment_id;

      if (!classMap[classId]) {
        classMap[classId] = {
          class_name: sub.class_name || `Class ${classId}`,
          assignments: {},
        };
      }

      if (!classMap[classId].assignments[assignmentId]) {
        classMap[classId].assignments[assignmentId] = {
          assignment_name: sub.assignment_name || `Assignment ${assignmentId}`,
          students: [],
        };
      }

      classMap[classId].assignments[assignmentId].students.push({
        student_name: sub.student_name,
        student_id: sub.student_id,
        submission_id: sub.submission_id,
        submission_date: sub.submission_date || "No date available",
        ai_grade: sub.ai_grade,
        human_grade: sub.human_grade,
        feedback: sub.feedback,
        graded_by_ai: sub.graded_by_ai,
        status: sub.graded_by_ai || sub.human_grade !== null ? "Graded" : "Submitted",
        submission_file: sub.submission_file,
      });
    });

    return classMap;
  }, [data]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;
    try {
      await updateSubmission({
        variables: {
          submission_id: selectedSubmission.submission_id,
          human_grade: grade ? parseFloat(grade) : null,
          feedback,
        },
      });
      refetch();
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Failed to update submission:", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-blue-600 text-lg">Loading submissions...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      Error loading submissions. Please try again later.
    </div>
  );

  return (
    <div className="space-y-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-blue-800">Class Submissions</h1>
        <Badge className="bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-200">
          {Object.keys(groupedByClass).length} Classes
        </Badge>
      </div>

      {Object.entries(groupedByClass).length === 0 ? (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <File className="h-12 w-12 text-blue-400 mb-2" />
            <p className="text-blue-600 font-medium">No submissions available</p>
            <p className="text-blue-400 text-sm mt-1">When students submit their work, it will appear here</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByClass).map(([classId, classEntry]) => (
          <Card
            key={classId}
            className="bg-white border border-blue-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 py-4">
              <CardTitle className="text-blue-800 text-lg">{classEntry.class_name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {Object.entries(classEntry.assignments).map(([assignmentId, assignment]) => {
                const key = `${classId}-${assignmentId}`;
                return (
                  <Card key={assignmentId} className="border border-blue-100 bg-blue-50">
                    <CardHeader className="flex justify-between items-center px-4 py-2">
                      <p className="text-blue-700 font-medium">{assignment.assignment_name}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleDropdown(key)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      >
                        {openDropdowns[key] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CardHeader>

                    {openDropdowns[key] && (
                      <CardContent className="space-y-3 pt-2">
                        {assignment.students.map((student: any) => (
                          <div
                            key={student.submission_id}
                            className="p-3 rounded-lg bg-white border border-blue-100 flex justify-between items-center hover:bg-blue-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-medium text-blue-700">{student.student_name}</p>
                                <p className="text-xs text-blue-500">ID: {student.student_id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-blue-400" />
                                  <span className="text-xs text-blue-600">{student.submission_date}</span>
                                </div>
                                <Badge
                                  className={`mt-1 ${
                                    student.status === "Graded"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-blue-100 text-blue-600 border-blue-200"
                                  }`}
                                >
                                  {student.status}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  console.log("Selected submission:", student);
                                  setSelectedSubmission(student);
                                  setGrade(student.human_grade ?? "");
                                  setFeedback(student.feedback ?? "");
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

<Dialog
  open={!!selectedSubmission}
  onOpenChange={() => {
    console.log("DEBUG — File path:", selectedSubmission?.submission_file);
    setSelectedSubmission(null);
  }}
>
        <DialogContent className="w-full max-w-5xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-blue-800">
              Viewing Submission #{selectedSubmission?.submission_id} — {selectedSubmission?.student_name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border p-4 rounded-md h-[75vh] overflow-y-auto">
            {selectedSubmission?.submission_file ? (
  <iframe
    src={`http://localhost:8000/${selectedSubmission.submission_file}?t=${Date.now()}`}
    className="w-full h-full border rounded"
    title="Student Submission Preview"
  />
) : (
  <p className="text-blue-600">No file submitted</p>
)}


            </div>
            <div className="space-y-4">
              <p><strong>AI Grade:</strong> {selectedSubmission?.ai_grade ?? "N/A"}</p>
              <p><strong>Human Grade:</strong></p>
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md"
              />
              <textarea
                placeholder="Leave a comment..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-40 border border-blue-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                onClick={handleSaveFeedback}
              >
                Save Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherSubmissions;
