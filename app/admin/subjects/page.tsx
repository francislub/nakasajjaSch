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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, BookOpen, Edit, Trash2, Eye, User, GraduationCap, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Subject {
  id: string
  name: string
  code: string
  category: "GENERAL" | "SUBSIDIARY"
  createdAt: string
  class?: {
    id: string
    name: string
  }
  academicYear?: {
    id: string
    year: string
  }
  subjectTeachers: {
    id: string
    teacher: {
      id: string
      name: string
    }
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
  }[]
}

interface Class {
  id: string
  name: string
}

interface Teacher {
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

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("active")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "GENERAL" as "GENERAL" | "SUBSIDIARY",
    classId: "",
    academicYearId: "",
  })

  const [assignmentData, setAssignmentData] = useState({
    teacherId: "",
    classId: "",
    termId: "",
    academicYearId: "",
  })

  useEffect(() => {
    fetchData()
  }, [selectedAcademicYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subjectsRes, classesRes, teachersRes, termsRes, academicYearsRes] = await Promise.all([
        fetch(`/api/subjects?academicYearId=${selectedAcademicYear}&search=${searchTerm}`),
        fetch("/api/classes"),
        fetch("/api/users/teachers"),
        fetch("/api/terms"),
        fetch("/api/academic-years"),
      ])

      const [subjectsData, classesData, teachersData, termsData, academicYearsData] = await Promise.all([
        subjectsRes.json(),
        classesRes.json(),
        teachersRes.json(),
        termsRes.json(),
        academicYearsRes.json(),
      ])

      setSubjects(subjectsData || [])
      setClasses(classesData || [])
      setTeachers(teachersData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])

      // Set default academic year for forms
      const activeYear = academicYearsData?.find((year: AcademicYear) => year.isActive)
      if (activeYear) {
        setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }))
        setAssignmentData((prev) => ({ ...prev, academicYearId: activeYear.id }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subject",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) return

    try {
      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subject",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) return

    try {
      const response = await fetch("/api/subject-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentData,
          subjectId: selectedSubject.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher assigned successfully",
        })
        setIsAssignDialogOpen(false)
        resetAssignmentForm()
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign teacher",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    const activeYear = academicYears.find((year) => year.isActive)
    setFormData({
      name: "",
      code: "",
      category: "GENERAL",
      classId: "",
      academicYearId: activeYear?.id || "default",
    })
    setSelectedSubject(null)
  }

  const resetAssignmentForm = () => {
    const activeYear = academicYears.find((year) => year.isActive)
    setAssignmentData({
      teacherId: "",
      classId: "",
      termId: "",
      academicYearId: activeYear?.id || "default",
    })
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      classId: subject.class?.id || "default",
      academicYearId: subject.academicYear?.id || "default",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsViewDialogOpen(true)
  }

  const openAssignDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    resetAssignmentForm()
    setIsAssignDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    return category === "GENERAL" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
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
          <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-600 mt-1">Manage subjects, categories, and teacher assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>Create a new subject with category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., MATH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "GENERAL" | "SUBSIDIARY") => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General (Used for Division)</SelectItem>
                    <SelectItem value="SUBSIDIARY">Subsidiary (Not for Division)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="classId">Assign to Class (Optional)</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">No specific class</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Subjects</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="min-w-[200px]">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Academic Year</SelectItem>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} {year.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Subject Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input
                id="edit-code"
                placeholder="e.g., MATH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: "GENERAL" | "SUBSIDIARY") => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General (Used for Division)</SelectItem>
                  <SelectItem value="SUBSIDIARY">Subsidiary (Not for Division)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-classId">Assign to Class</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">No specific class</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-academicYearId">Academic Year</Label>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Subject
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
            <DialogDescription>View subject information and teacher assignments.</DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Subject Name</Label>
                  <p className="text-sm font-semibold">{selectedSubject.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Subject Code</Label>
                  <p className="text-sm">{selectedSubject.code || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <Badge className={getCategoryColor(selectedSubject.category)}>{selectedSubject.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Class</Label>
                  <p className="text-sm">{selectedSubject.class?.name || "All classes"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Academic Year</Label>
                  <p className="text-sm">{selectedSubject.academicYear?.year || "Not set"}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Teacher Assignments</Label>
                <div className="space-y-2 mt-2">
                  {selectedSubject.subjectTeachers.length > 0 ? (
                    selectedSubject.subjectTeachers.map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{assignment.teacher.name}</p>
                            <p className="text-xs text-gray-600">
                              {assignment.class.name} - {assignment.term.name} ({assignment.academicYear.year})
                            </p>
                          </div>
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No teacher assignments</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Assign a teacher to {selectedSubject?.name} for a specific class and term.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div>
              <Label htmlFor="teacherId">Teacher *</Label>
              <Select
                value={assignmentData.teacherId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, teacherId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-classId">Class *</Label>
              <Select
                value={assignmentData.classId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, classId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">No specific class</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="termId">Term *</Label>
              <Select
                value={assignmentData.termId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, termId: value })}
              >
                <SelectTrigger>
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
            </div>
            <div>
              <Label htmlFor="assign-academicYearId">Academic Year *</Label>
              <Select
                value={assignmentData.academicYearId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, academicYearId: value })}
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Assign Teacher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Subjects</span>
            {selectedAcademicYear === "active" && (
              <Badge variant="outline" className="ml-2">
                Active Academic Year
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Manage subjects, categories, and teacher assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{subject.code || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(subject.category)}>{subject.category}</Badge>
                  </TableCell>
                  <TableCell>{subject.class?.name || "All classes"}</TableCell>
                  <TableCell>{subject.academicYear?.year || "Not set"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{subject.subjectTeachers.length}</span>
                      <span className="text-sm text-gray-600">assigned</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(subject)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(subject)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAssignDialog(subject)}>
                        <User className="w-3 h-3 mr-1" />
                        Assign
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the subject "{subject.name}"
                              and all associated teacher assignments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(subject.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {subjects.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects</h3>
              <p className="text-gray-600 mb-4">
                {selectedAcademicYear === "active"
                  ? "No subjects found for the active academic year."
                  : "Get started by adding your first subject."}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
