"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Eye,
  Users,
  TrendingUp,
  BookOpen,
  Calendar,
  GraduationCap,
  UserCheck,
  Clock,
  Award,
  Filter,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  gender: string
  age: number
  photo?: string
  class: {
    id: string
    name: string
    level?: string
  }
  parent: {
    id: string
    name: string
    email: string
  }
  marks: Array<{
    id: string
    subject: {
      id: string
      name: string
      code: string
    }
    term: {
      id: string
      name: string
    }
    homework: number | null
    bot: number | null
    midterm: number | null
    eot: number | null
    total: number | null
    grade: string | null
  }>
  attendance: Array<{
    id: string
    date: string
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
    remarks?: string
  }>
  stats: {
    attendanceRate: number
    averageMark: number
    highestMark: number
    lowestMark: number
    totalSubjects: number
    totalAttendanceDays: number
    presentDays: number
    absentDays: number
    lateDays: number
  }
}

interface DetailedStudent extends Student {
  reportCards: Array<{
    id: string
    discipline: string | null
    cleanliness: string | null
    classWorkPresentation: string | null
    adherenceToSchool: string | null
    coCurricularActivities: string | null
    considerationToOthers: string | null
    speakingEnglish: string | null
    classTeacherComment: string | null
    headteacherComment: string | null
    isApproved: boolean
    createdAt: string
  }>
  marksByTerm: Record<string, Student["marks"]>
  marksBySubject: Record<string, Student["marks"]>
}

interface Term {
  id: string
  name: string
}

interface AcademicYear {
  id: string
  year: string
  isActive: boolean
}

