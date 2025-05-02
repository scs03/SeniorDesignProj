// app/dashboard/layout.tsx (do NOT add 'use client')
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar"; // ✅ fixed import
import AuthWrapper from "@/components/AuthWrapper";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Teacher Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <body>
      <AuthWrapper>
        <div className="flex h-screen w-screen overflow-hidden">
          <SidebarProvider>
            <div className="flex h-full w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <div className="relative">
                  <SidebarTrigger className="absolute top-4 left-4 z-10" />
                  <div className="w-full pt-16">{children}</div>
                </div>
              </main>
            </div>
          </SidebarProvider>
        </div>
      </AuthWrapper>
    </body>
  );
}
