"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  UserPlus,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  age: number
  address?: string
  phone?: string
  emergencyContact?: string
  medicalInfo?: string
  class: {
    id: string
    name: string
  }
  term: {
    id: string
    name: string
  }
  academicYear: {
    id: string
    year: string
  }
  parent?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface Class {
  id: string
  name: string
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

interface Parent {
  id: string
  name: string
  email: string
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("active")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReRegisterDialogOpen, setIsReRegisterDialogOpen] = useState(false)
  const [reRegisterData, setReRegisterData] = useState({
    classId: "",
    termId: "",
    academicYearId: "",
    parentId: "",
  })
  const [isReRegistering, setIsReRegistering] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [selectedClass, selectedTerm, selectedAcademicYear, searchTerm])

  const fetchInitialData = async () => {
    try {
      const [classesResponse, termsResponse, academicYearsResponse, parentsResponse] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/terms"),
        fetch("/api/academic-years"),
        fetch("/api/users/parents"),
      ])

      const [classesData, termsData, academicYearsData, parentsData] = await Promise.all([
        classesResponse.json(),
        termsResponse.json(),
        academicYearsResponse.json(),
        parentsResponse.json(),
      ])

      setClasses(classesData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])
      setParents(parentsData || [])

      // Set active academic year as default
      const activeYear = academicYearsData.find((year: AcademicYear) => year.isActive)
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      })
    }
  }

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedAcademicYear !== "all") params.append("academicYearId", selectedAcademicYear)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/students?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        throw new Error("Failed to fetch students")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
        fetchStudents()
      } else {
        throw new Error("Failed to delete student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      })
    }
  }

  const handleExportStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedAcademicYear !== "all") params.append("academicYearId", selectedAcademicYear)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/students/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `students-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Students exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export students",
        variant: "destructive",
      })
    }
  }

  const handleReRegister = async () => {
    if (!selectedStudent || !reRegisterData.classId || !reRegisterData.termId || !reRegisterData.academicYearId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsReRegistering(true)
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}/re-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reRegisterData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `${selectedStudent.name} has been re-registered successfully!`,
          duration: 5000,
        })
        setIsReRegisterDialogOpen(false)
        setReRegisterData({ classId: "", termId: "", academicYearId: "", parentId: "" })
        fetchStudents()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to re-register student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to re-register student",
        variant: "destructive",
      })
    } finally {
      setIsReRegistering(false)
    }
  }

  const openReRegisterDialog = (student: Student) => {
    setSelectedStudent(student)
    setReRegisterData({
      classId: "",
      termId: "",
      academicYearId: "",
      parentId: student.parent?.id || "",
    })
    setIsReRegisterDialogOpen(true)
  }

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
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage student records and information</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportStudents} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => router.push("/admin/students/register")} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Register Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              Male Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.gender === "MALE").length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              Female Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.gender === "FEMALE").length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Active Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYears.find((y) => y.isActive)?.year || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    <div className="flex items-center space-x-2">
                      <span>{year.year}</span>
                      {year.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{students.length} students found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Students List</CardTitle>
          <CardDescription>Manage and view all registered students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
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
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {student.gender}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.class.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">{student.academicYear.year}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">{student.term.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.parent ? (
                      <div>
                        <div className="font-medium text-sm">{student.parent.name}</div>
                        <div className="text-xs text-gray-500">{student.parent.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No parent assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.phone && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReRegisterDialog(student)}
                        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/students/${student.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {students.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedClass !== "all" || selectedTerm !== "all" || selectedAcademicYear !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by registering your first student"}
              </p>
              {!searchTerm && selectedClass === "all" && selectedTerm === "all" && selectedAcademicYear === "all" && (
                <Button
                  onClick={() => router.push("/admin/students/register")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete information for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                  <AvatarFallback className="text-xl">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">{selectedStudent.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Gender</Label>
                      <p className="mt-1">
                        <Badge variant="outline">{selectedStudent.gender}</Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Age</Label>
                      <p className="mt-1">{selectedStudent.age} years</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Class</Label>
                      <p className="mt-1">
                        <Badge variant="secondary">{selectedStudent.class.name}</Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Academic Year</Label>
                      <p className="mt-1">{selectedStudent.academicYear.year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Term</Label>
                      <p className="mt-1">{selectedStudent.term.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.phone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <p className="mt-1">{selectedStudent.phone}</p>
                      </div>
                    )}
                    {selectedStudent.emergencyContact && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Emergency Contact</Label>
                        <p className="mt-1">{selectedStudent.emergencyContact}</p>
                      </div>
                    )}
                    {selectedStudent.address && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Address</Label>
                        <p className="mt-1">{selectedStudent.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span>Parent/Guardian</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent.parent ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Name</Label>
                          <p className="mt-1 font-medium">{selectedStudent.parent.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Email</Label>
                          <p className="mt-1">{selectedStudent.parent.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No parent/guardian assigned</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedStudent.medicalInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>Medical Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedStudent.medicalInfo}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    router.push(`/admin/students/${selectedStudent.id}/edit`)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Re-Register Student Dialog */}
      <Dialog open={isReRegisterDialogOpen} onOpenChange={setIsReRegisterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              <span>Re-Register Student</span>
            </DialogTitle>
            <DialogDescription>
              Re-register {selectedStudent?.name} for a new academic year, term, or class
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Current Registration Info */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Current Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Academic Year:</span>
                    <Badge variant="outline">{selectedStudent.academicYear.year}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Class:</span>
                    <Badge variant="outline">{selectedStudent.class.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Term:</span>
                    <Badge variant="outline">{selectedStudent.term.name}</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* New Registration Form */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-green-700">New Registration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Select
                        value={reRegisterData.academicYearId}
                        onValueChange={(value) => setReRegisterData((prev) => ({ ...prev, academicYearId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              <div className="flex items-center space-x-2">
                                <span>{year.year}</span>
                                {year.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="class">Class *</Label>
                      <Select
                        value={reRegisterData.classId}
                        onValueChange={(value) => setReRegisterData((prev) => ({ ...prev, classId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="term">Term *</Label>
                      <Select
                        value={reRegisterData.termId}
                        onValueChange={(value) => setReRegisterData((prev) => ({ ...prev, termId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {terms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="parent">Parent/Guardian</Label>
                      <Select
                        value={reRegisterData.parentId}
                        onValueChange={(value) => setReRegisterData((prev) => ({ ...prev, parentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No parent assigned</SelectItem>
                          {parents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name} ({parent.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReRegisterDialogOpen(false)} disabled={isReRegistering}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReRegister}
                  disabled={
                    isReRegistering ||
                    !reRegisterData.classId ||
                    !reRegisterData.termId ||
                    !reRegisterData.academicYearId
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isReRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Re-registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Re-Register Student
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
