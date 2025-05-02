"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, Codepen, LogOut, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "@apollo/client";
import { LOGOUT_MUTATION } from "@/services/user_mutations";
import { useSession } from "@/hooks/useSession";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isTeacher = pathname.includes("/dashboard/teacher");
  const userRole: "teacher" | "student" = isTeacher ? "teacher" : "student";
  const user = useSession() as { name: string; user_id: string; role: string } | null;

  const [logout] = useMutation(LOGOUT_MUTATION);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    await logout();
    router.push("/auth/signin");
  };

  const teacherItems = [
    {
      title: "Dashboard",
      url: "/dashboard/teacher",
      icon: Home,
    },
    {
      title: "Submissions",
      url: "/dashboard/teacher/submissions",
      icon: Codepen,
    },
    {
      title: "Resources",
      url: "/dashboard/teacher/resources",
      icon: BookOpen,
    },
    {
      title: "Students",
      url: "/dashboard/teacher/students",
      icon: Users,
    },
  ];

  const studentItems = [
    {
      title: "Dashboard",
      url: "/dashboard/student",
      icon: Home,
    },
    {
      title: "Assignments",
      url: "/dashboard/student/assignments",
      icon: BookOpen,
    },
    {
      title: "Submissions",
      url: "/dashboard/student/submissions",
      icon: Codepen,
    },
  ];

  const items = userRole === "teacher" ? teacherItems : studentItems;

  return (
    <Sidebar className="bg-gradient-to-b from-blue-50 to-blue-100 border-r border-blue-200">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-center p-4 border-b border-blue-200">
            <h2 className="text-blue-800 font-medium text-lg">EduPortal</h2>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              {user && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 shadow-md">
                    <Image
                      src="/placeholder-profile.jpg"
                      alt="Teacher Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                    <p className="mt-3 text-blue-700 font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : ""}
                    </p>
                  <p className="text-sm text-blue-500">id: {user?.user_id}</p>
                  <p className="text-sm text-blue-500 opacity-50">{user?.role}</p>
                </div>
              )}
              <SidebarMenu className="mt-4">
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 ${
                          isActive
                            ? "bg-blue-200 text-blue-800"
                            : "text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        } rounded-lg mb-1`}
                      >
                        <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon size={20} className={isActive ? "text-blue-800" : "text-blue-500"} />
                          <span className="font-medium">{item.title}</span>
                          {isActive && (
                            <div className="w-1.5 h-6 bg-blue-500 absolute right-0 rounded-l-md"></div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Logout button */}
        <div className="p-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg py-2.5 shadow-sm transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </Button>
          <div className="mt-4 text-xs text-center text-blue-400">
            {userRole === "teacher" ? "Teacher Portal" : "Student Portal"} • v0.1.0
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}