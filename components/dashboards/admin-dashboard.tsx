"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, FileText, Download, Eye } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSubjects: number
  attendanceRate: number
  reportCardsGenerated: number
  classDistribution: Array<{ name: string; students: number }>
  monthlyRegistrations: Array<{ month: string; students: number }>
  performanceByClass: Array<{ class: string; average: number; count: number }>
  weeklyAttendance: Array<{ day: string; rate: number; present: number; total: number }>
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"]

const GRADIENT_COLORS = [
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-orange-400 to-orange-600",
  "from-purple-400 to-purple-600",
]

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    attendanceRate: 0,
    reportCardsGenerated: 0,
    classDistribution: [],
    monthlyRegistrations: [],
    performanceByClass: [],
    weeklyAttendance: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats")
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Holy Family Junior School - Nakasajja</p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Eye className="w-4 h-4 mr-2" />
            View All Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={`bg-gradient-to-br ${GRADIENT_COLORS[0]} text-white shadow-lg border-0 hover:shadow-xl transition-shadow`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
            <p className="text-xs text-white mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Active enrollment
            </p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${GRADIENT_COLORS[1]} text-white shadow-lg border-0 hover:shadow-xl transition-shadow`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Class Teachers</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTeachers}</div>
            <p className="text-xs text-white mt-1">Active teachers</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${GRADIENT_COLORS[2]} text-white shadow-lg border-0 hover:shadow-xl transition-shadow`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalClasses}</div>
            <p className="text-xs text-white mt-1">Active classes</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${GRADIENT_COLORS[3]} text-white shadow-lg border-0 hover:shadow-xl transition-shadow`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.attendanceRate}%</div>
            <p className="text-xs text-white mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Student Distribution by Class</CardTitle>
            <CardDescription>Current enrollment across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.classDistribution.map((item, index) => ({
                    ...item,
                    fill: COLORS[index % COLORS.length],
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, students }) => `${name}: ${students}`}
                  outerRadius={120}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="students"
                >
                  {stats.classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Registrations */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Monthly Student Registrations</CardTitle>
            <CardDescription>New student enrollments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#22C55E"
                  strokeWidth={3}
                  dot={{ fill: "#22C55E", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Class Performance Overview</CardTitle>
            <CardDescription>Average performance by class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.performanceByClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Attendance */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Weekly Attendance Overview</CardTitle>
            <CardDescription>Daily attendance rates for current week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#F472B6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          <CardDescription>Frequently used administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700">
              <FileText className="w-6 h-6 mb-2" />
              Generate Report Cards
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700">
              <Users className="w-6 h-6 mb-2" />
              Manage Users
            </Button>
            <Button className="h-20 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700">
              <BookOpen className="w-6 h-6 mb-2" />
              Academic Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
