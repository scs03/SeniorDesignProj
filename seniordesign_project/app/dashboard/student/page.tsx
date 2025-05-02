"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_STUDENT_CLASSES } from "@/services/user_queries";
import { useSession } from "@/hooks/useSession";
import { BookOpen, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssignmentDialog from "@/app/components/AssignmentDialog";

const StudentDashboard = () => {
  const user = useSession() as { email: string; user_id: string; name: string } | null;
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_STUDENT_CLASSES, {
    variables: { studentId: user ? parseInt(user.user_id, 10) : 0 },
    skip: !user,
  });

  useEffect(() => {
    if (user) refetch();
  }, [user, refetch]);

  const handleSubmit = async (assignmentId: number, file: File) => {
    const formData = new FormData();
    console.log("Uploading:", file.name, "to assignment:", assignmentId);
  
    formData.append(
      "operations",
      JSON.stringify({
        query: `
          mutation SubmitAssignment($assignment_id: Int!, $submission_file: Upload!) {
            submit_assignment(assignment_id: $assignment_id, submission_file: $submission_file)
          }
        `,
        variables: { assignment_id: assignmentId, submission_file: null },
      })
    );
    formData.append("map", JSON.stringify({ "0": ["variables.submission_file"] }));
    formData.append("0", file);
  
    const res = await fetch("http://localhost:8000/graphql", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    
    const text = await res.text();
    console.log("Raw Response:", text);
  
    refetch();
    setOpenDialogId(null);
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg font-medium text-blue-700">Loading your classes...</p>
      </div>
    </div>
  );

  if (error || !user) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <BookOpen className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-medium text-red-600">Unable to load classes.</p>
        <p className="text-sm text-red-500 mt-2">Please try again later.</p>
      </div>
    </div>
  );

  const studentClasses = data?.student_classes || [];

  return (
    <div className="p-6 w-full mx-auto space-y-6 bg-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-blue-800">
          Welcome, {user.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "Student"}!
        </h1>
        <p className="text-blue-600">Here are your upcoming assignments.</p>
      </div>

      {studentClasses.length === 0 ? (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BookOpen className="h-12 w-12 text-blue-400 mb-2" />
            <p className="text-blue-600 font-medium">No classes enrolled</p>
            <p className="text-blue-400 text-sm mt-1">Ask your teacher for a class ID to join.</p>
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => alert("Join class feature coming soon!")}
            >
              Join a Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studentClasses.map((cls: any) => (
            <Card key={cls.id} className="w-full bg-white border-blue-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-100">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-100 p-2 rounded-full">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-blue-800">{cls.name}</CardTitle>
                    <CardDescription className="text-blue-500 text-sm">Class ID: {cls.id}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-blue-700 font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Assignments
                </h3>
                {cls.assignments.length === 0 ? (
                  <div className="text-center py-6 bg-blue-50 rounded-lg border border-dashed border-blue-200">
                    <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-blue-600">No assignments yet</p>
                    <p className="text-xs text-blue-500">Check back later for new assignments</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cls.assignments.map((assignment: any) => {
                      const hasSubmission = assignment.submission && assignment.submission.file_path;
                      const isGraded = hasSubmission && assignment.submission.grade !== null;
                      
                      return (
                        <Card key={assignment.id} className="w-full border border-blue-100 shadow-none hover:bg-blue-50 transition-colors duration-200">
                          <CardHeader className="p-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base text-blue-700 flex items-center">
                                {hasSubmission ? (
                                  isGraded ? (
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                                  )
                                ) : (
                                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                                )}
                                {assignment.name}
                              </CardTitle>
                              <span className="flex items-center text-xs text-blue-500"> 
                                <Calendar className="h-3 w-3 mr-1" />
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          </CardHeader>
                          <CardFooter className="p-2 bg-blue-50 border-t border-blue-100">
                            <Button 
                              variant="outline" 
                              className="text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 text-sm w-full"
                              onClick={() => setOpenDialogId(assignment.id)}
                            >
                              {hasSubmission ? (
                                isGraded ? "View Feedback" : "View Submission"
                              ) : "Submit Assignment"}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-blue-50 py-2 px-4 border-t border-blue-100">
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 text-sm w-full">
                  View Class Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {studentClasses.map((cls: any) =>
        cls.assignments.map((assignment: any) => (
          <AssignmentDialog
            key={assignment.id}
            assignment={assignment}
            openDialogId={openDialogId}
            setOpenDialogId={setOpenDialogId}
            onSubmit={handleSubmit}
          />
        ))
      )}
    </div>
  );
};

export default StudentDashboard;