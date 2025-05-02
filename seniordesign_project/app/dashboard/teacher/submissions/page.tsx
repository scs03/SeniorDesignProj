"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { 
  ChevronDown, 
  ChevronUp, 
  File, 
  Clock, 
  User, 
  BookOpen, 
  FileText, 
  CheckCircle,
  Award,
  ClipboardCheck,
  AlertCircle 
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALL_SUBMISSIONS } from "@/services/user_queries";
import { UPDATE_SUBMISSION } from "@/services/user_mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TeacherSubmissions = () => {
  const { data, loading, error, refetch } = useQuery(GET_ALL_SUBMISSIONS);
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
    <div className="p-8 text-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg font-medium text-blue-700">Loading submissions...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-medium text-red-600">Unable to load submissions.</p>
        <p className="text-sm text-red-500 mt-2">Please try again later.</p>
      </div>
    </div>
  );

  const totalSubmissions = Object.values(groupedByClass).reduce(
    (count, cls) => count + Object.values(cls.assignments).reduce(
      (aCount, assignment) => aCount + assignment.students.length, 0
    ), 0
  );

  const gradedSubmissions = Object.values(groupedByClass).reduce(
    (count, cls) => count + Object.values(cls.assignments).reduce(
      (aCount, assignment) => aCount + assignment.students.filter(s => s.status === "Graded").length, 0
    ), 0
  );

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-blue-100">
        <div>
          <h1 className="text-2xl font-semibold text-blue-800">Student Submissions</h1>
          <p className="text-blue-600">Review and grade student work</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-blue-50 p-2 rounded-md border border-blue-100 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-blue-700">
              <span className="font-medium">{gradedSubmissions}</span> / {totalSubmissions} Graded
            </span>
          </div>
          <Badge className="bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-200 py-1 px-3">
            {Object.keys(groupedByClass).length} Classes
          </Badge>
        </div>
      </div>

      {Object.entries(groupedByClass).length === 0 ? (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-blue-400 mb-2" />
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
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-100">
              <div className="flex items-center">
                <div className="mr-4 bg-blue-100 p-2 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-blue-800">{classEntry.class_name}</CardTitle>
                  <CardDescription className="text-blue-500 text-sm">
                    Class ID: {classId} • {Object.keys(classEntry.assignments).length} Assignments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              {Object.entries(classEntry.assignments).map(([assignmentId, assignment]) => {
                const key = `${classId}-${assignmentId}`;
                const totalStudents = assignment.students.length;
                const gradedStudents = assignment.students.filter(s => s.status === "Graded").length;
                
                return (
                  <Card key={assignmentId} className="border border-blue-100 shadow-none">
                    <CardHeader 
                      className="flex flex-row justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 cursor-pointer"
                      onClick={() => toggleDropdown(key)}
                    >
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-blue-700 font-medium">{assignment.assignment_name}</p>
                          <p className="text-xs text-blue-500">{gradedStudents} of {totalStudents} submissions graded</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(key);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      >
                        {openDropdowns[key] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </CardHeader>

                    {openDropdowns[key] && (
                      <CardContent className="space-y-3 pt-3 pb-3">
                        {assignment.students.map((student: any) => (
                          <div
                            key={student.submission_id}
                            className="p-3 rounded-lg bg-white border border-blue-100 flex justify-between items-center hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedSubmission(student);
                              setGrade(student.human_grade?.toString() ?? "");
                              setFeedback(student.feedback ?? "");
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-full">
                                <User className="h-4 w-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-700">{student.student_name}</p>
                                <p className="text-xs text-blue-500">Student ID: {student.student_id}</p>
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
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                  }`}
                                >
                                  {student.status === "Graded" ? (
                                    <div className="flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {student.status}
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <ClipboardCheck className="h-3 w-3 mr-1" />
                                      {student.status}
                                    </div>
                                  )}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-blue-600 border-blue-200 hover:bg-blue-100"
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
        onOpenChange={(open) => {
          if (!open) setSelectedSubmission(null);
        }}
      >
        <DialogContent className="w-full max-w-5xl bg-white border-blue-200">
          <DialogHeader className="border-b border-blue-100 pb-4">
            <DialogTitle className="text-xl text-blue-800 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Submission #{selectedSubmission?.submission_id}
            </DialogTitle>
            <DialogDescription className="text-blue-600">
              {selectedSubmission?.student_name} • {selectedSubmission?.submission_date}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="border border-blue-100 rounded-md h-[70vh] overflow-y-auto bg-white">
              {selectedSubmission?.submission_file ? (
                <iframe
                  src={`http://localhost:8000/${selectedSubmission.submission_file}?t=${Date.now()}`}
                  className="w-full h-full border-0"
                  title="Student Submission Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <File className="h-16 w-16 text-blue-300 mb-3" />
                  <p className="text-blue-600 font-medium">No file submitted</p>
                </div>
              )}
            </div>
            
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-blue-700 font-medium mb-2 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" /> 
                  AI Assessment
                </h3>
                {selectedSubmission?.ai_grade !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 text-sm">AI Grade:</span>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-lg font-bold py-1 px-3">
                      {selectedSubmission?.ai_grade}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-blue-500 text-sm italic">No AI grading available</p>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-blue-700 font-medium flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600" /> 
                  Teacher Feedback
                </h3>
                <div>
                  <Label htmlFor="grade" className="text-blue-700">Grade</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-24 px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-blue-600">(0-100)</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="feedback" className="text-blue-700">Feedback Comments</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide feedback to the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full h-40 border border-blue-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                  onClick={handleSaveFeedback}
                >
                  Save Feedback
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherSubmissions;