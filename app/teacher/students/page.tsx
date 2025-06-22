"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Users, TrendingUp, BookOpen, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  gender: string
  age: number
  photo?: string
  class: {
    name: string
  }
  parent: {
    name: string
    email: string
  }
  attendanceRate: number
  averageMark: number
  totalMarks: number
  marks: Array<{
    subject: {
      name: string
    }
    total: number | null
    grade: string | null
  }>
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/teacher/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
        throw new Error("Failed to fetch students")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parent.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsViewDialogOpen(true)
  }

  const getPerformanceBadge = (average: number) => {
    if (average >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (average >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (average >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    if (average >= 50) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (rate >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your class students</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">{filteredStudents.length} students</span>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-green-600" />
              <span>Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-300 focus:border-green-500"
            />
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Class Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + s.averageMark, 0) / students.length)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">Class attendance</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assessments</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{students.reduce((sum, s) => sum + s.totalMarks, 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Total marks entered</p>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>All students in your class with performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Assessments</TableHead>
                <TableHead>Actions</TableHead>
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
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.gender}, {student.age} years
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{student.parent.name}</p>
                      <p className="text-sm text-gray-600">{student.parent.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{student.averageMark}%</p>
                      {getPerformanceBadge(student.averageMark)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{student.attendanceRate}%</p>
                      {getAttendanceBadge(student.attendanceRate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-gray-900">{student.totalMarks}</p>
                    <p className="text-sm text-gray-600">marks entered</p>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete information and performance overview</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                  <AvatarFallback className="text-xl">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.class.name}</p>
                  <div className="flex space-x-2 mt-2">
                    {getPerformanceBadge(selectedStudent.averageMark)}
                    {getAttendanceBadge(selectedStudent.attendanceRate)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Gender:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.gender}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Age:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.age} years</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Parent:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.parent.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Average Mark:</span>
                      <span className="ml-2 font-semibold text-gray-900">{selectedStudent.averageMark}%</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Attendance Rate:</span>
                      <span className="ml-2 font-semibold text-gray-900">{selectedStudent.attendanceRate}%</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Assessments:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.totalMarks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedStudent.marks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Subject Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedStudent.marks
                      .filter((mark) => mark.total !== null)
                      .map((mark, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{mark.subject.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{mark.total}%</span>
                            {mark.grade && (
                              <Badge variant="outline" className="text-xs">
                                {mark.grade}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">View Full Report</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredStudents.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search term" : "No students assigned to your class"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
