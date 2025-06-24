"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  Eye,
  UserPlus,
  ClipboardList,
  BarChart3,
  Award,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface RecentRegistration {
  id: string
  name: string
  photo?: string
  class: {
    name: string
  }
  parent: {
    name: string
    email: string
  }
  createdAt: string
}

interface ClassStats {
  className: string
  studentCount: number
  subjectCount: number
  marksEntered: number
  completionRate: number
}

interface SubjectPerformance {
  subjectName: string
  averageScore: number
  totalStudents: number
  grade: string
}

interface RecentActivity {
  id: string
  type: "MARK_ENTRY" | "STUDENT_REGISTRATION" | "REPORT_GENERATION"
  description: string
  timestamp: string
  user: string
}

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalSubjects: number
  marksEntered: number
  pendingReports: number
  completionRate: number
  recentRegistrations: RecentRegistration[]
  studentsPerClass: ClassStats[]
  subjectPerformance: SubjectPerformance[]
  recentActivity: RecentActivity[]
  academicYear: string
  currentTerm: string
}

export default function SecretaryDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      else setLoading(true)

      const response = await fetch("/api/secretary/dashboard-stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        if (showRefreshToast) {
          toast({
            title: "Success",
            description: "Dashboard data refreshed successfully",
          })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
          <p className="text-violet-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 min-h-screen">
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">There was an issue loading the dashboard data</p>
            <Button onClick={() => fetchStats()} className="bg-violet-600 hover:bg-violet-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Secretary Dashboard
          </h1>
          <p className="text-gray-600 mt-2 flex items-center space-x-4">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Academic Year: {stats.academicYear}
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Current Term: {stats.currentTerm}
            </span>
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            variant="outline"
            className="border-violet-200 text-violet-600 hover:bg-violet-50"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent mr-2" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Link href="/admin/students/register">
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Student
            </Button>
          </Link>
          <Link href="/secretary/marks">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
              <ClipboardList className="w-4 h-4 mr-2" />
              Enter Marks
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Students</CardTitle>
            <Users className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-blue-200 mt-1">Registered this year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Active Classes</CardTitle>
            <GraduationCap className="h-5 w-5 text-emerald-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-emerald-200 mt-1">Running classes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Subjects</CardTitle>
            <BookOpen className="h-5 w-5 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-amber-200 mt-1">Being taught</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Marks Entered</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.marksEntered}</div>
            <p className="text-xs text-purple-200 mt-1">Assessment records</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <span>Class Performance Overview</span>
            </CardTitle>
            <CardDescription>Student distribution and completion rates by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.studentsPerClass.length > 0 ? (
                stats.studentsPerClass.map((classData, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
                        <span className="font-semibold text-gray-900">{classData.className}</span>
                        <Badge variant="outline" className="text-violet-600 border-violet-300">
                          {classData.studentCount} students
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <div className="font-bold text-violet-600">{classData.completionRate}%</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{classData.subjectCount} subjects</span>
                        <span>{classData.marksEntered} marks entered</span>
                      </div>
                      <Progress value={classData.completionRate} className="h-2" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No class data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Subject Performance</span>
            </CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.subjectPerformance.length > 0 ? (
                stats.subjectPerformance.map((subject, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{subject.subjectName}</span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">Grade {subject.grade}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-bold ${getPerformanceColor(subject.averageScore)}`}>
                        {subject.averageScore}%
                      </span>
                      <span className="text-gray-500">{subject.totalStudents} students</span>
                    </div>
                    <Progress value={subject.averageScore} className="h-1.5 mt-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No performance data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Recent Registrations</span>
            </CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRegistrations.length > 0 ? (
                stats.recentRegistrations.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                  >
                    <Avatar className="w-10 h-10 ring-2 ring-blue-200">
                      <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-blue-600">{student.class.name}</p>
                      <p className="text-xs text-gray-500">{student.parent.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recent registrations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">by {activity.user}</p>
                        <p className="text-xs text-purple-600">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-gray-800">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/admin/students/register">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-violet-200 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 transition-all duration-300 group"
              >
                <UserPlus className="w-6 h-6 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-violet-700 font-medium">Register Student</span>
              </Button>
            </Link>
            <Link href="/secretary/marks">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-emerald-200 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 group"
              >
                <ClipboardList className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-emerald-700 font-medium">Enter Marks</span>
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-blue-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group"
              >
                <Eye className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-blue-700 font-medium">View Students</span>
              </Button>
            </Link>
            <Link href="/admin/reports/performance">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 border-amber-200 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 transition-all duration-300 group"
              >
                <BarChart3 className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-amber-700 font-medium">View Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { SecretaryDashboard }
