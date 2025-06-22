import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard"
import { ParentDashboard } from "@/components/dashboards/parent-dashboard"
import { SecretaryDashboard } from "@/components/dashboards/secretary-dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const getDashboardComponent = () => {
    switch (session.user.role) {
      case "ADMIN":
      case "HEADTEACHER":
        return <AdminDashboard />
      case "CLASS_TEACHER":
        return <TeacherDashboard />
      case "PARENT":
        return <ParentDashboard />
      case "SECRETARY":
        return <SecretaryDashboard />
      default:
        return <AdminDashboard />
    }
  }

  return getDashboardComponent()
}
