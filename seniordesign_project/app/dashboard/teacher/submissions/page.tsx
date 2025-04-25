"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_ALL_SUBMISSIONS } from "@/services/user_queries";

const TeacherSubmissions = () => {
  const { data, loading, error } = useQuery(GET_ALL_SUBMISSIONS);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const groupedData = useMemo(() => {
    const map: Record<string, {
      class_id: number;
      assignment_id: number;
      students: {
        student_name: string;
        student_id: number;
        submission_id: number;
      }[];
    }> = {};

    data?.all_submissions.forEach((sub: any) => {
      const key = `${sub.class_id}-${sub.assignment_id}`;
      if (!map[key]) {
        map[key] = {
          class_id: sub.class_id,
          assignment_id: sub.assignment_id,
          students: [],
        };
      }
      map[key].students.push({
        student_name: sub.student_name,
        student_id: sub.student_id,
        submission_id: sub.submission_id,
      });
    });

    return map;
  }, [data]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div className="p-4">Loading submissions...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading submissions.</div>;

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-6">All Class Submissions</h1>
      {Object.entries(groupedData).map(([key, entry]) => (
        <Card key={key} className="mb-4">
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-lg">
                Class ID: {entry.class_id} — Assignment ID: {entry.assignment_id}
              </CardTitle>
              <button onClick={() => toggleDropdown(key)}>
                {openDropdowns[key] ? (
                  <ChevronUp className="text-blue-600" />
                ) : (
                  <ChevronDown className="text-blue-600" />
                )}
              </button>
            </div>
            {openDropdowns[key] && (
              <ul className="space-y-1 mt-3">
                {entry.students.map((student) => (
                  <li
                    key={student.submission_id}
                    className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded"
                  >
                    <span>{student.student_name} (ID: {student.student_id})</span>
                    <span className="text-gray-500">Submission #{student.submission_id}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeacherSubmissions;