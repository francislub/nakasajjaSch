"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, Users, Edit, Trash2, RefreshCw, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  academicYear: {
    id: string
    year: string
  }
  students?: any[]
  studentCount?: number
  _count?: {
    students: number
  }
}

interface AcademicYear {
  id: string
  year: string
  isActive: boolean
}

interface Student {
  id: string
  name: string
  email?: string
  class?: {
    id: string
    name: string
  }
  parent?: {
    id: string
    name: string
  }
  academicYear?: {
    id: string
    year: string
  }
  term?: {
    id: string
    name: string
  }
}

interface Class {
  id: string
  name: string
}

interface Parent {
  id: string
  name: string
  email: string
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReRegisterDialogOpen, setIsReRegisterDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [reRegisterLoading, setReRegisterLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    academicYearId: "",
  })

  const [reRegisterForm, setReRegisterForm] = useState({
    academicYearId: "",
    classId: "",
    termId: "",
    parentId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [termsResponse, academicYearsResponse, studentsResponse, classesResponse, parentsResponse] =
        await Promise.all([
          fetch("/api/terms"),
          fetch("/api/academic-years"),
          fetch("/api/students"),
          fetch("/api/classes"),
          fetch("/api/users/parents"),
        ])

      if (!termsResponse.ok || !academicYearsResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const [termsData, academicYearsData, studentsData, classesData, parentsData] = await Promise.all([
        termsResponse.json(),
        academicYearsResponse.json(),
        studentsResponse.json(),
        classesResponse.json(),
        parentsResponse.json(),
      ])

      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])
      setStudents(studentsData.students || [])
      setClasses(classesData.classes || [])
      setParents(parentsData.parents || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTerm ? `/api/terms/${editingTerm.id}` : "/api/terms"
      const method = editingTerm ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Term ${editingTerm ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setEditingTerm(null)
        setFormData({ name: "", startDate: "", endDate: "", academicYearId: "" })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save term")
      }
    } catch (error) {
      console.error("Error saving term:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save term",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (term: Term) => {
    setEditingTerm(term)
    setFormData({
      name: term.name,
      startDate: term.startDate.split("T")[0],
      endDate: term.endDate.split("T")[0],
      academicYearId: term.academicYear.id,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term?")) return

    try {
      const response = await fetch(`/api/terms/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Term deleted successfully",
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete term")
      }
    } catch (error) {
      console.error("Error deleting term:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete term",
        variant: "destructive",
      })
    }
  }

  const handleReRegister = (term: Term) => {
    setSelectedTerm(term)
    setReRegisterForm({
      academicYearId: "",
      classId: "",
      termId: "",
      parentId: "",
    })
    setSelectedStudents([])
    setIsReRegisterDialogOpen(true)
  }

  const getTermStudents = (term: Term) => {
    return students.filter(
      (student) => student.term?.id === term.id && student.academicYear?.id === term.academicYear.id,
    )
  }

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents((prev) => [...prev, studentId])
    } else {
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId))
    }
  }

  const submitReRegistration = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student to re-register",
        variant: "destructive",
      })
      return
    }

    if (!reRegisterForm.academicYearId || !reRegisterForm.classId) {
      toast({
        title: "Error",
        description: "Academic year and class are required",
        variant: "destructive",
      })
      return
    }

    try {
      setReRegisterLoading(true)

      const promises = selectedStudents.map((studentId) =>
        fetch(`/api/students/${studentId}/re-register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reRegisterForm),
        }),
      )

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map((r) => r.json()))

      const successful = responses.filter((r) => r.ok).length
      const failed = responses.length - successful

      if (successful > 0) {
        toast({
          title: "Success",
          description: `${successful} student(s) re-registered successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        })
        setIsReRegisterDialogOpen(false)
        fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to re-register students",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error re-registering students:", error)
      toast({
        title: "Error",
        description: "Failed to re-register students",
        variant: "destructive",
      })
    } finally {
      setReRegisterLoading(false)
    }
  }

  const getStudentCount = (term: Term): number => {
    if (term.studentCount !== undefined) return term.studentCount
    if (term._count?.students !== undefined) return term._count.students
    if (term.students?.length !== undefined) return term.students.length
    return getTermStudents(term).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terms Management</h1>
          <p className="text-gray-600 mt-1">Manage academic terms and student enrollments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTerm ? "Edit" : "Add"} Term</DialogTitle>
              <DialogDescription>
                {editingTerm ? "Update" : "Create a new"} term for an academic year.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
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
              <div>
                <Label htmlFor="name">Term Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Term 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingTerm(null)
                    setFormData({ name: "", startDate: "", endDate: "", academicYearId: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingTerm ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terms.map((term) => (
          <Card key={term.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{term.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(term)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(term.id)}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-blue-600 font-medium">
                {term.academicYear?.year || "Unknown Academic Year"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {getStudentCount(term)} students enrolled
                </div>
              </div>

              {getStudentCount(term) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReRegister(term)}
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Re-Register Students
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {terms.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Terms</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first term.</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Re-Registration Dialog */}
      <Dialog open={isReRegisterDialogOpen} onOpenChange={setIsReRegisterDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <span>Re-Register Students from {selectedTerm?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Select students from {selectedTerm?.name} ({selectedTerm?.academicYear?.year}) to re-register for a new
              academic year, class, or term.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* New Registration Form */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>New Registration Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Students Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Students to Re-Register</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedStudents.length} of {getTermStudents(selectedTerm || ({} as Term)).length} selected
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getTermStudents(selectedTerm || ({} as Term)).map((student) => (
                    <div key={student.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.class?.name} • {student.parent?.name}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {getTermStudents(selectedTerm || ({} as Term)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No students found for this term</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsReRegisterDialogOpen(false)} disabled={reRegisterLoading}>
                Cancel
              </Button>
              <Button
                onClick={submitReRegistration}
                disabled={
                  reRegisterLoading ||
                  selectedStudents.length === 0 ||
                  !reRegisterForm.academicYearId ||
                  !reRegisterForm.classId
                }
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
                    Re-Register {selectedStudents.length} Student(s)
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
