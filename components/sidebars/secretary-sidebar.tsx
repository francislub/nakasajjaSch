"use client"

import { Home, Users, FileText, LogOut } from "lucide-react"
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
    title: "Students",
    url: "/secretary/students",
    icon: Users,
  },
  {
    title: "Enter Marks",
    url: "/secretary/marks",
    icon: FileText,
  },
]

export function SecretarySidebar() {
  const { data: session } = useSession()

  return (
    <Sidebar className="border-r border-orange-200 bg-gradient-to-b from-orange-50 to-amber-50">
      <SidebarHeader className="border-b border-orange-200 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-orange-600 text-white">
              {session?.user?.name?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-sm text-orange-600">Secretary</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-700">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-orange-100">
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4 text-orange-600" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-orange-200 p-4">
        <Button
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
