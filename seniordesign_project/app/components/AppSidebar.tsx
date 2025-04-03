"use client";
import { usePathname } from "next/navigation";
import { Home, Codepen } from "lucide-react";
import Link from "next/link";
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
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
