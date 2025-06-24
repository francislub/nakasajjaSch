"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, TrendingUp, TrendingDown, Users, BarChart3, Target, Star } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
)

interface StudentPerformance {
  id: string
  name: string
  photo?: string
  class: {
    name: string
  }
  averageMark: number
  totalSubjects: number
  highestMark: number
  lowestMark: number
  trend: "up" | "down" | "stable"
  subjectPerformance: Array<{
    subject: string
    average: number
    grade: string
  }>
  termProgress: Array<{
    term: string
    average: number
  }>
}

interface PerformanceStats {
  totalStudents: number
  averagePerformance: number
  topPerformers: number
  needsImprovement: number
  subjectAverages: Array<{
    subject: string
    average: number
    studentCount: number
  }>
  gradeDistribution: {
    A: number
    B: number
    C: number
    D: number
    F: number
  }
  classPerformance: Array<{
    className: string
    average: number
    studentCount: number
  }>
  performanceTrend: Array<{
    month: string
    average: number
  }>
}

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

export default function AdminPerformanceReportsPage() {
  const [students, setStudents] = useState<StudentPerformance[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [performanceFilter, setPerformanceFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStudentPerformance()
    fetchClasses()
    fetchSubjects()
    fetchStats()
  }, [selectedClass, selectedSubject, searchTerm, performanceFilter])

  const fetchStudentPerformance = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (selectedSubject) params.append("subjectId", selectedSubject)
      if (searchTerm) params.append("search", searchTerm)
      if (performanceFilter) params.append("performance", performanceFilter)

      const response = await fetch(`/api/admin/reports/performance?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error("Error fetching student performance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects")
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects)
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (selectedSubject) params.append("subjectId", selectedSubject)

      const response = await fetch(`/api/admin/reports/performance/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching performance stats:", error)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (selectedSubject) params.append("subjectId", selectedSubject)

      const response = await fetch(`/api/admin/reports/performance/download?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `performance-report-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Performance report downloaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download performance report",
        variant: "destructive",
      })
    }
  }

  const getPerformanceBadge = (average: number) => {
    if (average >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (average >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (average >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    if (average >= 50) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  // Chart data
  const gradeDistributionData = stats
    ? {
        labels: ["A (80-100)", "B (70-79)", "C (60-69)", "D (50-59)", "F (0-49)"],
        datasets: [
          {
            data: [
              stats.gradeDistribution.A,
              stats.gradeDistribution.B,
              stats.gradeDistribution.C,
              stats.gradeDistribution.D,
              stats.gradeDistribution.F,
            ],
            backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#6B7280"],
            borderWidth: 0,
          },
        ],
      }
    : null

  const subjectPerformanceData = stats
    ? {
        labels: stats.subjectAverages.map((item) => item.subject),
        datasets: [
          {
            label: "Average Score",
            data: stats.subjectAverages.map((item) => item.average),
            backgroundColor: "#3B82F6",
            borderColor: "#1D4ED8",
            borderWidth: 1,
          },
        ],
      }
    : null

  const classPerformanceData = stats
    ? {
        labels: stats.classPerformance.map((item) => item.className),
        datasets: [
          {
            label: "Class Average",
            data: stats.classPerformance.map((item) => item.average),
            backgroundColor: "#10B981",
            borderColor: "#059669",
            borderWidth: 1,
          },
        ],
      }
    : null

  const performanceTrendData = stats
    ? {
        labels: stats.performanceTrend.map((item) => item.month),
        datasets: [
          {
            label: "Average Performance",
            data: stats.performanceTrend.map((item) => item.average),
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive academic performance analysis</p>
        </div>
        <Button onClick={handleDownloadReport} className="bg-purple-600 hover:bg-purple-700">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Average Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averagePerformance}%</div>
              <p className="text-xs text-gray-500 mt-1">Overall average</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.topPerformers}</div>
              <p className="text-xs text-gray-500 mt-1">80% and above</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Need Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.needsImprovement}</div>
              <p className="text-xs text-gray-500 mt-1">Below 60%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Distribution of student grades</CardDescription>
              </CardHeader>
              <CardContent>
                {gradeDistributionData && (
                  <div className="h-64">
                    <Doughnut
                      data={gradeDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Academic performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceTrendData && (
                  <div className="h-64">
                    <Line
                      data={performanceTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Average performance across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformanceData && (
                <div className="h-80">
                  <Bar
                    data={subjectPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Average performance by class</CardDescription>
            </CardHeader>
            <CardContent>
              {classPerformanceData && (
                <div className="h-80">
                  <Bar
                    data={classPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Long-term academic performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceTrendData && (
                <div className="h-80">
                  <Line
                    data={performanceTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects?.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
        <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Performance</SelectItem>
            <SelectItem value="excellent">Excellent (80-100)</SelectItem>
            <SelectItem value="good">Good (70-79)</SelectItem>
            <SelectItem value="average">Average (60-69)</SelectItem>
            <SelectItem value="below">Below Average (50-59)</SelectItem>
            <SelectItem value="poor">Poor (0-49)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Performance Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Student Performance</CardTitle>
          <CardDescription>Detailed performance analysis for {filteredStudents.length} students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Highest</TableHead>
                <TableHead>Lowest</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.class.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{student.averageMark}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.totalSubjects} subjects</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">{student.highestMark}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">{student.lowestMark}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">{getTrendIcon(student.trend)}</div>
                  </TableCell>
                  <TableCell>{getPerformanceBadge(student.averageMark)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Performance Data</h3>
              <p className="text-gray-500">No student performance data found for the selected filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
