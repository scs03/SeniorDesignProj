"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleCheckBig } from "lucide-react";

const assignments = [
  {
    title: "Analysis of Lord of the Flies",
    assignedDate: "Feb 1, 25",
    dueDate: "Feb 10, 25",
    status: "Pending",
    grade: "-"
  },
  {
    title: "Macbeth Character Study",
    assignedDate: "Feb 5, 25",
    dueDate: "Feb 15, 25",
    status: "Completed",
    grade: "23/25"
  },
  {
    title: "To Kill a Mockingbird Essay",
    assignedDate: "Feb 10, 25",
    dueDate: "Feb 20, 25",
    status: "Pending",
    grade: "-"
  },
];

const Submissions = () => {
  const [showModal, setShowModal] = useState(false);
  const [assignmentName, setAssignmentName] = useState("");
  const [file, setFile] = useState(null);

  const pendingAssignments = assignments.filter(a => a.status !== "Completed");
  const completedAssignments = assignments.filter(a => a.status === "Completed");

  const renderAssignmentCards = (items) => (
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
          <CardContent className="grid grid-cols-5 items-center">
            <CardTitle>{assignment.title}</CardTitle>
            <p className='text-sm'>{assignment.assignedDate}</p>
            <p className='text-sm'>{assignment.dueDate}</p>
            <p className='text-sm'>{assignment.grade}</p>
            <CircleCheckBig className={assignment.status === "Completed" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"} />
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className='p-4 w-full bg-teal-100 min-h-screen'>
      <Card className='w-full' style={{ backgroundColor: "#129490" }}>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-white">Class 1.</CardTitle>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Assignment
          </button>
        </CardHeader>

        <CardContent className="space-y-6 text-white">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Submit Assignment</h2>
            <label className="block mb-2 text-sm font-medium">Assignment Name</label>
            <input
              type="text"
              value={assignmentName}
              onChange={(e) => setAssignmentName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Enter assignment title"
            />
            <label className="block mb-2 text-sm font-medium">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("Submitted:", assignmentName, file);
                  setShowModal(false);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
