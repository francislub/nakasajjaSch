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
  Phone,
} from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  age: number
  parent?: {
    name: string
    email: string
    phone?: string
  }
  marks: Array<{
    id: string
    value: number
    examType: string
    subject: {
      name: string
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
  const [genderFilter, setGenderFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
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
    const averagePerformance = allMarks.length > 0 ? allMarks.reduce((sum, m) => sum + m.value, 0) / allMarks.length : 0

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
      const matchesGender = !genderFilter || student.gender === genderFilter
      return matchesSearch && matchesGender
    }) || []

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
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-2">Manage your assigned classes and students</p>
        </div>
        {selectedClass && (
          <Button onClick={handleExportClassList} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export Class List
          </Button>
        )}
      </div>

      {/* Class Selection */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedClass?.id || "none"}
          onValueChange={(value) => {
            const cls = classes.find((c) => c.id === value)
            setSelectedClass(cls || null)
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              Select a class
            </SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} ({cls._count?.students || 0} students)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <>
          {/* Class Stats */}
          {classStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{classStats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Male
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{classStats.maleStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <UserX className="w-4 h-4 mr-2" />
                    Female
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-500">{classStats.femaleStudents}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Avg Age
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{classStats.averageAge} yrs</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{classStats.attendanceRate}%</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Avg Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{classStats.averagePerformance}%</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{classStats.subjectsCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
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
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Students Table */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    {selectedClass.name} Students
                  </CardTitle>
                  <CardDescription>
                    Showing {filteredStudents.length} of {selectedClass.students?.length || 0} students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => {
                        const avgScore =
                          student.marks?.length > 0
                            ? Math.round(student.marks.reduce((sum, m) => sum + m.value, 0) / student.marks.length)
                            : 0
                        const attendanceRate =
                          student.attendance?.length > 0
                            ? Math.round(
                                (student.attendance.filter((a) => a.status === "PRESENT").length /
                                  student.attendance.length) *
                                  100,
                              )
                            : 0

                        return (
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
                              <Badge variant={student.gender === "MALE" ? "default" : "secondary"}>
                                {student.gender}
                              </Badge>
                            </TableCell>
                            <TableCell>{student.age} years</TableCell>
                            <TableCell>
                              {student.parent ? (
                                <div>
                                  <div className="font-medium">{student.parent.name}</div>
                                  <div className="text-sm text-gray-500">{student.parent.email}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No parent assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.parent?.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{student.parent.phone}</span>
                                </div>
                              )}
                              {student.parent?.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{student.parent.email}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">Score:</span>
                                  <Badge
                                    variant={avgScore >= 70 ? "default" : avgScore >= 50 ? "secondary" : "destructive"}
                                  >
                                    {avgScore}%
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">Attendance:</span>
                                  <Badge
                                    variant={
                                      attendanceRate >= 80
                                        ? "default"
                                        : attendanceRate >= 60
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {attendanceRate}%
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Subjects for {selectedClass.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedClass.subjects?.length || 0} subjects assigned to this class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedClass.subjects?.map((subject) => (
                      <Card
                        key={subject.id}
                        className="border-2 border-gray-100 hover:border-blue-200 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <CardDescription>Code: {subject.code}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <FileText className="w-4 h-4 mr-2" />
                              View Marks
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No subjects assigned to this class
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {classes.length === 0 && !isLoading && (
        <Card className="bg-white shadow-lg border-0">
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
