"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Calendar,
  GraduationCap,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

interface Student {
  id: string
  name: string
  email?: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE"
  age?: number
  address?: string
  phone?: string
  photo?: string
  emergencyContact?: string
  medicalInfo?: string
  registrationNumber?: string
  class?: {
    id: string
    name: string
    academicYear?: {
      id: string
      year: string
      isActive: boolean
    }
  }
  term?: {
    id: string
    name: string
  }
  academicYear?: {
    id: string
    year: string
    isActive: boolean
  }
  parent?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface AcademicYear {
  id: string
  year: string
  isActive: boolean
}

interface Class {
  id: string
  name: string
  academicYear?: {
    id: string
    year: string
    isActive: boolean
  }
}

interface Term {
  id: string
  name: string
  academicYear: {
    id: string
    year: string
  }
}

interface Parent {
  id: string
  name: string
  email: string
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [isReRegisterDialogOpen, setIsReRegisterDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [reRegisterLoading, setReRegisterLoading] = useState(false)
  const [reRegisterForm, setReRegisterForm] = useState({
    academicYearId: "",
    classId: "",
    termId: "",
    parentId: "",
  })

  useEffect(() => {
    fetchData()
  }, [selectedAcademicYear, selectedClass, selectedTerm])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (selectedAcademicYear !== "all") params.append("academicYearId", selectedAcademicYear)
      if (selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm !== "all") params.append("termId", selectedTerm)

      // Fetch all required data
      const [studentsRes, academicYearsRes, classesRes, termsRes, parentsRes] = await Promise.all([
        fetch(`/api/students?${params.toString()}`),
        fetch("/api/academic-years"),
        fetch("/api/classes"),
        fetch("/api/terms"),
        fetch("/api/users/parents"),
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }

      if (academicYearsRes.ok) {
        const academicYearsData = await academicYearsRes.json()
        setAcademicYears(academicYearsData || [])

        // Set active academic year as default if not already selected
        if (selectedAcademicYear === "all") {
          const activeYear = academicYearsData?.find((year: AcademicYear) => year.isActive)
          if (activeYear) {
            setSelectedAcademicYear(activeYear.id)
          }
        }
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }

      if (termsRes.ok) {
        const termsData = await termsRes.json()
        setTerms(termsData || [])
      }

      if (parentsRes.ok) {
        const parentsData = await parentsRes.json()
        setParents(parentsData.parents || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleReRegister = (student: Student) => {
    setSelectedStudent(student)
    setReRegisterForm({
      academicYearId: "",
      classId: "",
      termId: student.term?.id || "",
      parentId: student.parent?.id || "",
    })
    setIsReRegisterDialogOpen(true)
  }

  const submitReRegistration = async () => {
    if (!selectedStudent) return

    if (!reRegisterForm.academicYearId || !reRegisterForm.classId) {
      toast.error("Academic year and class are required")
      return
    }

    try {
      setReRegisterLoading(true)

      const response = await fetch(`/api/students/${selectedStudent.id}/re-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reRegisterForm),
      })

      if (response.ok) {
        toast.success("Student re-registered successfully!")
        setIsReRegisterDialogOpen(false)
        fetchData() // Refresh the data
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to re-register student")
      }
    } catch (error) {
      console.error("Error re-registering student:", error)
      toast.error("Failed to re-register student")
    } finally {
      setReRegisterLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    // Navigate to edit page or open edit dialog
    window.location.href = `/admin/students/${student.id}/edit`
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Student deleted successfully")
        fetchData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to delete student")
      }
    } catch (error) {
      console.error("Error deleting student:", error)
      toast.error("Failed to delete student")
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getNewAcademicYear = () => {
    return academicYears.find((year) => year.id === reRegisterForm.academicYearId)
  }

  const getNewClass = () => {
    return classes.find((cls) => cls.id === reRegisterForm.classId)
  }

  const getNewTerm = () => {
    return terms.find((term) => term.id === reRegisterForm.termId)
  }

  const getNewParent = () => {
    return parents.find((parent) => parent.id === reRegisterForm.parentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">Manage student registrations and information</p>
        </div>
        <Button onClick={() => (window.location.href = "/admin/students/register")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} {year.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} - {term.academicYear.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
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
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <CardDescription>
                    {student.class?.name} • {student.academicYear?.year}
                  </CardDescription>
                  {student.registrationNumber && (
                    <p className="text-xs text-muted-foreground">Reg: {student.registrationNumber}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {student.gender && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{student.gender}</span>
                  </div>
                )}
                {student.age && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{student.age} years</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center space-x-1 col-span-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center space-x-1 col-span-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.address && (
                  <div className="flex items-center space-x-1 col-span-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{student.address}</span>
                  </div>
                )}
              </div>

              {student.parent && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Parent: </span>
                  <span className="font-medium">{student.parent.name}</span>
                </div>
              )}

              {student.term && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Term: </span>
                  <span className="font-medium">{student.term.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                    onClick={() => handleReRegister(student)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Re-Register
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => handleDelete(student)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {student.academicYear?.isActive && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedAcademicYear !== "all" || selectedClass !== "all" || selectedTerm !== "all"
                ? "Try adjusting your filters to see more results."
                : "Start by adding your first student."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Re-Registration Dialog */}
      <Dialog open={isReRegisterDialogOpen} onOpenChange={setIsReRegisterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <span>Re-Register Student</span>
            </DialogTitle>
            <DialogDescription>
              Register {selectedStudent?.name} for a new academic year, class, or term while keeping all personal
              information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current vs New Registration Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Registration */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Current Registration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Academic Year:</span>
                      <span className="text-sm font-medium">{selectedStudent?.academicYear?.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Class:</span>
                      <span className="text-sm font-medium">{selectedStudent?.class?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Term:</span>
                      <span className="text-sm font-medium">{selectedStudent?.term?.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Parent:</span>
                      <span className="text-sm font-medium">{selectedStudent?.parent?.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reg Number:</span>
                      <span className="text-sm font-medium">{selectedStudent?.registrationNumber || "Not set"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* New Registration */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>New Registration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Academic Year:</span>
                      <span className="text-sm font-medium">{getNewAcademicYear()?.year || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Class:</span>
                      <span className="text-sm font-medium">{getNewClass()?.name || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Term:</span>
                      <span className="text-sm font-medium">{getNewTerm()?.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Parent:</span>
                      <span className="text-sm font-medium">{getNewParent()?.name || "Not set"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-academic-year">Academic Year *</Label>
                  <Select
                    value={reRegisterForm.academicYearId}
                    onValueChange={(value) => setReRegisterForm((prev) => ({ ...prev, academicYearId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year} {year.isActive && "(Active)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-class">Class *</Label>
                  <Select
                    value={reRegisterForm.classId}
                    onValueChange={(value) => setReRegisterForm((prev) => ({ ...prev, classId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-term">Term</Label>
                  <Select
                    value={reRegisterForm.termId}
                    onValueChange={(value) => setReRegisterForm((prev) => ({ ...prev, termId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No term</SelectItem>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name} - {term.academicYear.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-parent">Parent</Label>
                  <Select
                    value={reRegisterForm.parentId}
                    onValueChange={(value) => setReRegisterForm((prev) => ({ ...prev, parentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent</SelectItem>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsReRegisterDialogOpen(false)} disabled={reRegisterLoading}>
                Cancel
              </Button>
              <Button
                onClick={submitReRegistration}
                disabled={reRegisterLoading || !reRegisterForm.academicYearId || !reRegisterForm.classId}
                className="bg-green-600 hover:bg-green-700"
              >
                {reRegisterLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Re-Registering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-Register Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
