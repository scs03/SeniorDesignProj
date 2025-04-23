import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const StudentHomePage = () => {
  return (
    // Right-hand side main content with teal background
    <div className="p-4 w-full bg-teal-100 min-h-screen">
      <Card className="w-full" style={{ backgroundColor: "#129490" }}>
        <CardHeader>
          <CardTitle className="text-white">Class 1.</CardTitle>
          <CardDescription className="text-white">Dr. Alagar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white">Card Content</p>

          <Card className="w-full bg-white">
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

export default StudentHomePage;
