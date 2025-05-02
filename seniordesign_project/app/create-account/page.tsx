'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_USER_MUTATION } from '@/services/user_mutations'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, UserPlus, School, BookOpen } from 'lucide-react'

export default function CreateAccountPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })

  const [registerUser, { loading, error }] = useMutation(CREATE_USER_MUTATION)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (role: string) => {
    setForm({ ...form, role })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await registerUser({ variables: form })
      console.log('User registered:', res.data.registerUser)
      router.push('/auth/signin')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-100 p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-blue-800 text-center">Create an Account</h1>
          <p className="text-blue-600 text-center mt-2">Join our AI teaching assistant platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="name" className="text-blue-700 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-500" />
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-blue-700 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-blue-500" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-blue-700 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-blue-500" />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Create a password"
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-blue-700 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
              I am a...
            </Label>
            <Select value={form.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full mt-1 border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student" className="flex items-center">
                  <School className="h-4 w-4 mr-2 text-blue-500 inline" />
                  Student
                </SelectItem>
                <SelectItem value="teacher" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-blue-500 inline" />
                  Teacher
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error.message}
            </div>
          )}
          
          <div className="text-center mt-6 text-blue-600 text-sm">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => router.push('/auth/signin')}
              className="text-blue-700 font-medium hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}