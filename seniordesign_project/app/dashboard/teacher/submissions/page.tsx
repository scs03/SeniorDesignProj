"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const assignments = [
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
      { name: "Quincy", grade: "23/25", gradedBy: "AI" },
      { name: "John", grade: "25/25", gradedBy: "Manual" },
      { name: "Alice", grade: "21/25", gradedBy: "AI" },
    ],
  },
  {
    title: "To Kill a Mockingbird Essay",
    assignedDate: "Feb 10, 25",
    dueDate: "Feb 20, 25",
    status: "Pending",
    grade: "-",
    students: [
      { name: "John", grade: "-" },
      { name: "Jason", grade: "-" },
    ],
  },
];

const TeacherSubmissions = () => {
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>(
    {}
  );
  const [editedGrades, setEditedGrades] = useState<{ [key: string]: string }>(
    {}
  );
  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});

  const toggleDropdown = (index: number) => {
    setOpenDropdowns((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const renderAssignmentCards = (items: typeof assignments) => (
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
                  {assignment.students.map((student, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between text-sm bg-gray-100 p-2 rounded"
                    >
                      <span>{student.name}</span>
                      <div className="flex items-center gap-2">
                        {editing[`${index}-${idx}`] ? (
                          <>
                            <input
                              type="text"
                              value={
                                editedGrades[`${index}-${idx}`] ??
                                student.grade ??
                                ""
                              }
                              onChange={(e) =>
                                setEditedGrades({
                                  ...editedGrades,
                                  [`${index}-${idx}`]: e.target.value,
                                })
                              }
                              className="border border-gray-400 rounded px-2 py-1 text-sm w-20"
                            />
                            <button
                              className="text-green-600 text-xs font-semibold"
                              onClick={() => {
                                student.grade =
                                  editedGrades[`${index}-${idx}`];
                                student.gradedBy = "Manual";
                                setEditing({
                                  ...editing,
                                  [`${index}-${idx}`]: false,
                                });
                              }}
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{student.grade}</span>
                            <span
                              className={`text-white text-xs px-2 py-1 rounded ${
                                student.gradedBy === "AI"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }`}
                            >
                              {student.gradedBy === "AI" ? "AI" : "Manual"}
                            </span>
                            {student.gradedBy === "AI" && (
                              <button
                                className="text-blue-500 text-xs underline ml-2"
                                onClick={() =>
                                  setEditing({
                                    ...editing,
                                    [`${index}-${idx}`]: true,
                                  })
                                }
                              >
                                Adjust
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );

  const pendingAssignments = assignments.filter(
    (a) => a.status !== "Completed"
  );
  const completedAssignments = assignments.filter(
    (a) => a.status === "Completed"
  );

  return (
    <div className="p-4 w-full">
      <Card className="w-full bg-slate-300">
        <CardHeader>
          <CardTitle>Class 1 - Teacher View</CardTitle>
        </CardHeader>
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
