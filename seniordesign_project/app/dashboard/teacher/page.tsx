'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useQuery } from '@apollo/client'
import { GET_TEACHER_CLASSES } from '@/services/user_queries'
import { useSession } from '@/hooks/useSession'
import { GetTeacherClassesData, GetTeacherClassesVars } from '@/services/types'

const TeacherHomePage = () => {
  const user = useSession() as { email: string; user_id: string } | null

  const { data, loading, error } = useQuery<GetTeacherClassesData, GetTeacherClassesVars>(
    GET_TEACHER_CLASSES,
    {
      variables: { teacherId: user ? parseInt(user.user_id, 10) : 0 },
      skip: !user,
    }
  )

  if (loading) return <div className="p-4">Loading your classes...</div>
  if (error) return <div className="p-4 text-red-500">Error loading classes.</div>

  return (
    <div className="p-4 w-full space-y-4">
      {data?.teacher_classes.map(classItem => (
        <Card key={classItem.id} className="w-full bg-slate-300">
          <CardHeader>
            <CardTitle>{classItem.name}</CardTitle>
            <CardDescription>Class ID: {classItem.id} — Students: {classItem.student_count}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {classItem.assignments.length === 0 ? (
              <p className="text-sm text-gray-600">No assignments yet</p>
            ) : (
              classItem.assignments.map(assignment => (
                <Card key={assignment.id} className="w-full">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {assignment.name}
                      <span className="text-sm text-gray-500"> (Due: {new Date(assignment.due_date).toLocaleDateString()})</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TeacherHomePage
