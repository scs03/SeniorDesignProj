"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { LOGIN_MUTATION } from "@/services/user_mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, LogIn, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Use Apollo's useMutation hook to call login
  const [login] = useMutation(LOGIN_MUTATION);

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
  
    try {
      const { data } = await login({
        variables: {
          email,
          password,
        },
      });
  
      if (data?.login) {
        const userData = data.login;
  
        // 🔐 Set user in localStorage **before** redirect
        localStorage.setItem("user", JSON.stringify(userData));
        
        const role = userData.role.trim().toLowerCase();
  
        if (role === "teacher") {
          router.push("/dashboard/teacher");
        } else if (role === "student") {
          router.push("/dashboard/student");
        } else {
          setError("Invalid role assignment. Please contact support.");
        }
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md border border-blue-200 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-6 pt-8">
          <div className="flex flex-col items-center">
            <BookOpen className="h-10 w-10 mb-3 text-blue-100" />
            <CardTitle className="text-center text-xl font-semibold">Sign In to EduPortal</CardTitle>
            <p className="text-blue-100 text-sm mt-1">Access your educational dashboard</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col space-y-5 pt-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email" className="text-blue-700">Email Address</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pl-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password" className="text-blue-700">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-blue-500 hover:text-blue-600">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pl-3 py-2"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button 
            onClick={handleSignIn} 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-lg shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-blue-600">
            Don't have an account?{" "}
            <Link href="/create-account" className="font-medium text-blue-700 hover:text-blue-800">
              Create one now
            </Link>
          </div>
        </CardContent>
        
        <CardFooter className="bg-blue-50 border-t border-blue-200 flex justify-center py-3">
          <Link 
            href="/chooser" 
            className="text-blue-500 text-sm flex items-center hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Welcome Page
          </Link>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-blue-400 text-xs text-center">
        <p>© 2025 EduPortal • All rights reserved</p>
        <p className="mt-1">Need help? Contact support@eduportal.example.com</p>
      </div>
    </div>
  );
}