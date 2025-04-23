"use client";
import { usePathname } from "next/navigation";
import { Home, Codepen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const isTeacher = pathname.includes("/dashboard/teacher");
  const userRole: "teacher" | "student" = isTeacher ? "teacher" : "student";

  const items = [
    {
      title: "Home",
      url: userRole === "teacher" ? "/dashboard/teacher" : "/dashboard/student",
      icon: Home,
    },
    {
      title: "Submissions",
      url:
        userRole === "teacher"
          ? "/dashboard/teacher/submissions"
          : "/dashboard/student/submissions",
      icon: Codepen,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent className="bg-teal-50">
        <SidebarGroup>
          <SidebarGroupContent>
            {userRole === "teacher" && (
              <div className="flex flex-col items-center py-4">
                <div className="w-24 h-24 rounded-full bg-red-500 overflow-hidden border-4 border-red-500">
                  <Image
                    src="/placeholder-profile.jpg"
                    alt="Teacher Profile"
                    width={96}
                    height={96}
                    className="object-cover opacity-0"
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Your Profile</p>
              </div>
            )}
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