interface Class {
  id: string
  name: string
  level?: string
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false)
  const [detailedStudent, setDetailedStudent] = useState<DetailedStudent | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { toast } = useToast()

  useEffect(() => {
    fetchTerms()
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedTerm) {
      fetchStudents()
    }
  }, [selectedTerm])

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/terms")
      if (response.ok) {
        const data = await response.json()
        setTerms(Array.isArray(data.terms) ? data.terms : [])
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const url =
        selectedTerm && selectedTerm !== "all"
          ? `/api/teacher/students?termId=${selectedTerm}`
          : "/api/teacher/students"

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStudents(Array.isArray(data.students) ? data.students : [])
        setAcademicYear(data.academicYear)
        setClasses(Array.isArray(data.classes) ? data.classes : [])
      } else {
        throw new Error("Failed to fetch students")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDetails = async (studentId: string) => {
    try {
      setStudentDetailsLoading(true)
      const url =
        selectedTerm && selectedTerm !== "all"
          ? `/api/teacher/student-details?studentId=${studentId}&termId=${selectedTerm}`
          : `/api/teacher/student-details?studentId=${studentId}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDetailedStudent(data.student)
      } else {
        throw new Error("Failed to fetch student details")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch student details",
        variant: "destructive",
      })
    } finally {
      setStudentDetailsLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGender = genderFilter === "all" || student.gender?.toLowerCase() === genderFilter.toLowerCase()

    return matchesSearch && matchesGender
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student)
    setIsViewDialogOpen(true)
    await fetchStudentDetails(student.id)
  }

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Excellent</Badge>
    if (rate >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
    if (rate >= 70) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Poor</Badge>
  }

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return null
    const colors = {
      A: "bg-green-100 text-green-800 border-green-200",
      B: "bg-blue-100 text-blue-800 border-blue-200",
      C: "bg-yellow-100 text-yellow-800 border-yellow-200",
      D: "bg-orange-100 text-orange-800 border-orange-200",
      F: "bg-red-100 text-red-800 border-red-200",
    }
    return <Badge className={colors[grade as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{grade}</Badge>
  }

  // Calculate class statistics
  const classStats = {
    totalStudents: students.length,
    averagePerformance:
      students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.stats.averageMark, 0) / students.length) : 0,
    averageAttendance:
      students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.stats.attendanceRate, 0) / students.length)
        : 0,
    totalSubjects: students.length > 0 ? Math.max(...students.map((s) => s.stats.totalSubjects)) : 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Students
            </h1>
            <p className="text-gray-600 mt-2">
              {academicYear?.year} Academic Year • {classes.map((c) => c.name).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 text-indigo-600 bg-white px-4 py-2 rounded-full shadow-sm">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{filteredStudents.length} students</span>
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Students</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.totalStudents}</div>
              <p className="text-xs opacity-80 mt-1">In your classes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Class Average</CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.averagePerformance}%</div>
              <p className="text-xs opacity-80 mt-1">Overall performance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Attendance Rate</CardTitle>
              <Calendar className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.averageAttendance}%</div>
              <p className="text-xs opacity-80 mt-1">Class attendance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Subjects</CardTitle>
              <BookOpen className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{classStats.totalSubjects}</div>
              <p className="text-xs opacity-80 mt-1">Total subjects</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Gender</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-indigo-500">
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setGenderFilter("all")
                    setSelectedTerm("all")
                    setCurrentPage(1)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Student List
            </CardTitle>
            <CardDescription>
              {selectedTerm !== "all"
                ? `Showing data for ${terms.find((t) => t.id === selectedTerm)?.name || "selected term"}`
                : "Showing data for all terms"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                            <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">
                              {student.gender}, {student.age} years
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{student.class.name}</p>
                          {student.class.level && <p className="text-sm text-gray-600">{student.class.level}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-900">{student.stats.attendanceRate}%</span>
                            {getAttendanceBadge(student.stats.attendanceRate)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {student.stats.presentDays}/{student.stats.totalAttendanceDays} days
                          </div>
                          <Progress value={student.stats.attendanceRate} className="h-2 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length}{" "}
                  students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || genderFilter !== "all"
                  ? "Try adjusting your filters or search term"
                  : "No students assigned to your classes"}
              </p>
              {(searchTerm || genderFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setGenderFilter("all")
                    setCurrentPage(1)
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Student Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Student Details
              </DialogTitle>
              <DialogDescription>Comprehensive information and performance overview</DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      {selectedStudent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-gray-600 mb-3">
                      {selectedStudent.class.name} • {selectedStudent.gender}, {selectedStudent.age} years
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getAttendanceBadge(selectedStudent.stats.attendanceRate)}
                      <Badge variant="outline" className="bg-white">
                        {selectedStudent.stats.totalSubjects} Subjects
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{selectedStudent.stats.averageMark}%</div>
                    <div className="text-sm text-gray-600">Overall Average</div>
                  </div>
                </div>

                {studentDetailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading detailed information...</span>
                  </div>
                ) : detailedStudent ? (
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="marks">Academic Performance</TabsTrigger>
                      <TabsTrigger value="attendance">Attendance</TabsTrigger>
                      <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Personal Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Full Name:</span>
                              <span className="font-medium">{detailedStudent.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gender:</span>
                              <span className="font-medium">{detailedStudent.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Age:</span>
                              <span className="font-medium">{detailedStudent.age} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Class:</span>
                              <span className="font-medium">{detailedStudent.class.name}</span>
                            </div>
                            <Separator />
                            <div>
                              <span className="text-gray-600 block mb-2">Parent/Guardian:</span>
                              <div className="space-y-1">
                                <p className="font-medium">{detailedStudent.parent?.name || "N/A"}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {detailedStudent.parent?.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Performance Summary */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Performance Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Overall Average</span>
                                <span className="font-bold text-lg">{detailedStudent.stats.averageMark}%</span>
                              </div>
                              <Progress value={detailedStudent.stats.averageMark} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Attendance Rate</span>
                                <span className="font-bold text-lg">{detailedStudent.stats.attendanceRate}%</span>
                              </div>
                              <Progress value={detailedStudent.stats.attendanceRate} className="h-2" />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600">
                                  {detailedStudent.stats.highestMark}%
                                </div>
                                <div className="text-xs text-gray-600">Highest Mark</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-orange-600">
                                  {detailedStudent.stats.lowestMark}%
                                </div>
                                <div className="text-xs text-gray-600">Lowest Mark</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="marks" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-600" />
                            Academic Performance by Subject
                          </CardTitle>
                          <CardDescription>
                            Detailed breakdown of marks across all subjects and assessment types
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {detailedStudent.marksBySubject && Object.keys(detailedStudent.marksBySubject).length > 0 ? (
                            <div className="space-y-6">
                              {Object.entries(detailedStudent.marksBySubject).map(([subject, marks]) => (
                                <div key={subject} className="border rounded-lg p-4 bg-gray-50">
                                  <h4 className="font-semibold text-lg mb-4 text-indigo-700">{subject}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(marks as any[]).map((mark, index) => (
                                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
                                        <div className="flex justify-between items-center mb-3">
                                          <span className="text-sm font-medium text-gray-600">
                                            {mark.term?.name || "Unknown Term"}
                                          </span>
                                          {mark.grade && getGradeBadge(mark.grade)}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                          {mark.homework !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Homework:</span>
                                              <Badge className="bg-blue-100 text-blue-800">{mark.homework}%</Badge>
                                            </div>
                                          )}
                                          {mark.bot !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">BOT:</span>
                                              <Badge className="bg-green-100 text-green-800">{mark.bot}%</Badge>
                                            </div>
                                          )}
                                          {mark.midterm !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">Midterm:</span>
                                              <Badge className="bg-orange-100 text-orange-800">{mark.midterm}%</Badge>
                                            </div>
                                          )}
                                          {mark.eot !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">EOT:</span>
                                              <Badge className="bg-purple-100 text-purple-800">{mark.eot}%</Badge>
                                            </div>
                                          )}
                                          {mark.total !== null && (
                                            <div className="flex justify-between border-t pt-2 mt-2">
                                              <span className="font-semibold text-gray-800">Total:</span>
                                              <span className="font-bold text-lg text-indigo-600">{mark.total}%</span>
                                            </div>
                                          )}
                                        </div>
                                        {mark.total !== null && (
                                          <div className="mt-3">
                                            <Progress value={mark.total} className="h-2" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Data Found</h3>
                              <p className="text-gray-600">
                                No marks have been recorded for this student in the selected term(s).
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="attendance" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">{detailedStudent.stats.presentDays}</div>
                            <div className="text-sm text-gray-600">Present Days</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-orange-600">{detailedStudent.stats.lateDays}</div>
                            <div className="text-sm text-gray-600">Late Days</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Calendar className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-red-600">{detailedStudent.stats.absentDays}</div>
                            <div className="text-sm text-gray-600">Absent Days</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-600">
                              {detailedStudent.stats.excusedDays || 0}
                            </div>
                            <div className="text-sm text-gray-600">Excused Days</div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance History</CardTitle>
                          <CardDescription>Recent attendance records</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {detailedStudent.attendance?.slice(0, 20).map((record: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium">
                                    {new Date(record.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  {record.remarks && <p className="text-xs text-gray-500 mt-1">{record.remarks}</p>}
                                </div>
                                <Badge
                                  className={
                                    record.status === "PRESENT"
                                      ? "bg-green-100 text-green-800"
                                      : record.status === "LATE"
                                        ? "bg-orange-100 text-orange-800"
                                        : record.status === "EXCUSED"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-red-100 text-red-800"
                                  }
                                >
                                  {record.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Behavioral Reports</CardTitle>
                          <CardDescription>Teacher assessments and comments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {detailedStudent.reportCards?.length > 0 ? (
                            <div className="space-y-4">
                              {detailedStudent.reportCards.map((report: any, index: number) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-gray-600">
                                      {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                    <Badge
                                      className={
                                        report.isApproved
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }
                                    >
                                      {report.isApproved ? "Approved" : "Pending"}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {report.discipline && (
                                      <div className="bg-white p-3 rounded">
                                        <span className="text-sm font-medium text-gray-600">Discipline:</span>
                                        <p className="text-sm mt-1">{report.discipline}</p>
                                      </div>
                                    )}
                                    {report.cleanliness && (
                                      <div className="bg-white p-3 rounded">
                                        <span className="text-sm font-medium text-gray-600">Cleanliness:</span>
                                        <p className="text-sm mt-1">{report.cleanliness}</p>
                                      </div>
                                    )}
                                    {report.classWorkPresentation && (
                                      <div className="bg-white p-3 rounded">
                                        <span className="text-sm font-medium text-gray-600">Class Work:</span>
                                        <p className="text-sm mt-1">{report.classWorkPresentation}</p>
                                      </div>
                                    )}
                                    {report.adherenceToSchool && (
                                      <div className="bg-white p-3 rounded">
                                        <span className="text-sm font-medium text-gray-600">School Adherence:</span>
                                        <p className="text-sm mt-1">{report.adherenceToSchool}</p>
                                      </div>
                                    )}
                                  </div>

                                  {(report.classTeacherComment || report.headteacherComment) && (
                                    <div className="space-y-3">
                                      {report.classTeacherComment && (
                                        <div className="bg-blue-50 p-3 rounded">
                                          <span className="text-sm font-medium text-blue-800">
                                            Class Teacher Comment:
                                          </span>
                                          <p className="text-sm text-blue-700 mt-1">{report.classTeacherComment}</p>
                                        </div>
                                      )}
                                      {report.headteacherComment && (
                                        <div className="bg-purple-50 p-3 rounded">
                                          <span className="text-sm font-medium text-purple-800">
                                            Head Teacher Comment:
                                          </span>
                                          <p className="text-sm text-purple-700 mt-1">{report.headteacherComment}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">No behavioral reports available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                ) : null}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    Generate Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
