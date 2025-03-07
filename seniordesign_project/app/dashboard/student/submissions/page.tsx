import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CircleCheckBig} from "lucide-react"


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
  return (
    <div className='p-4 w-full '>
      <Card className='w-full bg-slate-300'>
        <CardHeader>
          <CardTitle>Class 1.</CardTitle>
        </CardHeader>
        <CardContent>

        <div className="grid grid-cols-5 bg-gray-200 p-3 rounded-md font-semibold">
        <p>Title</p>
        <p>Due</p>
        <p>Submitted</p>
        <p className=''>Grade</p>
        <p> </p>
      </div>

      {/* Table Rows as Cards */}
      {assignments.map((assignment, index) => (
        <Card key={index} className="w-full p-4 my-2">
          <CardContent className="grid grid-cols-5 items-center">
            <CardTitle>{assignment.title}</CardTitle>
            <p className='text-sm'>{assignment.assignedDate}</p>
            <p className='text-sm'>{assignment.dueDate}</p>
            <p className='text-sm'>{assignment.grade}</p>
            <CircleCheckBig className={assignment.status === "Completed" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}></CircleCheckBig>
          </CardContent>
        </Card>
      ))}


        </CardContent>
      </Card>
    </div>
  )
}

export default Submissions
