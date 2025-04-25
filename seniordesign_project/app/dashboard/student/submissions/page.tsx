"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TestUploadPage = () => {
  const [assignmentId, setAssignmentId] = useState("10");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();

    const operations = JSON.stringify({
      query: `
        mutation SubmitAssignment($assignment_id: Int!, $submission_file: Upload!) {
          submit_assignment(assignment_id: $assignment_id, submission_file: $submission_file)
        }
      `,
      variables: {
        assignment_id: parseInt(assignmentId, 10),
        submission_file: null,
      },
    });

    const map = JSON.stringify({
      "0": ["variables.submission_file"],
    });

    formData.append("operations", operations);
    formData.append("map", map);
    formData.append("0", file);

    try {
      const res = await fetch("http://localhost:8000/graphql", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (json.errors) {
        console.error(json.errors);
        setMessage("Upload failed.");
      } else {
        setMessage("Upload successful!");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Test Assignment Upload</h1>

      <div className="space-y-2">
        <Label htmlFor="assignmentId">Assignment ID</Label>
        <Input
          id="assignmentId"
          type="number"
          value={assignmentId}
          onChange={(e) => setAssignmentId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Upload File</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !assignmentId}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Submit Assignment
      </Button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
};

export default TestUploadPage;
