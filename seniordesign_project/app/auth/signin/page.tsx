"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { LOGIN_MUTATION } from "@/services/user_mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const { role } = data.login;
        if (role.trim() === "teacher") {
          router.push("/dashboard/teacher");
        } else if (role.trim().toLowerCase() === "student") {
          router.push("/dashboard/student");
        } else {
          setError("Invalid role.");
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
    <div className="relative flex items-center justify-center min-h-screen bg-teal-100 overflow-hidden">
      {/* Decorative white circles */}
      <div className="absolute w-72 h-72 bg-white opacity-90 rounded-full -top-16 -left-16"></div>
      <div className="absolute w-40 h-40 bg-white opacity-80 rounded-full bottom-10 right-10"></div>
      <div className="absolute w-32 h-32 bg-white opacity-85 rounded-full top-24 right-32"></div>


      {/* Sign-in card */}
      <Card className="w-[400px] shadow-lg z-10">
        <CardHeader>
          <CardTitle className="text-center text-xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button onClick={handleSignIn} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
