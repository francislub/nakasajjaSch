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
  GraduationCap,
  BookOpen,
  Settings,
  BarChart3,
  ChevronUp,
  LogOut,
  User2,
  Award,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Academic Management",
    icon: BookOpen,
    items: [
      { title: "Academic Years", url: "/admin/academic-years" },
      { title: "Terms", url: "/admin/terms" },
      { title: "Classes", url: "/admin/classes" },
      { title: "Subjects", url: "/admin/subjects" },
    ],
  },
  {
    title: "User Management",
    icon: Users,
    items: [
      { title: "All Users", url: "/admin/users" },
      { title: "Class Teachers", url: "/admin/users/teachers" },
      { title: "Secretaries", url: "/admin/users/secretaries" },
      { title: "Parents", url: "/admin/users/parents" },
    ],
  },
  {
    title: "Student Management",
    icon: GraduationCap,
    items: [
      { title: "All Students", url: "/admin/students" },
      { title: "Register Student", url: "/admin/students/register" },
      { title: "Student Reports", url: "/admin/students/reports" },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    items: [
      { title: "Report Cards", url: "/admin/reports/cards" },
      { title: "Attendance Reports", url: "/admin/reports/attendance" },
      { title: "Performance Analytics", url: "/admin/reports/performance" },
    ],
  },
  {
    title: "Grading System",
    url: "/admin/grading",
    icon: Award,
  },
  // {
  //   title: "Settings",
  //   url: "/admin/settings",
  //   icon: Settings,
  // },
]

export function AdminSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const isActive = (url: string) => pathname === url

  return (
    <Sidebar className="border-r border-blue-200 bg-gradient-to-b from-blue-50 to-white">
      <SidebarHeader className="border-b border-blue-200 bg-blue-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
            <div className="text-blue-600 font-bold text-lg">HF</div>
          </div>
          <div>
            <h2 className="font-bold text-lg">Holy Family JS</h2>
            <p className="text-blue-100 text-sm">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-800 font-semibold px-2 py-1">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="hover:bg-blue-100 hover:text-blue-800 data-[state=open]:bg-blue-100 data-[state=open]:text-blue-800">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-1">
                          {item.items.map((subItem) => (
                            <SidebarMenuButton
                              key={subItem.title}
                              asChild
                              className={`hover:bg-blue-50 hover:text-blue-700 text-sm ${
                                isActive(subItem.url) ? "bg-blue-100 text-blue-800 font-medium" : ""
                              }`}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      className={`hover:bg-blue-100 hover:text-blue-800 ${
                        isActive(item.url) ? "bg-blue-100 text-blue-800 font-medium" : ""
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-blue-200" />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover:bg-blue-100 data-[state=open]:bg-blue-100">
                  <User2 className="w-4 h-4" />
                  <span className="truncate">{session?.user?.name}</span>
                  <ChevronUp className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] mb-2">
                <DropdownMenuItem className="cursor-pointer">
                  <User2 className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
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
