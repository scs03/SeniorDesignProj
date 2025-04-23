"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TeacherHomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-4 w-full bg-teal-100 min-h-screen">
      {/* Add Assignment Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-[#129490] font-semibold"
        >
          + Add Assignment
        </Button>
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
              <div>
                <label className="block text-sm font-medium mb-1">Upload Rubric</label>
                <input
                  type="file"
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assignment Name</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded-md"
                  placeholder="Enter assignment name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class Name</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded-md"
                  placeholder="Enter class name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <Button
                className="w-full bg-[#129490] text-white"
                onClick={() => setIsModalOpen(false)}
              >
                Save Assignment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card UI */}
      <Card className="w-full" style={{ backgroundColor: "#129490" }}>
        <CardHeader>
          <CardTitle className="text-white">Class 1.</CardTitle>
          <CardDescription className="text-white">Dr. Alagar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white">Card Content</p>

          <Card className="w-full bg-white mt-4">
            <CardHeader>
              <CardTitle>Class 1.</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherHomePage;
