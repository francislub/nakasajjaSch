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
import {
  Search,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  UserCheck,
  UserX,
  TrendingUp,
  FileText,
  Download,
  Eye,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  age: number
  parent?: {
    id: string
    name: string
    email: string
  }
  marks: Array<{
    id: string
    bot?: number
    midterm?: number
    eot?: number
    subject: {
      id: string
      name: string
      code: string
    }
  }>
  attendance: Array<{
    id: string
    status: string
    date: string
  }>
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Class {
  id: string
  name: string
  level: string
  capacity: number
  students: Student[]
  subjects: Subject[]
  _count: {
    students: number
  }
}

interface ClassStats {
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  averageAge: number
  attendanceRate: number
  averagePerformance: number
  subjectsCount: number
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classStats, setClassStats] = useState<ClassStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { toast } = useToast()

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      calculateClassStats(selectedClass)
    }
  }, [selectedClass])

  const fetchTeacherClasses = async () => {
    try {
      const response = await fetch("/api/teacher/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes && data.classes.length > 0) {
          setSelectedClass(data.classes[0])
        }
      } else {
        throw new Error("Failed to fetch classes")
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateClassStats = (classData: Class) => {
    const students = classData.students || []
    const totalStudents = students.length
    const maleStudents = students.filter((s) => s.gender === "MALE").length
    const femaleStudents = students.filter((s) => s.gender === "FEMALE").length
    const averageAge = totalStudents > 0 ? students.reduce((sum, s) => sum + s.age, 0) / totalStudents : 0

    // Calculate attendance rate
    const totalAttendanceRecords = students.reduce((sum, s) => sum + (s.attendance?.length || 0), 0)
    const presentRecords = students.reduce(
      (sum, s) => sum + (s.attendance?.filter((a) => a.status === "PRESENT").length || 0),
      0,
    )
    const attendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0

    // Calculate average performance
    const allMarks = students.flatMap((s) => s.marks || [])
    const totalMarksValue = allMarks.reduce((sum, mark) => {
      const markTotal = (mark.bot || 0) + (mark.midterm || 0) + (mark.eot || 0)
      return sum + markTotal
    }, 0)
    const averagePerformance = allMarks.length > 0 ? totalMarksValue / (allMarks.length * 3) : 0

    setClassStats({
      totalStudents,
      maleStudents,
      femaleStudents,
      averageAge: Math.round(averageAge),
      attendanceRate: Math.round(attendanceRate),
      averagePerformance: Math.round(averagePerformance),
      subjectsCount: classData.subjects?.length || 0,
    })
  }

  const handleExportClassList = async () => {
    if (!selectedClass) return

    try {
      const response = await fetch(`/api/teacher/classes/${selectedClass.id}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedClass.name}-students.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Class list exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export class list",
        variant: "destructive",
      })
    }
  }

  const filteredStudents =
    selectedClass?.students?.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGender = genderFilter === "all" || student.gender === genderFilter
      return matchesSearch && matchesGender
    }) || []

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentStudents = filteredStudents.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    if (score >= 50) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (rate >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            My Classes
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your assigned classes and students</p>
        </div>
        {selectedClass && (
          <Button
            onClick={handleExportClassList}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Class List
          </Button>
        )}
      </div>

      {/* Class Selection */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-700">
            <GraduationCap className="w-5 h-5 mr-2" />
            Select Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClass?.id || ""}
            onValueChange={(value) => {
              const cls = classes.find((c) => c.id === value)
              setSelectedClass(cls || null)
              setCurrentPage(1) // Reset pagination when changing class
            }}
          >
            <SelectTrigger className="w-full sm:w-64 border-indigo-200 focus:border-indigo-500">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls._count?.students || 0} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Class Stats */}
          {classStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Total Students</span>
                    <span className="sm:hidden">Total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Male
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.maleStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Female
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.femaleStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Avg Age</span>
                    <span className="sm:hidden">Age</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.averageAge} yrs</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Attendance</span>
                    <span className="sm:hidden">Attend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.attendanceRate}%</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Avg Score</span>
                    <span className="sm:hidden">Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.averagePerformance}%</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{classStats.subjectsCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger
                value="subjects"
                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Subjects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              {/* Filters */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setCurrentPage(1) // Reset pagination when searching
                        }}
                        className="pl-10 border-indigo-200 focus:border-indigo-500"
                      />
                    </div>
                    <Select
                      value={genderFilter}
                      onValueChange={(value) => {
                        setGenderFilter(value)
                        setCurrentPage(1) // Reset pagination when filtering
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-48 border-indigo-200 focus:border-indigo-500">
                        <SelectValue placeholder="Filter by gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-700">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    {selectedClass.name} Students
                  </CardTitle>
                  <CardDescription>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{" "}
                    {filteredStudents.length} students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-48">Student</TableHead>
                          <TableHead className="w-20">Gender</TableHead>
                          <TableHead className="w-16">Age</TableHead>
                          <TableHead className="w-48 hidden md:table-cell">Parent</TableHead>
                          <TableHead className="w-32 hidden lg:table-cell">Contact</TableHead>
                          <TableHead className="w-32">Performance</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentStudents.map((student) => {
                          const totalMarks = student.marks.reduce((sum, mark) => {
                            return sum + (mark.bot || 0) + (mark.midterm || 0) + (mark.eot || 0)
                          }, 0)
                          const avgScore =
                            student.marks.length > 0 ? Math.round(totalMarks / (student.marks.length * 3)) : 0

                          const attendanceRate =
                            student.attendance?.length > 0
                              ? Math.round(
                                  (student.attendance.filter((a) => a.status === "PRESENT").length /
                                    student.attendance.length) *
                                    100,
                                )
                              : 0

                          return (
                            <TableRow key={student.id} className="hover:bg-indigo-50/50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                    <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                      {student.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm sm:text-base">{student.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    student.gender === "MALE"
                                      ? "border-blue-200 text-blue-700 bg-blue-50"
                                      : "border-pink-200 text-pink-700 bg-pink-50"
                                  }
                                >
                                  {student.gender}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{student.age}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {student.parent ? (
                                  <div>
                                    <div className="font-medium text-sm">{student.parent.name}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-32">
                                      {student.parent.email}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">No parent assigned</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {student.parent?.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs truncate max-w-24">{student.parent.email}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs">Score:</span>
                                    {getPerformanceBadge(avgScore)}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs">Attend:</span>
                                    {getAttendanceBadge(attendanceRate)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button variant="outline" size="sm" className="p-1 h-8 w-8 bg-transparent">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="p-1 h-8 w-8 bg-transparent">
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{" "}
                        {filteredStudents.length} students
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="text-xs sm:text-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber
                            if (totalPages <= 5) {
                              pageNumber = i + 1
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i
                            } else {
                              pageNumber = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNumber)}
                                className={`w-8 h-8 p-0 text-xs sm:text-sm ${
                                  currentPage === pageNumber
                                    ? "bg-indigo-600 hover:bg-indigo-700"
                                    : "hover:bg-indigo-50"
                                }`}
                              >
                                {pageNumber}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-700">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Subjects for {selectedClass.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedClass.subjects?.length || 0} subjects assigned to this class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedClass.subjects && selectedClass.subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedClass.subjects.map((subject) => (
                        <Card
                          key={subject.id}
                          className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-indigo-700">{subject.name}</CardTitle>
                            <CardDescription className="text-indigo-600">Code: {subject.code}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-transparent"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Marks
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-transparent"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Assigned</h3>
                      <p className="text-gray-500">No subjects have been assigned to this class yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {classes.length === 0 && !isLoading && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You don't have any classes assigned to you yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
