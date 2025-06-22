"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Calendar, BookOpen, Award, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ChildStats {
  id: string
  name: string
  class: string
  term: string
  averageMark: number
  attendanceRate: number
  totalSubjects: number
  hasReportCard: boolean
  subjectAverages: Array<{
    subject: string
    average: number
  }>
  recentAttendance: Array<{
    date: string
    status: string
  }>
}

interface DashboardStats {
  children: ChildStats[]
  totalChildren: number
  overallAverage: number
  overallAttendance: number
}

export default function ParentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/parent/dashboard-stats")
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

  const getPerformanceBadge = (average: number) => {
    if (average >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (average >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (average >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    if (average >= 50) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ABSENT":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "LATE":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Unable to load dashboard information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your children's academic progress</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Children</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalChildren}</div>
            <p className="text-xs text-gray-500 mt-1">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.overallAverage}%</div>
            <p className="text-xs text-gray-500 mt-1">Academic performance</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.overallAttendance}%</div>
            <p className="text-xs text-gray-500 mt-1">Overall attendance</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Report Cards</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.children.filter((child) => child.hasReportCard).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Children Details */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Children's Progress</h2>

        {stats.children.map((child) => (
          <Card key={child.id} className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="/placeholder.svg" alt={child.name} />
                    <AvatarFallback className="text-lg">
                      {child.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{child.name}</CardTitle>
                    <CardDescription className="text-purple-600 font-medium">
                      {child.class} - {child.term}
                    </CardDescription>
                    <div className="flex space-x-2 mt-2">
                      {getPerformanceBadge(child.averageMark)}
                      {child.hasReportCard && <Badge className="bg-orange-100 text-orange-800">Report Available</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/parent/children/${child.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  {child.hasReportCard && (
                    <Link href={`/parent/report-cards/${child.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Award className="w-4 h-4 mr-2" />
                        View Report
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Academic Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overall Average</span>
                      <span className="font-semibold text-gray-900">{child.averageMark}%</span>
                    </div>
                    <Progress value={child.averageMark} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subjects Assessed</span>
                      <span className="font-semibold text-gray-900">{child.totalSubjects}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Attendance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Attendance Rate</span>
                      <span className="font-semibold text-gray-900">{child.attendanceRate}%</span>
                    </div>
                    <Progress value={child.attendanceRate} className="h-2" />
                    <div className="flex space-x-1 mt-2">
                      {child.recentAttendance.map((attendance, index) => (
                        <div key={index} className="flex flex-col items-center">
                          {getAttendanceIcon(attendance.status)}
                          <span className="text-xs text-gray-500 mt-1">{new Date(attendance.date).getDate()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Performance */}
              {child.subjectAverages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Subject Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {child.subjectAverages.map((subject, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900">{subject.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{subject.average}%</span>
                          {getPerformanceBadge(subject.average)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.children.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
            <p className="text-gray-600">No children are associated with your account</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
