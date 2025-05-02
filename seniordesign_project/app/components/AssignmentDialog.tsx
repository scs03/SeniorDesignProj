"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Calendar } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_ASSIGNMENT_BY_ID } from "@/services/user_queries";

interface AssignmentDialogProps {
  assignment: any;
  openDialogId: number | null;
  setOpenDialogId: (id: number | null) => void;
  onSubmit: (assignmentId: number, file: File) => void;
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  assignment,
  openDialogId,
  setOpenDialogId,
  onSubmit,
}) => {
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = openDialogId === assignment.id;

  const { data, loading, error } = useQuery(GET_ASSIGNMENT_BY_ID, {
    variables: { assignment_id: parseInt(assignment.id, 10) },
    skip: !isOpen,
  });


const handleSubmit = async () => {
  if (!submissionFile) return;

  setIsSubmitting(true); // 🟡 Set loading
  try {
    await onSubmit(parseInt(assignment.id, 10), submissionFile);
    setSubmissionFile(null);
    setOpenDialogId(null); // ✅ Only close *after* submit finishes
  } catch (err) {
    console.error("Submission failed:", err);
    // optionally show toast or error UI
  } finally {
    setIsSubmitting(false);
  }
};


  const assignmentData = data?.assignment_by_id;

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpenDialogId(isOpen ? null : assignment.id)}>
      <DialogTrigger asChild>
        <Card
          onClick={() => setOpenDialogId(assignment.id)}
          className="cursor-pointer w-full border border-blue-100 shadow-none hover:bg-blue-50 transition-colors duration-200"
        >
          <CardHeader className="p-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-blue-700 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-blue-500" />
                {assignment.name}
              </CardTitle>
              <span className="flex items-center text-xs text-blue-500">
                <Calendar className="h-3 w-3 mr-1" /> Due: {new Date(assignment.due_date).toLocaleDateString()}
              </span>
            </div>
          </CardHeader>
        </Card>
      </DialogTrigger>

      <DialogContent className="bg-white border-blue-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-blue-800 text-lg">
            {assignmentData?.name || "Assignment Details"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-blue-600 text-sm">Loading assignment details...</p>
        ) : error || !assignmentData ? (
          <p className="text-red-500 text-sm">Failed to load assignment data.</p>
        ) : (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-blue-700">Prompt</Label>
              <p className="text-blue-600 text-sm mt-1 whitespace-pre-line">
                {assignmentData.prompt || "No prompt provided."}
              </p>
            </div>

            {assignmentData.rubric_file && (
              <div>
                <Label className="text-blue-700">Rubric</Label>
                <iframe
  src={`http://localhost:8000${assignmentData.rubric_file}?t=${Date.now()}`} // bust cache
  className="w-full h-64 mt-2 border border-blue-200 rounded"
  title="Rubric PDF Preview"
/>


              </div>
            )}

            <div>
              <Label className="text-blue-700">Upload your submission</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!submissionFile || isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700 w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;
