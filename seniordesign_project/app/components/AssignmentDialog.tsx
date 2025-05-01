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
import { SUBMIT_ASSIGNMENT } from "@/services/user_mutations";

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

  const handleSubmit = () => {
    if (submissionFile) {
      onSubmit(assignment.id, submissionFile);
      setOpenDialogId(null);
      setSubmissionFile(null);
    }
  };

  return (
    <Dialog
      open={openDialogId === assignment.id}
      onOpenChange={() => setOpenDialogId(openDialogId === assignment.id ? null : assignment.id)}
    >
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
          <DialogTitle className="text-blue-800 text-lg">{assignment.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-blue-700">Prompt</Label>
            <p className="text-blue-600 text-sm mt-1 whitespace-pre-line">
              {assignment.prompt || "No prompt provided."}
            </p>
          </div>
          {assignment.rubric_file && (
            <div>
              <Label className="text-blue-700">Rubric</Label>
              <iframe
                src={assignment.rubric_file}
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
            disabled={!submissionFile}
            className="bg-blue-600 text-white hover:bg-blue-700 w-full"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;
