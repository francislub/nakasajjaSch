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
import { LayoutDashboard, FileText, ClipboardCheck, User, ChevronUp, LogOut, User2 } from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

const parentMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Report Cards",
    url: "/parent/reports",
    icon: FileText,
  },
  {
    title: "Attendance",
    url: "/parent/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Child Information",
    url: "/parent/child-info",
    icon: User,
  },
]

export function ParentSidebar() {
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <Sidebar className="border-r border-purple-200 bg-gradient-to-b from-purple-50 to-white">
      <SidebarHeader className="border-b border-purple-200 bg-purple-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="text-purple-600 font-bold text-lg">HF</div>
          </div>
          <div>
            <h2 className="font-bold text-lg">Holy Family JS</h2>
            <p className="text-purple-100 text-sm">Parent Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-800 font-semibold">Child Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {parentMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-purple-100 hover:text-purple-800">
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
                <SidebarMenuButton className="hover:bg-purple-100">
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
