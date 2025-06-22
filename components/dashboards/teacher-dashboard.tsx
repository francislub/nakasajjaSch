"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ClipboardCheck, BookOpen, MessageSquare, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface TeacherStats {
  totalStudents: number
  presentToday: number
  attendanceRate: number
  pendingMarks: number
  completedAssessments: number
  weeklyAttendance: Array<{ day: string; present: number; absent: number }>
  subjectPerformance: Array<{ subject: string; average: number }>
  className: string
}

export function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
    pendingMarks: 0,
    completedAssessments: 0,
    weeklyAttendance: [],
    subjectPerformance: [],
    className: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/teacher/dashboard-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">{stats.className} - Class Management Portal</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/teacher/attendance">
            <Button className="bg-green-600 hover:bg-green-700">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Take Attendance
            </Button>
          </Link>
          <Link href="/teacher/marks">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <BookOpen className="w-4 h-4 mr-2" />
              Enter Marks
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Students</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Total enrolled</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Present Today</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.presentToday}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {stats.attendanceRate}% attendance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Marks</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingMarks}</div>
            <p className="text-xs text-orange-600 mt-1">Assignments to grade</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assessments</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completedAssessments}</div>
            <p className="text-xs text-green-600 mt-1">Completed this term</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Weekly Attendance</CardTitle>
            <CardDescription>Daily attendance for your class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#10B981" name="Present" />
                <Bar dataKey="absent" fill="#EF4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Subject Performance</CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          <CardDescription>Common tasks for class management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/teacher/attendance">
              <Button className="h-16 w-full flex flex-col items-center justify-center bg-green-600 hover:bg-green-700">
                <ClipboardCheck className="w-5 h-5 mb-1" />
                Take Attendance
              </Button>
            </Link>
            <Link href="/teacher/marks">
              <Button className="h-16 w-full flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mb-1" />
                Enter Marks
              </Button>
            </Link>
            <Link href="/teacher/assessment">
              <Button className="h-16 w-full flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700">
                <MessageSquare className="w-5 h-5 mb-1" />
                Student Assessment
              </Button>
            </Link>
            <Link href="/teacher/students">
              <Button className="h-16 w-full flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-700">
                <Users className="w-5 h-5 mb-1" />
                View Students
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
