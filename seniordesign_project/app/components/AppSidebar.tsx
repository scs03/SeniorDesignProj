"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, Codepen, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "@apollo/client";
import { LOGOUT_MUTATION } from "@/services/user_mutations";

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

  const [logout] = useMutation(LOGOUT_MUTATION);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    await logout();
    router.push("/auth/signin");
  };

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
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
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
        </div>

        {/* Logout button */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
