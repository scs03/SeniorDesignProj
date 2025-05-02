"use client";

import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useSession } from "@/hooks/useSession";
import { GET_MY_SUBMISSIONS } from "@/services/user_queries";
import { BookOpen, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const StudentGrades = () => {
  const user = useSession() as { user_id: string; name: string } | null;

  const { data, loading, error, refetch } = useQuery(GET_MY_SUBMISSIONS, {
    skip: !user,
  });

  useEffect(() => {
    if (user) refetch();
  }, [user, refetch]);

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <GraduationCap className="h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg font-medium text-blue-700">Loading your grades...</p>
      </div>
    </div>
  );

  if (error || !user) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <BookOpen className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-medium text-red-600">Unable to load grades.</p>
        <p className="text-sm text-red-500 mt-2">Please try again later.</p>
      </div>
    </div>
  );

  const groupedByClass: Record<string, { class_name: string; assignments: any[] }> = {};

  (data?.my_submissions || []).forEach((sub: any) => {
    const classId = sub.class_id;
    if (!groupedByClass[classId]) {
      groupedByClass[classId] = {
        class_name: sub.class_name,
        assignments: [],
      };
    }
    groupedByClass[classId].assignments.push(sub);
  });

  return (
    <div className="p-6 w-full  mx-auto space-y-6 bg-blue-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-blue-800">
          Your Grades, {user.name}
        </h1>
        <p className="text-blue-600">See your scores below, from each class and assignment.</p>
      </div>

      {Object.keys(groupedByClass).length === 0 ? (
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BookOpen className="h-12 w-12 text-blue-400 mb-2" />
            <p className="text-blue-600 font-medium">No submissions yet</p>
            <p className="text-blue-400 text-sm mt-1">Submit assignments to receive grades.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByClass).map(([classId, cls]) => (
          <Card key={classId} className="bg-white border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-100">
              <CardTitle className="text-blue-800 text-lg">{cls.class_name}</CardTitle>
              <CardDescription className="text-blue-500 text-sm">Class ID: {classId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {cls.assignments.map((sub) => {
                const grade = sub.human_grade ?? sub.ai_grade;
                const label = sub.human_grade !== null
                  ? "Graded by Teacher"
                  : sub.ai_grade !== null
                  ? "Graded by AI"
                  : "Not Graded";

                return (
                  <div key={sub.assignment_id} className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-100">
                    <div>
                      <p className="font-medium text-blue-800">{sub.assignment_name}</p>
                      <p className="text-sm text-blue-500">Assignment ID: {sub.assignment_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700 text-lg">{grade ?? "—"}</p>
                      <Badge className={
                        label === "Graded by Teacher"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : label === "Graded by AI"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }>
                        {label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default StudentGrades;
