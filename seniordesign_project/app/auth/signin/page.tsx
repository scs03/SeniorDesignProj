"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const { user, isLoading } = useUser(); // Get Auth0 user data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If user is logged in, redirect based on role
  if (user) {
    if (user.email.includes("teacher")) {
      router.push("/dashboard/teacher");
    } else if (user.email.includes("student")) {
      router.push("/dashboard/student");
    } else {
      router.push("/dashboard");
    }
  }

  // Function to initiate Auth0 login
  const handleAuth0SignIn = () => {
    router.push("/api/auth/login"); // Redirect to Auth0 login
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button onClick={handleAuth0SignIn} className="w-full">
            Sign In with Auth0
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
