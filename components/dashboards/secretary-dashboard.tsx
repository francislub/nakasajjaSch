"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, BookOpen, GraduationCap, FileText, Plus, TrendingUp, Calendar, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface RecentRegistration {
  id: string
  name: string
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
}

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalSubjects: number
  marksEntered: number
  recentRegistrations: RecentRegistration[]
  studentsPerClass: ClassStats[]
  academicYear: string
}

export default function SecretaryDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/secretary/dashboard-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error("Failed to fetch stats")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Unable to load dashboard information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Secretary Dashboard</h1>
          <p className="text-gray-600 mt-1">Academic Year: {stats.academicYear}</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/students/register">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Student
            </Button>
          </Link>
          <Link href="/secretary/marks">
            <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
              <FileText className="w-4 h-4 mr-2" />
              Enter Marks
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Registered this year</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Active classes</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</div>
            <p className="text-xs text-gray-500 mt-1">Total subjects</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Marks Entered</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.marksEntered}</div>
            <p className="text-xs text-gray-500 mt-1">Assessment records</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations and Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span>Recent Registrations</span>
            </CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRegistrations.map((student) => (
                <div key={student.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg shadow-sm">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg" alt={student.name} />
                    <AvatarFallback>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.class.name}</p>
                    <p className="text-xs text-gray-500">{student.parent.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-100 text-orange-800">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {stats.recentRegistrations.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent registrations</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span>Class Distribution</span>
            </CardTitle>
            <CardDescription>Students per class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.studentsPerClass.map((classData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">{classData.className}</span>
                  </div>
                  <Badge variant="outline" className="font-semibold text-blue-600 border-blue-300">
                    {classData.studentCount} students
                  </Badge>
                </div>
              ))}
            </div>
            {stats.studentsPerClass.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No classes available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/students/register">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-orange-300 hover:bg-orange-50 transition-colors duration-200"
              >
                <Plus className="w-6 h-6 text-orange-600" />
                <span>Register New Student</span>
              </Button>
            </Link>
            <Link href="/secretary/marks">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <span>Enter Student Marks</span>
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-green-300 hover:bg-green-50 transition-colors duration-200"
              >
                <Eye className="w-6 h-6 text-green-600" />
                <span>View All Students</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { SecretaryDashboard }
