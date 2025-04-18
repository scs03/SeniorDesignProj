'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/hooks/useSession"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/components/AppSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useSession()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true) // Ensure client-side only
  }, [])

  useEffect(() => {
    if (isClient && !user) {
      router.push("/auth/signin")
    }
  }, [isClient, user, router])

  if (!isClient || !user) {
    return null // optional: show spinner while checking session
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex h-full w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="relative">
              <SidebarTrigger className="absolute top-4 left-4 z-10" />
              <div className="w-full pt-16">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
