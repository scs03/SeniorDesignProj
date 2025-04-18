// hooks/useSession.ts
import { useEffect, useState } from 'react'

export function useSession() {
  const [user, setUser] = useState<null | { email: string }>(null)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
        console.log('User found in localStorage:', JSON.parse(storedUser))
      }
    } catch (e) {
      console.error("Failed to parse user:", e)
    }
  }, [])

  return user
}
