import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SecretarySidebar } from "@/components/sidebars/secretary-sidebar"

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "SECRETARY") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <SecretarySidebar />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
