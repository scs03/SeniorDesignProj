"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const initialAssignments = [
  {
    title: "Analysis of Lord of the Flies",
    assignedDate: "Feb 1, 25",
    dueDate: "Feb 10, 25",
    status: "Pending",
    grade: "-",
    students: [
      { name: "John", grade: "-" },
      { name: "Alice", grade: "-" },
    ],
  },
  {
    title: "Macbeth Character Study",
    assignedDate: "Feb 5, 25",
    dueDate: "Feb 15, 25",
    status: "Completed",
    grade: "23/25",
    students: [
      { name: "John", grade: "25/25", gradedBy: "Manual" },
      { name: "Alice", grade: "21/25", gradedBy: "AI" },
    ],
  },
];

const TeacherSubmissions = () => {
  const [assignmentsData, setAssignmentsData] = useState(initialAssignments);
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentModalIndex, setStudentModalIndex] = useState<number | null>(null);
  const [editableGrades, setEditableGrades] = useState<{
    [assignmentIndex: number]: { [studentIndex: number]: boolean };
  }>({});

  const toggleDropdown = (index: number) => {
    setOpenDropdowns((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAdjustClick = (assignmentIndex: number, studentIndex: number) => {
    setEditableGrades((prev) => ({
      ...prev,
      [assignmentIndex]: {
        ...(prev[assignmentIndex] || {}),
        [studentIndex]: true,
      },
    }));

    setAssignmentsData((prev) => {
      const updated = [...prev];
      const updatedStudents = [...updated[assignmentIndex].students];
      updatedStudents[studentIndex] = {
        ...updatedStudents[studentIndex],
        gradedBy: "Manual",
      };
      updated[assignmentIndex] = {
        ...updated[assignmentIndex],
        students: updatedStudents,
      };
      return updated;
    });
  };

  const renderAssignmentCards = (items: typeof assignmentsData) => {
    return (
      <>
        <div className="grid grid-cols-5 bg-gray-200 p-3 rounded-md font-semibold">
          <p>Title</p>
          <p>Due</p>
          <p>Submitted</p>
          <p>Grade</p>
          <p></p>
        </div>

        {items.map((assignment, index) => (
          <Card key={index} className="w-full p-4 my-2">
            <CardContent>
              <div className="grid grid-cols-5 items-center">
                <CardTitle>{assignment.title}</CardTitle>
                <p className="text-sm">{assignment.assignedDate}</p>
                <p className="text-sm">{assignment.dueDate}</p>
                <p className="text-sm">{assignment.grade}</p>
                <button onClick={() => toggleDropdown(index)}>
                  {openDropdowns[index] ? (
                    <ChevronUp className="text-blue-600" />
                  ) : (
                    <ChevronDown className="text-blue-600" />
                  )}
                </button>
              </div>

              {openDropdowns[index] && (
                <div className="mt-4 ml-4 border-t border-gray-300 pt-2">
                  <p className="font-semibold mb-1">Student Submissions:</p>
                  <ul className="space-y-1">
                    {assignment.students.map((student, studentIdx) => {
                      const isEditing =
                        editableGrades[index]?.[studentIdx] || false;

                      return (
                        <li
                          key={studentIdx}
                          className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded"
                        >
                          <span>{student.name}</span>
                          <div className="flex items-center space-x-2">
                            {isEditing ? (
                              <input
                                type="text"
                                defaultValue={student.grade}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            ) : (
                              <span>{student.grade}</span>
                            )}

                            {student.gradedBy && (
                              <span
                                className={`text-xs font-medium ${
                                  student.gradedBy === "AI"
                                    ? "text-red-500"
                                    : "text-blue-600"
                                }`}
                              >
                                ({student.gradedBy})
                              </span>
                            )}

                            {!isEditing && student.gradedBy === "AI" && (
                              <button
                                onClick={() => handleAdjustClick(index, studentIdx)}
                                className="text-xs text-blue-600 underline hover:text-blue-800"
                              >
                                Adjust
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Students Button */}
                  <button
                    onClick={() => setStudentModalIndex(index)}
                    className="mt-3 text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    Students
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </>
    );
  };

  const pendingAssignments = assignmentsData.filter((a) => a.status !== "Completed");
  const completedAssignments = assignmentsData.filter((a) => a.status === "Completed");

  return (
    <div className="p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Class 1 - Teacher View</h1>
        <button
          className="text-blue-600 font-semibold hover:underline"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Assignment
        </button>
      </div>

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Assignment</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type here..."
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                Add rubric
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                Assignment Name
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                Class Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {studentModalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setStudentModalIndex(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Students - {assignmentsData[studentModalIndex].title}
              </h2>
              <button
                onClick={() => setStudentModalIndex(null)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {assignmentsData[studentModalIndex].students.map((student, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded"
                >
                  <span>{student.name}</span>
                  <div className="flex items-center space-x-2">
                    <span>{student.grade}</span>
                    {student.gradedBy && (
                      <span
                        className={`text-xs font-medium ${
                          student.gradedBy === "AI"
                            ? "text-red-500"
                            : "text-blue-600"
                        }`}
                      >
                        ({student.gradedBy})
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Assignment Cards */}
      <Card className="w-full bg-slate-300">
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-2">In Progress</h2>
            {renderAssignmentCards(pendingAssignments)}
          </div>
          <div>
            <h2 className="text-lg font-bold mt-6 mb-2">Completed</h2>
            {renderAssignmentCards(completedAssignments)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSubmissions;
