"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Download, TrendingUp, Users, BookOpen, Award, BarChart3, Target, Star } from "lucide-react"
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
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

interface ClassReport {
  totalStudents: number
  averageScore: number
  passRate: number
  subjectPerformance: Array<{
    subject: string
    average: number
    passRate: number
  }>
  gradeDistribution: Array<{
    grade: string
    count: number
  }>
  topPerformers: Array<{
    id: string
    name: string
    photo?: string
    average: number
    grade: string
  }>
  weeklyAttendance: Array<{
    day: string
    present: number
    absent: number
    rate: number
  }>
}

interface Student {
  id: string
  name: string
  photo?: string
  averageScore: number
  grade: string
  attendance: number
  subjectScores: Array<{
    subject: string
    score: number
    grade: string
  }>
}

interface Term {
  id: string
  name: string
}

export default function TeacherReportsPage() {
  const [classReport, setClassReport] = useState<ClassReport | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTerms()
  }, [])

  useEffect(() => {
    if (selectedTerm) {
      fetchClassReport()
      fetchStudents()
    }
  }, [selectedTerm])

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/terms")
      if (response.ok) {
        const data = await response.json()
        setTerms(data.terms || [])
        if (data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
    }
  }

  const fetchClassReport = async () => {
    try {
      const response = await fetch(`/api/teacher/reports?termId=${selectedTerm}`)
      if (response.ok) {
        const data = await response.json()
        setClassReport(data.report)
      }
    } catch (error) {
      console.error("Error fetching class report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/teacher/students?termId=${selectedTerm}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/teacher/reports/download?termId=${selectedTerm}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `class-report-${selectedTerm}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Class report downloaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      })
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600 bg-green-100"
      case "B":
        return "text-blue-600 bg-blue-100"
      case "C":
        return "text-yellow-600 bg-yellow-100"
      case "D":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-red-600 bg-red-100"
    }
  }

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"]

  // Chart data
  const subjectPerformanceData = classReport
    ? {
        labels: classReport.subjectPerformance.map((item) => item.subject),
        datasets: [
          {
            label: "Average Score",
            data: classReport.subjectPerformance.map((item) => item.average),
            backgroundColor: "rgba(59, 130, 246, 0.8)",
            borderColor: "#3B82F6",
            borderWidth: 2,
          },
        ],
      }
    : null

  const gradeDistributionData = classReport
    ? {
        labels: classReport.gradeDistribution.map((item) => `Grade ${item.grade}`),
        datasets: [
          {
            data: classReport.gradeDistribution.map((item) => item.count),
            backgroundColor: COLORS,
            borderWidth: 0,
          },
        ],
      }
    : null

  const attendanceData = classReport
    ? {
        labels: classReport.weeklyAttendance.map((item) => item.day),
        datasets: [
          {
            label: "Attendance Rate (%)",
            data: classReport.weeklyAttendance.map((item) => item.rate),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive class performance analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadReport} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {classReport && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classReport.totalStudents}</div>
                <p className="text-blue-100 text-sm mt-1">Enrolled in class</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Class Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classReport.averageScore}%</div>
                <p className="text-green-100 text-sm mt-1">Overall performance</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Pass Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classReport.passRate}%</div>
                <p className="text-purple-100 text-sm mt-1">Students passing</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{classReport.subjectPerformance.length}</div>
                <p className="text-orange-100 text-sm mt-1">Being taught</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Subject Performance</span>
                    </CardTitle>
                    <CardDescription>Average scores by subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectPerformanceData && (
                      <div className="h-64">
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

                <Card className="bg-white shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span>Grade Distribution</span>
                    </CardTitle>
                    <CardDescription>Distribution of grades in class</CardDescription>
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
              </div>

              {/* Top Performers */}
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span>Top Performers</span>
                  </CardTitle>
                  <CardDescription>Students with highest performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classReport.topPerformers.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{student.average}%</span>
                            <Badge className={getGradeColor(student.grade)}>{student.grade}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle>Subject Performance Analysis</CardTitle>
                  <CardDescription>Detailed breakdown by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {classReport.subjectPerformance.map((subject, index) => (
                      <div key={index} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{subject.subject}</h4>
                          <div className="flex items-center space-x-4">
                            <Badge className="bg-blue-100 text-blue-800">Average: {subject.average}%</Badge>
                            <Badge className="bg-green-100 text-green-800">Pass Rate: {subject.passRate}%</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Performance</span>
                            <span className="font-medium">{subject.average}%</span>
                          </div>
                          <Progress value={subject.average} className="h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle>Student Performance</CardTitle>
                  <CardDescription>Individual student performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
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
                            <span className="text-lg font-semibold">{student.averageScore}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(student.grade)}>{student.grade}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{student.attendance}%</span>
                          </TableCell>
                          <TableCell>
                            <Progress value={student.averageScore} className="w-20" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Weekly Attendance Trend</span>
                  </CardTitle>
                  <CardDescription>Daily attendance rates for the week</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceData && (
                    <div className="h-64">
                      <Line
                        data={attendanceData}
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
        </>
      )}
    </div>
  )
}
