"use client"

import { Home, User, Calendar, FileText, LogOut } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Child Information",
    url: "/parent/child-info",
    icon: User,
  },
  {
    title: "Attendance",
    url: "/parent/attendance",
    icon: Calendar,
  },
  {
    title: "Reports",
    url: "/parent/reports",
    icon: FileText,
  },
]

export function ParentSidebar() {
  const { data: session } = useSession()

  return (
    <Sidebar className="border-r border-purple-200 bg-gradient-to-b from-purple-50 to-pink-50">
      <SidebarHeader className="border-b border-purple-200 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-purple-600 text-white">
              {session?.user?.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-sm text-purple-600">Parent</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-700">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-purple-100">
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4 text-purple-600" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-purple-200 p-4">
        <Button
          variant="outline"
          className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
