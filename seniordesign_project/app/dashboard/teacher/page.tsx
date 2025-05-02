"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation } from '@apollo/client';
import { GET_TEACHER_CLASSES } from '@/services/user_queries';
import { CREATE_ASSIGNMENT, ADD_STUDENTS_TO_CLASS, CREATE_CLASS } from '@/services/user_mutations';
import { useSession } from '@/hooks/useSession';
import { GetTeacherClassesData, GetTeacherClassesVars } from '@/services/types';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus } from 'lucide-react';

const TeacherHomePage = () => {
  const user = useSession() as { email: string; user_id: string } | null;
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    name: "",
    dueDate: "",
    prompt: "",
    rubricFile: null as File | null,
  });
  const [createAssignment] = useMutation(CREATE_ASSIGNMENT);
  const [addStudents] = useMutation(ADD_STUDENTS_TO_CLASS);
  const [studentDialogOpenId, setStudentDialogOpenId] = useState<number | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createClass] = useMutation(CREATE_CLASS);

  const { data, loading, error, refetch } = useQuery<GetTeacherClassesData, GetTeacherClassesVars>(
    GET_TEACHER_CLASSES,
    {
      variables: { teacherId: user ? parseInt(user.user_id, 10) : 0 },
      skip: !user,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await createAssignment({
      variables: {
        classId: parseInt(form.classId, 10),
        name: form.name,
        dueDate: form.dueDate,
        prompt: form.prompt,
      },
    });
    setOpenDialog(false);
    refetch();
  };

  const handleStudentSubmit = async () => {
    if (!studentDialogOpenId || !studentIdInput) return;
    await addStudents({
      variables: {
        classId: studentDialogOpenId,
        studentIds: [parseInt(studentIdInput, 10)],
      },
    });
    setStudentIdInput('');
    setStudentDialogOpenId(null);
    refetch();
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
        <p className="text-lg font-medium text-blue-700">Loading your classes...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <BookOpen className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-medium text-red-600">Oops! We couldn't load your classes.</p>
        <p className="text-sm text-red-500 mt-2">Please try again later.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-blue-100">
        <div>
          <h1 className="text-2xl font-semibold text-blue-800">AI Teaching Assistant Dashboard</h1>
          <p className="text-blue-600">Your friendly essay grading companion</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Create Class Dialog */}
          <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-blue-600 border-blue-300">
                <Plus className="h-4 w-4 mr-2" /> Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Class</DialogTitle>
                <DialogDescription>Enter a class name to create a new class.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Label htmlFor="new-class-name">Class Name</Label>
                <Input
                  id="new-class-name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. English Literature"
                />
                <Button
                  onClick={async () => {
                    await createClass({ variables: { name: newClassName } });
                    setNewClassName('');
                    setClassDialogOpen(false);
                    refetch();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Assignment Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-blue-200">
              <DialogHeader>
                <DialogTitle className="text-blue-800 text-xl">Create a New Assignment</DialogTitle>
                <DialogDescription className="text-blue-600">
                  Let our AI TA help your students improve their writing skills.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-blue-700">Class</Label>
                  <select
                    name="classId"
                    value={form.classId}
                    onChange={e => setForm({ ...form, classId: e.target.value })}
                    className="w-full rounded-md border border-blue-200 px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a class</option>
                    {data?.teacher_classes.map(classItem => (
                      <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-blue-700">Assignment Name</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="border-blue-200 focus:ring-blue-500"
                    placeholder="Essay on Literature Analysis..."
                  />
                </div>
                <div>
                  <Label className="text-blue-700">Due Date</Label>
                  <Input
                    name="dueDate"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-blue-700">Assignment Prompt</Label>
                  <Textarea
                    name="prompt"
                    value={form.prompt}
                    onChange={handleChange}
                    className="border-blue-200 focus:ring-blue-500 min-h-32"
                    placeholder="Describe the assignment instructions here..."
                  />
                </div>
                <div>
                  <Label className="text-blue-700">Upload Rubric (PDF)</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setForm({ ...form, rubricFile: e.target.files?.[0] || null })}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  Create Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Class cards would go here */}
    </div>
  );
};

export default TeacherHomePage;
