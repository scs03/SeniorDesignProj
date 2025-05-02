// app/chooser/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, UserPlus, LogIn } from 'lucide-react';

export default function ChooserPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-blue-100" />
          <h1 className="text-2xl font-semibold">Welcome to EduPortal</h1>
          <p className="text-blue-100 mt-2">Your educational journey starts here</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center text-blue-700 mb-4">
            <p>Please sign in to access your dashboard or create a new account</p>
          </div>
          
          <Button 
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-5 rounded-lg shadow-sm"
          >
            <LogIn className="h-5 w-5" />
            Sign In to Your Account
          </Button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-blue-200"></div>
            <span className="flex-shrink mx-3 text-blue-400 text-sm">or</span>
            <div className="flex-grow border-t border-blue-200"></div>
          </div>
          
          <Button 
            onClick={() => router.push('/create-account')}
            variant="outline"
            className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 py-5 rounded-lg"
          >
            <UserPlus className="h-5 w-5" />
            Create New Account
          </Button>
          
          <p className="text-xs text-center text-blue-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-blue-500 text-sm">
        © 2025 EduPortal • Learning Management System
      </div>
    </div>
  );
}