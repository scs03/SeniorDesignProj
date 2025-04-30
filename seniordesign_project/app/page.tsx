// app/chooser/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ChooserPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h1 className="text-2xl font-bold">Welcome!</h1>
      <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
      <Button onClick={() => router.push('/create-account')}>Create Account</Button>
    </div>
  )
} 
