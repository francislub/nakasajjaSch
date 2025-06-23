import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/sidebars/admin-sidebar"
import { TeacherSidebar } from "@/components/sidebars/teacher-sidebar"
import { ParentSidebar } from "@/components/sidebars/parent-sidebar"
import { SecretarySidebar } from "@/components/sidebars/secretary-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const getSidebarComponent = () => {
    switch (session.user.role) {
      case "ADMIN":
      case "HEADTEACHER":
        return <AdminSidebar />
      case "CLASS_TEACHER":
        return <TeacherSidebar />
      case "PARENT":
        return <ParentSidebar />
      case "SECRETARY":
        return <SecretarySidebar />
      default:
        return <AdminSidebar />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        {getSidebarComponent()}
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
