"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  FileText,
  MessageSquare,
  ChevronUp,
  LogOut,
  User2,
} from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

const teacherMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Students",
    url: "/teacher/students",
    icon: Users,
  },
  {
    title: "Attendance",
    url: "/teacher/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Marks Entry",
    url: "/teacher/marks",
    icon: BookOpen,
  },
  {
    title: "Student Assessment",
    url: "/teacher/assessment",
    icon: FileText,
  },
  {
    title: "Class Reports",
    url: "/teacher/reports",
    icon: MessageSquare,
  },
]

export function TeacherSidebar() {
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <Sidebar className="border-r border-green-200 bg-gradient-to-b from-green-50 to-white">
      <SidebarHeader className="border-b border-green-200 bg-green-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="text-green-600 font-bold text-lg">HF</div>
          </div>
          <div>
            <h2 className="font-bold text-lg">Holy Family JS</h2>
            <p className="text-green-100 text-sm">Teacher Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-800 font-semibold">Class Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teacherMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-green-100 hover:text-green-800">
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:bg-green-100">
                  <User2 className="w-4 h-4" />
                  <span>{session?.user?.name}</span>
                  <ChevronUp className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <User2 className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
