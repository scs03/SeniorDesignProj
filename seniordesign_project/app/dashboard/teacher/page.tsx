import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TeacherHomePage = () => {
  return (
    <div className='p-4 w-full '>
      <Card className='w-full bg-slate-300'>
        <CardHeader>
          <CardTitle>Class 1.</CardTitle>
          <CardDescription>Dr. Alagar</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>

          <Card className='w-full '>
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
  )
}

export default TeacherHomePage
