'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { FileUp, UploadCloud } from "lucide-react";

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
        setMessage("❌ Upload failed. Please try again.");
      } else {
        setMessage("✅ Upload successful!");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-blue-50 flex items-center justify-center">
      <Card className="w-full bg-white border border-blue-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <UploadCloud className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-blue-800 text-lg font-semibold">
              Submit Your Assignment
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-blue-700" htmlFor="assignmentId">Assignment ID</Label>
            <Input
              id="assignmentId"
              type="number"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              className="border-blue-200 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-blue-700" htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border-blue-200 focus:ring-blue-500"
            />
          </div>
        </CardContent>

        <CardFooter className="bg-blue-50 border-t border-blue-100 px-6 py-4 flex flex-col gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || !assignmentId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Submit Assignment
          </Button>

          {message && (
            <p className={`text-sm text-center ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestUploadPage;