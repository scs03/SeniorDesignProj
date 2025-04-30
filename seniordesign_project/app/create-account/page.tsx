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
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-3xl font-semibold text-center">Create an Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={form.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </Button>

        {error && <p className="text-red-600 text-sm">{error.message}</p>}
      </form>
    </div>
  )
}
